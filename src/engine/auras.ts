import type { GameState } from './types.ts';
import { getTarget } from './registries.ts';

// Aury jsou TRVALÉ plošné efekty — musí se přepočítat při každé změně desky
// (vyložení, přesun, zničení). Proto: útok karty = baseAttack + součet aur.
// Aura schopnost: { trigger:'aura', target:<oblast>, params:{ atk:N, side } }.
// Zatím podporujeme jen bonus útoku (bezpečné — nezabíjí to karty jako aura HP).

export function recomputeAuras(state: GameState): void {
  // 1) reset na základní útok
  for (const c of state.cards.values()) {
    if (c.zone === 'board') c.attack = c.baseAttack;
  }
  // 2) aplikuj všechny aury na desce
  for (const source of state.cards.values()) {
    if (source.zone !== 'board') continue;
    for (const ab of source.abilities) {
      if (ab.trigger !== 'aura') continue;
      const atk = Number(ab.params?.['atk'] ?? 0);
      if (!atk) continue;
      const resolver = getTarget(ab.target);
      if (!resolver) continue;
      for (const tgt of resolver(state, source.uid, ab.params ?? {}, undefined)) {
        if (tgt.zone === 'board') tgt.attack += atk;
      }
    }
  }
}
