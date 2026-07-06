import type { CardDef, GameConfig, PlayerId, Rarity, RngState } from '../engine/index.ts';
import { makeRng, nextFloat, nextInt } from '../engine/index.ts';
import { CARD_DEFS, LIBRARY } from '../content/cards.ts';

// ─────────────────────────────────────────────────────────────────────────
//  ROGUELIKE RUN — čistá logika (bez DOM). Obchod, ekonomika, série soubojů.
//  Soubojový engine je per-battle; run drží jen data (balíček, zlato, ante).
//  Ladicí konstanty jsou pohromadě nahoře.
// ─────────────────────────────────────────────────────────────────────────

export const MAX_ANTE = 8;
const START_GOLD = 4;
const SHOP_SIZE = 5;
const MIN_DECK = 8;
const REROLL_BASE = 1;
export const REMOVE_COST = 2;
export const MAX_LEVEL = 3;

/** Cena vylepšení karty z aktuální úrovně na další. */
export function upgradeCost(level: number): number {
  return 3 + level * 3;
}

const PRICE: Record<Rarity, number> = { common: 3, uncommon: 4, rare: 6, epic: 8, legendary: 11 };

function goldReward(ante: number): number {
  return 4 + ante;
}

// Startovní balíček runu — malý a levný, ať obchod hned něco znamená.
const STARTER_RUN_DECK: string[] = [
  'recruit', 'recruit', 'recruit',
  'spearman', 'spearman',
  'archer', 'archer',
  'medic',
  'wall', 'wall',
  'protector',
  'berserk',
];

export interface ShopItem {
  defId: string;
  price: number;
  sold: boolean;
}

export type RunStatus = 'shop' | 'battle' | 'won' | 'lost';

export interface RunState {
  deck: string[];
  levels: Record<string, number>;
  gold: number;
  ante: number;
  wins: number;
  status: RunStatus;
  shop: ShopItem[];
  rerollCost: number;
  rng: RngState;
}

const BUYABLE: CardDef[] = CARD_DEFS.filter((d) => !d.isQueen && !(d.tags ?? []).includes('token'));

// Boss Královny soupeře podle ante (mezi obyčejnými, finále = Titánská).
const BOSS_BY_ANTE: string[] = [
  'queen', 'queen_swarm', 'queen', 'queen_thorn',
  'queen_fire', 'queen_blood', 'queen_war', 'queen_titan',
];

/** Id Královny soupeře pro dané ante. */
export function bossQueenFor(ante: number): string {
  return BOSS_BY_ANTE[Math.min(ante, BOSS_BY_ANTE.length) - 1] ?? 'queen';
}
const BY_RARITY: Record<Rarity, CardDef[]> = groupByRarity(BUYABLE);

function groupByRarity(defs: CardDef[]): Record<Rarity, CardDef[]> {
  const out: Record<Rarity, CardDef[]> = { common: [], uncommon: [], rare: [], epic: [], legendary: [] };
  for (const d of defs) out[d.rarity].push(d);
  return out;
}

// Váhy rarit posunuté s postupem runu (pozdější ante = lepší karty).
function rarityWeights(ante: number): Record<Rarity, number> {
  const t = (ante - 1) / (MAX_ANTE - 1);
  return {
    common: Math.max(1, 10 - 6 * t),
    uncommon: 6,
    rare: 2 + 5 * t,
    epic: 0.5 + 3 * t,
    legendary: 0.2 + 1.5 * t,
  };
}

function pickRarity(rng: RngState, ante: number): Rarity {
  const w = rarityWeights(ante);
  const rarities = Object.keys(w) as Rarity[];
  let total = 0;
  for (const r of rarities) total += w[r];
  let roll = nextFloat(rng) * total;
  for (const r of rarities) {
    roll -= w[r];
    if (roll <= 0) return r;
  }
  return 'common';
}

function pickDef(rng: RngState, ante: number): CardDef {
  for (let tries = 0; tries < 8; tries++) {
    const rarity = pickRarity(rng, ante);
    const pool = BY_RARITY[rarity];
    if (pool.length > 0) return pool[nextInt(rng, pool.length)];
  }
  return BUYABLE[nextInt(rng, BUYABLE.length)];
}

export function createRun(seed: number): RunState {
  const run: RunState = {
    deck: [...STARTER_RUN_DECK],
    levels: {},
    gold: START_GOLD,
    ante: 1,
    wins: 0,
    status: 'shop',
    shop: [],
    rerollCost: REROLL_BASE,
    rng: makeRng(seed),
  };
  generateShop(run);
  return run;
}

export function generateShop(run: RunState): void {
  run.shop = [];
  for (let i = 0; i < SHOP_SIZE; i++) {
    const def = pickDef(run.rng, run.ante);
    run.shop.push({ defId: def.id, price: PRICE[def.rarity], sold: false });
  }
  run.rerollCost = REROLL_BASE;
}

export function reroll(run: RunState): boolean {
  if (run.gold < run.rerollCost) return false;
  run.gold -= run.rerollCost;
  const cost = run.rerollCost;
  generateShop(run);
  run.rerollCost = cost + 1;
  return true;
}

export function buy(run: RunState, index: number): boolean {
  const item = run.shop[index];
  if (!item || item.sold || run.gold < item.price) return false;
  run.gold -= item.price;
  run.deck.push(item.defId);
  item.sold = true;
  return true;
}

export function removeCard(run: RunState, defId: string): boolean {
  if (run.gold < REMOVE_COST || run.deck.length <= MIN_DECK) return false;
  const idx = run.deck.indexOf(defId);
  if (idx < 0) return false;
  run.gold -= REMOVE_COST;
  run.deck.splice(idx, 1);
  return true;
}

export function levelOf(run: RunState, defId: string): number {
  return run.levels[defId] ?? 0;
}

export function canUpgrade(run: RunState, defId: string): boolean {
  const lvl = levelOf(run, defId);
  return lvl < MAX_LEVEL && run.gold >= upgradeCost(lvl) && run.deck.includes(defId);
}

/** Vylepší kartu daného id (+1/+1 všem kopiím tohoto druhu v balíčku). */
export function upgrade(run: RunState, defId: string): boolean {
  if (!canUpgrade(run, defId)) return false;
  const lvl = levelOf(run, defId);
  run.gold -= upgradeCost(lvl);
  run.levels[defId] = lvl + 1;
  return true;
}

/** Vygeneruje botí balíček pro dané ante (o něco napřed proti hráči). */
export function botDeck(rng: RngState, ante: number): string[] {
  const deck: string[] = ['recruit', 'recruit', 'spearman', 'archer', 'wall'];
  const extra = 11 + ante; // sílí s ante
  for (let i = 0; i < extra; i++) deck.push(pickDef(rng, ante + 1).id);
  return deck;
}

export function makeBattleConfig(run: RunState): GameConfig {
  const decks: Record<PlayerId, string[]> = {
    A: [...run.deck],
    B: botDeck(run.rng, run.ante),
  };
  const levels: Record<PlayerId, Record<string, number>> = { A: { ...run.levels }, B: {} };
  const queens: Record<PlayerId, string> = { A: 'queen', B: bossQueenFor(run.ante) };
  return { library: LIBRARY, decks, levels, queens, seed: nextInt(run.rng, 1e9) };
}

export function onBattleWin(run: RunState): void {
  run.gold += goldReward(run.ante);
  run.wins += 1;
  if (run.ante >= MAX_ANTE) {
    run.status = 'won';
    return;
  }
  run.ante += 1;
  run.status = 'shop';
  generateShop(run);
}

export function onBattleLoss(run: RunState): void {
  run.status = 'lost';
}

export function startBattle(run: RunState): void {
  run.status = 'battle';
}

/** Přehled balíčku pro UI: počet kusů + jméno, seřazeno podle ceny. */
export function deckSummary(run: RunState): { defId: string; name: string; cost: number; count: number; level: number }[] {
  const counts = new Map<string, number>();
  for (const id of run.deck) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([defId, count]) => {
      const def = LIBRARY[defId];
      return { defId, name: def.name, cost: def.cost, count, level: levelOf(run, defId) };
    })
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
}

export function cardDef(defId: string): CardDef {
  return LIBRARY[defId];
}
