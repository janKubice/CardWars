import type { CardInstance, PlayerId, Position } from '../engine/types.ts';
import { GameEngine } from '../engine/game.ts';
import { distance } from '../engine/board.ts';
import { opponent } from '../engine/factory.ts';

// Heuristický bot (viz docs/06). Cíl: čitelné, férové tahy.
// Skóruje jednotlivé akce, hraje nejlepší, opakuje, dokud se vyplatí.

function enemyQueenPos(engine: GameEngine, me: PlayerId): Position | null {
  const q = engine.boardCardsOf(opponent(me)).find((c) => c.isQueen);
  return q?.pos ?? null;
}

function cardValue(c: CardInstance): number {
  return c.attack + c.hp * 0.5 + (c.abilities.length > 0 ? 1 : 0);
}

function scoreAttack(attacker: CardInstance, target: CardInstance): number {
  const dealt = Math.min(attacker.attack, target.hp);
  let score = dealt;
  if (target.isQueen) score += attacker.attack * 10 + 40; // hlavní cíl
  if (dealt >= target.hp) score += cardValue(target); // zabití
  const melee = attacker.pos && target.pos && distance(attacker.pos, target.pos) === 1;
  if (melee && target.attack >= attacker.hp) score -= cardValue(attacker) * 0.8; // umřu v protiúderu
  return score;
}

function scorePlay(engine: GameEngine, card: CardInstance, pos: Position, me: PlayerId): number {
  let score = cardValue(card) - card.cost * 0.5 + 0.5; // trochu > 0, ať bot expanduje
  const qp = enemyQueenPos(engine, me);
  if (qp) {
    const maxDist = engine.state.rows + engine.state.cols;
    score += (maxDist - distance(pos, qp)) * 0.3; // postup fronty vpřed
  }
  return score;
}

function bestPlacement(engine: GameEngine, me: PlayerId, placements: Position[]): Position {
  const qp = enemyQueenPos(engine, me);
  if (!qp) return placements[0];
  let best = placements[0];
  let bestD = Infinity;
  for (const p of placements) {
    const d = distance(p, qp);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

type Move =
  | { kind: 'attack'; attacker: number; target: number; score: number }
  | { kind: 'play'; card: number; pos: Position; score: number };

/** Odehraje celý tah aktivního (botího) hráče a ukončí ho. */
export function botTakeTurn(engine: GameEngine): void {
  const me = engine.active;
  let guard = 0;
  while (!engine.winner && guard++ < 60) {
    let best: Move | null = null;

    for (const attacker of engine.boardCardsOf(me)) {
      for (const targetUid of engine.legalAttackTargets(attacker.uid)) {
        const target = engine.card(targetUid);
        if (!target) continue;
        const score = scoreAttack(attacker, target);
        if (!best || score > best.score) best = { kind: 'attack', attacker: attacker.uid, target: targetUid, score };
      }
    }

    for (const card of engine.handOf(me)) {
      const placements = engine.legalPlacements(card.uid);
      if (placements.length === 0) continue;
      const pos = bestPlacement(engine, me, placements);
      const score = scorePlay(engine, card, pos, me);
      if (!best || score > best.score) best = { kind: 'play', card: card.uid, pos, score };
    }

    if (!best || best.score <= 0) break;

    if (best.kind === 'attack') engine.attack(best.attacker, best.target);
    else engine.play(best.card, best.pos);
  }
  engine.endTurn();
}
