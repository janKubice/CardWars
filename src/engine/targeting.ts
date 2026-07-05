import type { CardInstance, GameState, PlayerId, Position } from './types.ts';
import { cardAt, cardsAround, inBounds } from './board.ts';
import { directionDelta } from './directions.ts';
import type { Direction } from './directions.ts';
import { registerTarget } from './registries.ts';
import type { TriggerData } from './registries.ts';
import { opponent } from './factory.ts';
import { nextInt } from './rng.ts';

// Vestavěné cíle (tvary). Přidání nového cíle = jeden registerTarget níže.
// Každý resolver vrátí seznam zasažených KARET.

type Side = 'enemy' | 'ally' | 'any';

function src(state: GameState, uid: number): CardInstance | undefined {
  return state.cards.get(uid);
}

function filterSide(cards: CardInstance[], owner: PlayerId, side: Side): CardInstance[] {
  if (side === 'any') return cards;
  if (side === 'ally') return cards.filter((c) => c.owner === owner);
  return cards.filter((c) => c.owner !== owner);
}

function boardCards(state: GameState): CardInstance[] {
  return [...state.cards.values()].filter((c) => c.zone === 'board');
}

function posFromData(data: TriggerData): Position | null {
  const p = (data as Record<string, unknown> | undefined)?.['pos'];
  if (p && typeof p === 'object' && 'row' in p && 'col' in p) return p as Position;
  return null;
}

registerTarget('self', (state, uid) => {
  const c = src(state, uid);
  return c && c.zone === 'board' ? [c] : [];
});

registerTarget('none', () => []);

// Jedno sousední políčko v daném směru (params.direction).
registerTarget('neighbor', (state, uid, params) => {
  const c = src(state, uid);
  if (!c?.pos) return [];
  const edge = state.players[c.owner].homeEdge;
  const dir = (params.direction as Direction) ?? 'forward';
  const d = directionDelta(edge, dir);
  const pos = { row: c.pos.row + d.dr, col: c.pos.col + d.dc };
  if (!inBounds(state, pos)) return [];
  const target = cardAt(state, pos);
  const side = (params.side as Side) ?? 'any';
  return target ? filterSide([target], c.owner, side) : [];
});

// Linie v daném směru do vzdálenosti params.range (default 1). Vrací obsazené buňky.
registerTarget('direction', (state, uid, params) => {
  const c = src(state, uid);
  if (!c?.pos) return [];
  const edge = state.players[c.owner].homeEdge;
  const dir = (params.direction as Direction) ?? 'forward';
  const range = Number(params.range ?? 1);
  const d = directionDelta(edge, dir);
  const out: CardInstance[] = [];
  for (let i = 1; i <= range; i++) {
    const pos = { row: c.pos.row + d.dr * i, col: c.pos.col + d.dc * i };
    if (!inBounds(state, pos)) break;
    const target = cardAt(state, pos);
    if (target) out.push(target);
  }
  const side = (params.side as Side) ?? 'any';
  return filterSide(out, c.owner, side);
});

// Okolí 3×3 kolem zdroje.
registerTarget('around', (state, uid, params) => {
  const c = src(state, uid);
  if (!c?.pos) return [];
  const side = (params.side as Side) ?? 'any';
  return filterSide(cardsAround(state, c.pos), c.owner, side);
});

// Okolí kolem oběti (pozice předaná v datech triggeru kill/death).
registerTarget('aroundVictim', (state, uid, params, data) => {
  const pos = posFromData(data);
  const c = src(state, uid);
  if (!pos || !c) return [];
  const side = (params.side as Side) ?? 'any';
  return filterSide(cardsAround(state, pos), c.owner, side);
});

// Nejzraněnější spojenec (nejnižší HP) na desce.
registerTarget('lowestHpAlly', (state, uid, params) => {
  const c = src(state, uid);
  if (!c) return [];
  const excludeSelf = params.excludeSelf === true;
  const allies = boardCards(state).filter((x) => x.owner === c.owner && (!excludeSelf || x.uid !== uid));
  if (allies.length === 0) return [];
  allies.sort((a, b) => a.hp - b.hp || a.uid - b.uid);
  return [allies[0]];
});

registerTarget('allEnemies', (state, uid) => {
  const c = src(state, uid);
  if (!c) return [];
  return boardCards(state).filter((x) => x.owner === opponent(c.owner));
});

registerTarget('allAllies', (state, uid) => {
  const c = src(state, uid);
  if (!c) return [];
  return boardCards(state).filter((x) => x.owner === c.owner);
});

registerTarget('enemyQueen', (state, uid) => {
  const c = src(state, uid);
  if (!c) return [];
  return boardCards(state).filter((x) => x.owner === opponent(c.owner) && x.isQueen);
});

registerTarget('randomEnemy', (state, uid) => {
  const c = src(state, uid);
  if (!c) return [];
  const foes = boardCards(state).filter((x) => x.owner === opponent(c.owner));
  return foes.length ? [foes[nextInt(state.rng, foes.length)]] : [];
});

// Ručně zvolený cíl (aktivní schopnosti). uid(y) přijdou v datech aktivace.
registerTarget('chosen', (state, _uid, _params, data) => {
  const ids = ((data as Record<string, unknown> | undefined)?.['chosenUids'] as number[]) ?? [];
  return ids
    .map((id) => state.cards.get(id))
    .filter((c): c is CardInstance => c != null && c.zone === 'board');
});
