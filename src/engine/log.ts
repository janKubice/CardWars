import type { GameState } from './types.ts';

// Pomocník pro strukturovaný log. Engine nikdy neskládá hotové věty —
// jen zapíše kód události a parametry, text sestaví až UI (lokalizovaně).

export function pushLog(state: GameState, code: string, params?: Record<string, string | number>): void {
  state.log.push({ code, params });
}
