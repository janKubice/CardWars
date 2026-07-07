// Základní datové typy enginu. Žádná logika, žádný DOM — čistá data.

export type PlayerId = 'A' | 'B';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Edge = 'top' | 'bottom';

/**
 * Trigger je záměrně `string`, ne uzavřený enum — díky tomu jde přidat nový
 * trigger bez zásahu do typů. Známé triggery jsou v konstantě TRIGGERS níže.
 */
export type TriggerType = string;

export const TRIGGERS = {
  deploy: 'deploy',
  /** vyvolá se na mých OSTATNÍCH jednotkách, když vyložím kartu (combo motor) */
  allyDeploy: 'allyDeploy',
  death: 'death',
  wound: 'wound',
  onHeal: 'onHeal',
  onShield: 'onShield',
  attack: 'attack',
  kill: 'kill',
  upkeepStart: 'upkeepStart',
  upkeepEnd: 'upkeepEnd',
  countdown: 'countdown',
  aura: 'aura',
  active: 'active',
} as const;

export interface Position {
  row: number;
  col: number;
}

/**
 * Jedna schopnost = trojice Trigger -> Efekt -> Cíl (+ parametry).
 * `effect` a `target` jsou klíče do registru (viz registries.ts) — proto string.
 */
export interface AbilityDef {
  trigger: TriggerType;
  effect: string;
  target: string;
  params?: Record<string, unknown>;
}

/** Statická definice karty ("blueprint"). Přenositelná 1:1 do C# verze. */
export interface CardDef {
  id: string;
  name: string;
  rarity: Rarity;
  cost: number;
  hp: number;
  attack: number;
  range: number;
  tags?: string[];
  /** pasivní příznaky, např. 'charge' (Nájezd), 'fragile' (Křehkost) */
  keywords?: string[];
  abilities?: AbilityDef[];
  isQueen?: boolean;
  flavor?: string;
}

/** Běžící instance karty na desce nebo v ruce (mutovatelný stav). */
export interface CardInstance {
  uid: number;
  defId: string;
  name: string;
  owner: PlayerId;
  cost: number;
  hp: number;
  maxHp: number;
  /** aktuální (efektivní) útok = baseAttack + aury */
  attack: number;
  /** trvalý útok (def + level + trvalé buffy), bez aur */
  baseAttack: number;
  range: number;
  shield: number;
  pos: Position | null;
  zone: 'hand' | 'board' | 'dead';
  hasAttacked: boolean;
  justPlayed: boolean;
  activeUsed: boolean;
  /** pochází z balíčku (po zničení se recykluje do odhozu); tokeny ne */
  fromDeck: boolean;
  counters: Record<string, number>;
  abilities: AbilityDef[];
  keywords: string[];
  tags: string[];
  isQueen: boolean;
}

export interface TerrainCell {
  type: string;
  params?: Record<string, unknown>;
}

export interface PlayerState {
  id: PlayerId;
  energy: number;
  maxEnergy: number;
  homeEdge: Edge;
  hand: number[];
  deck: string[];
  /** odhoz (padlé/zahozené karty) — recykluje se zpět do balíčku, když dojde */
  discard: string[];
  handLimit: number;
  /** kolikrát hráč tahal z prázdného balíčku (roste zranění únavou) */
  fatigue: number;
  /** úrovně vylepšení podle id karty (+level k útoku i životu) */
  levels: Record<string, number>;
}

export interface RngState {
  seed: number;
}

/**
 * Záznam do logu je strukturovaný (kód + parametry), ne hotový text —
 * díky tomu se dá lokalizovat v UI. Parametry `card`/`src`/`tgt` nesou id
 * karty (přeloží se na název), ostatní jsou čísla / identifikátory stran.
 */
export interface LogEntry {
  code: string;
  params?: Record<string, string | number>;
}

export interface GameState {
  rows: number;
  cols: number;
  /** grid[row][col] -> uid karty nebo null */
  grid: (number | null)[][];
  cards: Map<number, CardInstance>;
  players: Record<PlayerId, PlayerState>;
  active: PlayerId;
  turnNumber: number;
  terrain: Map<string, TerrainCell>;
  winner: PlayerId | null;
  log: LogEntry[];
  nextUid: number;
  rng: RngState;
  energyCap: number;
  /** knihovna definic karet (data), potřebná pro spawn/instanciaci */
  library: Record<string, CardDef>;
}
