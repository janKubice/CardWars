import type { CardDef, CardInstance, GameState, PlayerId } from './types.ts';
import { TRIGGERS } from './types.ts';

// Vytváření instancí karet z definic (blueprintů).

export function opponent(p: PlayerId): PlayerId {
  return p === 'A' ? 'B' : 'A';
}

/** Vytvoří novou instanci karty z definice a přidá ji do state.cards. */
export function instantiate(
  state: GameState,
  defId: string,
  owner: PlayerId,
  zone: 'hand' | 'board' = 'hand',
  fromDeck = false,
): CardInstance {
  const def: CardDef | undefined = state.library[defId];
  if (!def) throw new Error(`Neznámá karta '${defId}'`);

  const abilities = (def.abilities ?? []).map((a) => ({ ...a, params: { ...(a.params ?? {}) } }));
  const counters: Record<string, number> = {};

  // Vylepšení: každá úroveň přidá +1 útok a +1 život.
  const level = state.players[owner]?.levels?.[def.id] ?? 0;

  // Odpočet: inicializuj počítadlo podle params.count.
  for (const ab of abilities) {
    if (ab.trigger === TRIGGERS.countdown) {
      const count = Number(ab.params?.count ?? 3);
      counters['countdown'] = count;
    }
  }

  const card: CardInstance = {
    uid: state.nextUid++,
    defId: def.id,
    name: def.name,
    owner,
    cost: def.cost,
    hp: def.hp + level,
    maxHp: def.hp + level,
    attack: def.attack + level,
    baseAttack: def.attack + level,
    range: def.range,
    shield: 0,
    pos: null,
    zone,
    hasAttacked: false,
    justPlayed: false,
    activeUsed: false,
    fromDeck,
    counters,
    abilities,
    keywords: [...(def.keywords ?? [])],
    tags: [...(def.tags ?? [])],
    isQueen: def.isQueen ?? false,
  };
  state.cards.set(card.uid, card);
  return card;
}
