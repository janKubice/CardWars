import type { CardDef, CardInstance, GameState, PlayerId, Position } from './types.ts';
import { TRIGGERS } from './types.ts';
import { makeRng, nextInt } from './rng.ts';
import { EffectRunner, drawCards } from './events.ts';
import { instantiate, opponent } from './factory.ts';
import { distance, inBounds, isEmpty, key, neighbors8, placeOnGrid } from './board.ts';

// Import vestavěných efektů a cílů kvůli jejich registraci (side-effect).
import './effects.ts';
import './targeting.ts';

export interface GameConfig {
  rows?: number;
  cols?: number;
  seed?: number;
  energyCap?: number;
  openingHand?: number;
  handLimit?: number;
  library: Record<string, CardDef>;
  decks: Record<PlayerId, string[]>;
  queenId?: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const OK: ActionResult = { ok: true };
function fail(error: string): ActionResult {
  return { ok: false, error };
}

export class GameEngine {
  state: GameState;
  private runner: EffectRunner;

  constructor(config: GameConfig) {
    this.state = createInitialState(config);
    this.runner = new EffectRunner(this.state);
    this.setup(config);
  }

  // ── Dotazy ────────────────────────────────────────────────────────────
  get winner(): PlayerId | null {
    return this.state.winner;
  }
  get active(): PlayerId {
    return this.state.active;
  }
  card(uid: number): CardInstance | undefined {
    return this.state.cards.get(uid);
  }
  handOf(player: PlayerId): CardInstance[] {
    return this.state.players[player].hand
      .map((uid) => this.state.cards.get(uid))
      .filter((c): c is CardInstance => c != null);
  }
  boardCardsOf(player: PlayerId): CardInstance[] {
    return [...this.state.cards.values()].filter((c) => c.zone === 'board' && c.owner === player);
  }

  /** Sousedí políčko s nějakou kartou hráče? (spawn point = i Královna) */
  private adjacentToOwn(player: PlayerId, pos: Position): boolean {
    return neighbors8(this.state, pos).some((p) => {
      const c = this.state.grid[p.row][p.col];
      if (c == null) return false;
      const card = this.state.cards.get(c);
      return card?.owner === player && card.zone === 'board';
    });
  }

  legalPlacements(cardUid: number): Position[] {
    const c = this.state.cards.get(cardUid);
    if (!c || c.owner !== this.state.active || c.zone !== 'hand') return [];
    if (this.state.players[this.state.active].energy < c.cost) return [];
    const out: Position[] = [];
    for (let r = 0; r < this.state.rows; r++) {
      for (let col = 0; col < this.state.cols; col++) {
        const pos = { row: r, col };
        if (isEmpty(this.state, pos) && this.adjacentToOwn(this.state.active, pos)) out.push(pos);
      }
    }
    return out;
  }

  legalAttackTargets(attackerUid: number): number[] {
    const a = this.state.cards.get(attackerUid);
    if (!a || a.pos == null || a.owner !== this.state.active || a.zone !== 'board') return [];
    if (a.hasAttacked || a.attack <= 0) return [];
    if (a.justPlayed && !a.keywords.includes('charge')) return [];
    const out: number[] = [];
    for (const t of this.state.cards.values()) {
      if (t.zone !== 'board' || t.owner === a.owner || t.pos == null) continue;
      if (distance(a.pos, t.pos) <= a.range) out.push(t.uid);
    }
    return out;
  }

  // ── Akce ──────────────────────────────────────────────────────────────
  play(cardUid: number, pos: Position): ActionResult {
    if (this.state.winner) return fail('hra skončila');
    const c = this.state.cards.get(cardUid);
    if (!c || c.owner !== this.state.active || c.zone !== 'hand') return fail('karta není v ruce');
    const p = this.state.players[this.state.active];
    if (p.energy < c.cost) return fail('málo energie');
    if (!inBounds(this.state, pos) || !isEmpty(this.state, pos)) return fail('políčko je obsazené');
    if (!this.adjacentToOwn(this.state.active, pos)) return fail('musí sousedit s vlastní kartou');

    p.energy -= c.cost;
    const idx = p.hand.indexOf(cardUid);
    if (idx >= 0) p.hand.splice(idx, 1);
    c.zone = 'board';
    c.hasAttacked = false;
    c.justPlayed = !c.keywords.includes('charge');
    placeOnGrid(this.state, cardUid, pos);
    this.state.log.push(`▶️ ${c.owner} vyložil ${c.name} na (${pos.row},${pos.col})`);

    // Mina na políčku?
    const terr = this.state.terrain.get(key(pos));
    if (terr && terr.type === 'mine') {
      this.state.terrain.delete(key(pos));
      const dmg = Number(terr.params?.damage ?? 2);
      this.runner.enqueue({ type: 'damage', uid: cardUid, amount: dmg });
    }

    this.runner.enqueue({ type: 'fireTrigger', uid: cardUid, trigger: TRIGGERS.deploy });
    this.runner.drain();
    return OK;
  }

  attack(attackerUid: number, targetUid: number): ActionResult {
    if (this.state.winner) return fail('hra skončila');
    const a = this.state.cards.get(attackerUid);
    if (!a || a.owner !== this.state.active || a.zone !== 'board' || a.pos == null) return fail('neplatný útočník');
    if (a.hasAttacked) return fail('karta už útočila');
    if (a.justPlayed && !a.keywords.includes('charge')) return fail('únava z vyložení');
    if (a.attack <= 0) return fail('karta nemá útok');
    const t = this.state.cards.get(targetUid);
    if (!t || t.zone !== 'board' || t.owner === a.owner || t.pos == null) return fail('neplatný cíl');
    const dist = distance(a.pos, t.pos);
    if (dist > a.range) return fail('mimo dostřel');

    a.hasAttacked = true;
    this.state.log.push(`⚔️ ${a.name} útočí na ${t.name}`);
    this.runner.enqueue({ type: 'fireTrigger', uid: attackerUid, trigger: TRIGGERS.attack, data: { targetUid } });
    this.runner.enqueue({ type: 'damage', uid: targetUid, amount: a.attack, sourceUid: attackerUid });
    this.runner.drain();

    // Protiúder jen v boji zblízka a jen pokud oba přežili.
    if (!this.state.winner && dist === 1) {
      const a2 = this.state.cards.get(attackerUid);
      const t2 = this.state.cards.get(targetUid);
      if (a2?.zone === 'board' && t2?.zone === 'board' && t2.attack > 0) {
        this.runner.enqueue({ type: 'damage', uid: attackerUid, amount: t2.attack, sourceUid: targetUid });
        this.runner.drain();
      }
    }
    return OK;
  }

  endTurn(): ActionResult {
    if (this.state.winner) return fail('hra skončila');
    this.startTurn(opponent(this.state.active));
    return OK;
  }

  // ── Průběh tahu ───────────────────────────────────────────────────────
  private startTurn(player: PlayerId): void {
    const s = this.state;
    s.active = player;
    s.turnNumber++;
    const p = s.players[player];
    p.maxEnergy = Math.min(s.energyCap, p.maxEnergy + 1);
    p.energy = p.maxEnergy;

    const mine = this.boardCardsOf(player);
    for (const c of mine) {
      c.justPlayed = false;
      c.hasAttacked = false;
    }

    // Odpočty (Countdown): sniž a případně odpal.
    const exploded: number[] = [];
    for (const c of mine) {
      if (c.counters['countdown'] != null) {
        c.counters['countdown'] -= 1;
        if (c.counters['countdown'] <= 0) {
          delete c.counters['countdown'];
          this.runner.enqueue({ type: 'fireTrigger', uid: c.uid, trigger: TRIGGERS.countdown, data: { pos: c.pos } });
          exploded.push(c.uid);
        }
      }
    }
    // Začátek tahu (Úsvit).
    for (const c of mine) {
      this.runner.enqueue({ type: 'fireTrigger', uid: c.uid, trigger: TRIGGERS.upkeepStart });
    }
    this.runner.drain();

    // Odpálené karty po vyřešení efektu zaniknou.
    for (const uid of exploded) this.runner.enqueue({ type: 'destroy', uid, reason: 'exploded' });
    this.runner.drain();

    // Dobírání — nebo únava, když je balíček prázdný (zaručuje konec hry).
    if (p.deck.length === 0) {
      p.fatigue += 1;
      const queen = mine.find((c) => c.isQueen);
      if (queen) {
        s.log.push(`😵 únava: Královna ${player} dostává ${p.fatigue}`);
        this.runner.enqueue({ type: 'damage', uid: queen.uid, amount: p.fatigue });
        this.runner.drain();
      }
    } else {
      drawCards(s, player, 1);
    }
    s.log.push(`— tah ${s.turnNumber}: na tahu ${player} (energie ${p.energy}/${p.maxEnergy}) —`);
  }

  // ── Sestavení hry ─────────────────────────────────────────────────────
  private setup(config: GameConfig): void {
    const s = this.state;
    const queenId = config.queenId ?? 'queen';
    const opening = config.openingHand ?? 3;

    // Královny na střed domovského okraje.
    const midCol = Math.floor(s.cols / 2);
    this.placeStartingQueen('A', queenId, { row: s.rows - 1, col: midCol });
    this.placeStartingQueen('B', queenId, { row: 0, col: midCol });

    // Balíčky (zamíchané) a úvodní ruce.
    for (const pid of ['A', 'B'] as PlayerId[]) {
      const deck = [...(config.decks[pid] ?? [])];
      shuffle(deck, s);
      s.players[pid].deck = deck;
      drawCards(s, pid, opening);
    }

    this.startTurn('A');
  }

  private placeStartingQueen(owner: PlayerId, queenId: string, pos: Position): void {
    const q = instantiate(this.state, queenId, owner, 'board');
    placeOnGrid(this.state, q.uid, pos);
  }
}

function createInitialState(config: GameConfig): GameState {
  const rows = config.rows ?? 6;
  const cols = config.cols ?? 7;
  const grid: (number | null)[][] = Array.from({ length: rows }, () => Array<number | null>(cols).fill(null));
  const handLimit = config.handLimit ?? 10;
  return {
    rows,
    cols,
    grid,
    cards: new Map(),
    players: {
      A: { id: 'A', energy: 0, maxEnergy: 0, homeEdge: 'bottom', hand: [], deck: [], handLimit, fatigue: 0 },
      B: { id: 'B', energy: 0, maxEnergy: 0, homeEdge: 'top', hand: [], deck: [], handLimit, fatigue: 0 },
    },
    active: 'A',
    turnNumber: 0,
    terrain: new Map(),
    winner: null,
    log: [],
    nextUid: 1,
    rng: makeRng(config.seed ?? 12345),
    energyCap: config.energyCap ?? 10,
    library: config.library,
  };
}

function shuffle<T>(arr: T[], state: GameState): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = nextInt(state.rng, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}
