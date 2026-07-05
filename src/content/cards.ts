import type { CardDef } from '../engine/types.ts';

// ─────────────────────────────────────────────────────────────────────────
//  OBSAH = DATA. Přidání karty = nový záznam, žádná nová logika.
//  Schopnosti se skládají z registrovaných efektů a cílů (viz docs/03, docs/04).
//  Tenhle starter set záměrně pokrývá většinu keywordů, ať je co testovat.
// ─────────────────────────────────────────────────────────────────────────

export const CARD_DEFS: CardDef[] = [
  // Královna — cíl hry. HP vysoké, malý útok, zatím bez signature schopnosti.
  { id: 'queen', name: 'Královna', rarity: 'legendary', cost: 0, hp: 30, attack: 1, range: 1, isQueen: true },

  // ── Common ──
  { id: 'recruit', name: 'Rekrut', rarity: 'common', cost: 1, hp: 2, attack: 2, range: 1 },
  { id: 'spearman', name: 'Kopiník', rarity: 'common', cost: 2, hp: 3, attack: 2, range: 1, keywords: ['charge'] },
  { id: 'archer', name: 'Lučištník', rarity: 'common', cost: 2, hp: 2, attack: 2, range: 2 },
  {
    id: 'medic', name: 'Zdravotník', rarity: 'common', cost: 2, hp: 3, attack: 0, range: 1,
    abilities: [{ trigger: 'upkeepStart', effect: 'heal', target: 'neighbor', params: { direction: 'forward', side: 'ally', value: 1 } }],
  },
  { id: 'wall', name: 'Křeček-zeď', rarity: 'common', cost: 3, hp: 6, attack: 0, range: 1 },

  // ── Uncommon ──
  {
    id: 'minelayer', name: 'Minér', rarity: 'uncommon', cost: 3, hp: 4, attack: 2, range: 1, tags: ['Explosive'],
    abilities: [{ trigger: 'deploy', effect: 'terrain', target: 'none', params: { terrain: 'mine', damage: 2 } }],
  },
  {
    id: 'reaper', name: 'Kosec', rarity: 'uncommon', cost: 3, hp: 3, attack: 2, range: 1,
    abilities: [{ trigger: 'upkeepStart', effect: 'damage', target: 'direction', params: { direction: 'forwardRight', range: 1, side: 'enemy', value: 2 } }],
  },
  {
    id: 'protector', name: 'Ochránce', rarity: 'uncommon', cost: 2, hp: 3, attack: 1, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'shield', target: 'lowestHpAlly', params: { excludeSelf: true, value: 3 } }],
  },
  { id: 'berserk', name: 'Berserk', rarity: 'uncommon', cost: 2, hp: 4, attack: 3, range: 1, keywords: ['fragile'] },
  {
    id: 'courier', name: 'Kurýr', rarity: 'uncommon', cost: 2, hp: 2, attack: 1, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'draw', target: 'none', params: { value: 1 } }],
  },
  {
    id: 'vengetree', name: 'Mstivý strom', rarity: 'uncommon', cost: 3, hp: 5, attack: 1, range: 1,
    abilities: [{ trigger: 'onHeal', effect: 'buff', target: 'self', params: { atk: 1 } }],
  },
  {
    id: 'runeshield', name: 'Runový štít', rarity: 'uncommon', cost: 2, hp: 3, attack: 1, range: 1,
    abilities: [{ trigger: 'onShield', effect: 'damage', target: 'direction', params: { direction: 'forward', range: 1, side: 'enemy', value: 1 } }],
  },

  // ── Rare ──
  {
    id: 'avenger', name: 'Mstitel', rarity: 'rare', cost: 3, hp: 3, attack: 3, range: 1,
    abilities: [{ trigger: 'death', effect: 'discardRandom', target: 'none' }],
  },
  {
    id: 'timebomb', name: 'Časovaná bomba', rarity: 'rare', cost: 4, hp: 3, attack: 0, range: 1, tags: ['Explosive'],
    abilities: [{ trigger: 'countdown', effect: 'damage', target: 'around', params: { count: 3, side: 'any', value: 4 } }],
  },
  { id: 'cannon', name: 'Dělo', rarity: 'rare', cost: 4, hp: 3, attack: 4, range: 3 },

  // ── Epic ──
  {
    id: 'pyro', name: 'Pyroman', rarity: 'epic', cost: 5, hp: 4, attack: 2, range: 1, tags: ['Explosive'],
    abilities: [{ trigger: 'kill', effect: 'damage', target: 'aroundVictim', params: { side: 'any', value: 2 } }],
  },
  {
    id: 'commander', name: 'Velitel', rarity: 'epic', cost: 5, hp: 5, attack: 2, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'buff', target: 'around', params: { atk: 1, side: 'ally' } }],
  },
];

export const LIBRARY: Record<string, CardDef> = Object.fromEntries(CARD_DEFS.map((d) => [d.id, d]));
