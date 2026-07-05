import type { CardInstance, GameState, Position } from './types.ts';

// Pomocné funkce nad mřížkou. Bez znalosti pravidel — jen geometrie a přístup.

export function inBounds(state: GameState, pos: Position): boolean {
  return pos.row >= 0 && pos.row < state.rows && pos.col >= 0 && pos.col < state.cols;
}

export function key(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export function uidAt(state: GameState, pos: Position): number | null {
  if (!inBounds(state, pos)) return null;
  return state.grid[pos.row][pos.col];
}

export function cardAt(state: GameState, pos: Position): CardInstance | null {
  const uid = uidAt(state, pos);
  return uid == null ? null : state.cards.get(uid) ?? null;
}

export function isEmpty(state: GameState, pos: Position): boolean {
  return inBounds(state, pos) && state.grid[pos.row][pos.col] == null;
}

/** 8-sousedství (ortogonálně + diagonálně). */
export function neighbors8(state: GameState, pos: Position): Position[] {
  const out: Position[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const p = { row: pos.row + dr, col: pos.col + dc };
      if (inBounds(state, p)) out.push(p);
    }
  }
  return out;
}

/** Karty v okolí 3×3 (bez středu). */
export function cardsAround(state: GameState, pos: Position): CardInstance[] {
  return neighbors8(state, pos)
    .map((p) => cardAt(state, p))
    .filter((c): c is CardInstance => c != null);
}

/** Chebyshevova vzdálenost (počet kroků včetně diagonál). */
export function distance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}

export function placeOnGrid(state: GameState, uid: number, pos: Position): void {
  state.grid[pos.row][pos.col] = uid;
  const card = state.cards.get(uid);
  if (card) card.pos = { ...pos };
}

export function removeFromGrid(state: GameState, pos: Position): void {
  if (inBounds(state, pos)) state.grid[pos.row][pos.col] = null;
}
