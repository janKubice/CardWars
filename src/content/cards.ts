import type { CardDef } from '../engine/types.ts';

// ─────────────────────────────────────────────────────────────────────────
//  OBSAH = DATA. Přidání karty = nový záznam, žádná nová logika.
//  Schopnosti se skládají z registrovaných efektů a cílů (viz docs/03, docs/04).
//  Tenhle starter set záměrně pokrývá většinu keywordů, ať je co testovat.
// ─────────────────────────────────────────────────────────────────────────

export const CARD_DEFS: CardDef[] = [
  // Královna — cíl hry. HP vysoké, malý útok.
  { id: 'queen', name: 'Královna', rarity: 'legendary', cost: 0, hp: 30, attack: 1, range: 1, isQueen: true },

  // Token pro Rojovou královnu
  { id: 'swarmling', name: 'Roj', rarity: 'common', cost: 0, hp: 1, attack: 1, range: 1, tags: ['token'] },

  // ── Bossové Královny (soupeř v pozdějších ante) ──
  {
    id: 'queen_swarm', name: 'Rojová královna', rarity: 'legendary', cost: 0, hp: 32, attack: 1, range: 1, isQueen: true,
    abilities: [{ trigger: 'upkeepStart', effect: 'summon', target: 'none', params: { defId: 'swarmling' } }],
  },
  { id: 'queen_thorn', name: 'Trnová královna', rarity: 'legendary', cost: 0, hp: 34, attack: 1, range: 1, isQueen: true, keywords: ['thorns'] },
  { id: 'queen_blood', name: 'Krvavá královna', rarity: 'legendary', cost: 0, hp: 32, attack: 2, range: 1, isQueen: true, keywords: ['bloodthirst'] },
  {
    id: 'queen_fire', name: 'Ohnivá královna', rarity: 'legendary', cost: 0, hp: 30, attack: 1, range: 1, isQueen: true,
    abilities: [{ trigger: 'upkeepStart', effect: 'damage', target: 'allEnemies', params: { value: 1 } }],
  },
  {
    id: 'queen_war', name: 'Velící královna', rarity: 'legendary', cost: 0, hp: 32, attack: 2, range: 1, isQueen: true,
    abilities: [{ trigger: 'aura', effect: 'buff', target: 'around', params: { atk: 1, side: 'ally' } }],
  },
  {
    id: 'queen_titan', name: 'Titánská královna', rarity: 'legendary', cost: 0, hp: 44, attack: 3, range: 1, isQueen: true, keywords: ['thorns'],
    abilities: [{ trigger: 'upkeepStart', effect: 'summon', target: 'none', params: { defId: 'swarmling' } }],
  },

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
    abilities: [{ trigger: 'aura', effect: 'buff', target: 'around', params: { atk: 1, side: 'ally' } }],
  },

  // ── Aury a aktivní schopnosti ──
  {
    id: 'banner', name: 'Válečná standarta', rarity: 'rare', cost: 3, hp: 4, attack: 0, range: 1,
    abilities: [{ trigger: 'aura', effect: 'buff', target: 'around', params: { atk: 1, side: 'ally' } }],
  },
  {
    id: 'zealot', name: 'Fanatik', rarity: 'uncommon', cost: 3, hp: 3, attack: 2, range: 1,
    abilities: [{ trigger: 'active', effect: 'buff', target: 'self', params: { atk: 1, hp: 1, cost: 1 } }],
  },
  {
    id: 'healer', name: 'Léčitel', rarity: 'uncommon', cost: 3, hp: 3, attack: 1, range: 1,
    abilities: [{ trigger: 'active', effect: 'heal', target: 'chosen', params: { value: 2, side: 'ally', cost: 1 } }],
  },
  {
    id: 'zapper', name: 'Zaklínač', rarity: 'rare', cost: 4, hp: 3, attack: 1, range: 1,
    abilities: [{ trigger: 'active', effect: 'damage', target: 'chosen', params: { value: 2, side: 'enemy', range: 3, cost: 1 } }],
  },

  // ── Rozšíření poolu (push / bounce / silence / random / summon) ──
  // Common
  { id: 'slinger', name: 'Prakovník', rarity: 'common', cost: 1, hp: 1, attack: 1, range: 2 },
  {
    id: 'squire', name: 'Panoš', rarity: 'common', cost: 1, hp: 2, attack: 1, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'shield', target: 'self', params: { value: 1 } }],
  },
  { id: 'brute', name: 'Rváč', rarity: 'common', cost: 3, hp: 5, attack: 3, range: 1 },
  { id: 'scout', name: 'Zvěd', rarity: 'common', cost: 2, hp: 2, attack: 2, range: 1, keywords: ['charge'] },

  // Uncommon
  {
    id: 'shover', name: 'Postrkovač', rarity: 'uncommon', cost: 2, hp: 2, attack: 2, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'push', target: 'neighbor', params: { direction: 'forward', side: 'enemy' } }],
  },
  {
    id: 'sapper', name: 'Zákopník', rarity: 'uncommon', cost: 2, hp: 2, attack: 2, range: 1, tags: ['Explosive'],
    abilities: [{ trigger: 'death', effect: 'damage', target: 'aroundVictim', params: { value: 2, side: 'any' } }],
  },
  {
    id: 'cleric', name: 'Klerik', rarity: 'uncommon', cost: 3, hp: 3, attack: 1, range: 1,
    abilities: [{ trigger: 'upkeepStart', effect: 'heal', target: 'lowestHpAlly', params: { value: 1 } }],
  },
  {
    id: 'hexer', name: 'Kletbář', rarity: 'uncommon', cost: 3, hp: 2, attack: 2, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'buff', target: 'randomEnemy', params: { atk: -1 } }],
  },

  // Rare
  { id: 'sniper', name: 'Odstřelovač', rarity: 'rare', cost: 4, hp: 2, attack: 3, range: 4 },
  {
    id: 'bouncer', name: 'Vyhazovač', rarity: 'rare', cost: 3, hp: 3, attack: 2, range: 1,
    abilities: [{ trigger: 'active', effect: 'bounce', target: 'chosen', params: { side: 'enemy', cost: 1 } }],
  },
  {
    id: 'silencer', name: 'Umlčovač', rarity: 'rare', cost: 3, hp: 3, attack: 2, range: 1,
    abilities: [{ trigger: 'active', effect: 'silence', target: 'chosen', params: { side: 'any', cost: 1 } }],
  },
  {
    id: 'summoner', name: 'Přivolávač', rarity: 'rare', cost: 4, hp: 3, attack: 1, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'summon', target: 'none', params: { defId: 'recruit' } }],
  },

  // Epic
  {
    id: 'warlord', name: 'Válečník', rarity: 'epic', cost: 6, hp: 6, attack: 3, range: 1,
    abilities: [{ trigger: 'aura', effect: 'buff', target: 'around', params: { atk: 2, side: 'ally' } }],
  },
  {
    id: 'plague', name: 'Morová vrána', rarity: 'epic', cost: 5, hp: 4, attack: 2, range: 1,
    abilities: [{ trigger: 'upkeepStart', effect: 'damage', target: 'allEnemies', params: { value: 1 } }],
  },

  // Legendary
  {
    id: 'archmage', name: 'Arcimág', rarity: 'legendary', cost: 7, hp: 5, attack: 2, range: 1,
    abilities: [{ trigger: 'active', effect: 'damage', target: 'chosen', params: { value: 3, side: 'enemy', range: 5, cost: 2 } }],
  },
  { id: 'titan', name: 'Titán', rarity: 'legendary', cost: 8, hp: 10, attack: 6, range: 1, keywords: ['fragile', 'charge'] },

  // ── Kombo / synergie (energie navíc = řetězení vyložení, tag synergie) ──
  {
    id: 'ritualist', name: 'Ritualista', rarity: 'uncommon', cost: 2, hp: 1, attack: 2, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'energy', target: 'none', params: { value: 2 } }],
  },
  {
    id: 'collector', name: 'Sběratel', rarity: 'uncommon', cost: 2, hp: 1, attack: 2, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'draw', target: 'none', params: { value: 2 } }],
  },
  {
    id: 'catalyst', name: 'Katalyzátor', rarity: 'rare', cost: 3, hp: 2, attack: 2, range: 1,
    abilities: [
      { trigger: 'deploy', effect: 'draw', target: 'none', params: { value: 1 } },
      { trigger: 'deploy', effect: 'energy', target: 'none', params: { value: 1 } },
    ],
  },
  {
    id: 'pyromaniac', name: 'Pyromaniak', rarity: 'rare', cost: 3, hp: 2, attack: 2, range: 1, tags: ['Explosive'],
    abilities: [{ trigger: 'deploy', effect: 'buff', target: 'alliesTag', params: { atk: 1, tag: 'Explosive' } }],
  },
  {
    id: 'grandmaster', name: 'Velmistr', rarity: 'epic', cost: 4, hp: 3, attack: 3, range: 1,
    abilities: [{ trigger: 'deploy', effect: 'energy', target: 'none', params: { value: 3 } }],
  },

  // ── Combo motory: „extra pokládání" (allyDeploy) + „řetězení výbuchů" ──
  // Dirigent roste za KAŽDOU kartu, kterou tento tah/hru vyložíš (škáluje s energií).
  {
    id: 'conductor', name: 'Dirigent', rarity: 'rare', cost: 3, hp: 4, attack: 1, range: 1,
    abilities: [{ trigger: 'allyDeploy', effect: 'buff', target: 'self', params: { atk: 1 } }],
  },
  // Jiskřič pálí náhodného nepřítele pokaždé, když něco vyložíš — spellslinger combo.
  {
    id: 'sparkmage', name: 'Jiskřič', rarity: 'epic', cost: 4, hp: 3, attack: 1, range: 2,
    abilities: [{ trigger: 'allyDeploy', effect: 'damage', target: 'randomEnemy', params: { value: 1 } }],
  },
  // Granátník: další Explosive death-bomber — výbuchy se řetězí (sapper → granátník → …).
  {
    id: 'grenadier', name: 'Granátník', rarity: 'uncommon', cost: 2, hp: 2, attack: 1, range: 1, tags: ['Explosive'],
    abilities: [{ trigger: 'death', effect: 'damage', target: 'aroundVictim', params: { value: 2, side: 'any' } }],
  },
];

export const LIBRARY: Record<string, CardDef> = Object.fromEntries(CARD_DEFS.map((d) => [d.id, d]));
