import type { CardInstance, PlayerId, Position } from '../engine/types.ts';
import { GameEngine } from '../engine/game.ts';
import { distance, neighbors8, cardAt, key } from '../engine/board.ts';
import { opponent } from '../engine/factory.ts';

// Heuristický bot (viz docs/06). Cíl: čitelné, férové, ale slušné tahy.
// Skóruje jednotlivé akce s ohledem na útok NA nepřátelskou Královnu
// i OBRANU té vlastní; pokládání hodnotí pozičně.

function enemyQueenPos(engine: GameEngine, me: PlayerId): Position | null {
  return engine.boardCardsOf(opponent(me)).find((c) => c.isQueen)?.pos ?? null;
}
function myQueenPos(engine: GameEngine, me: PlayerId): Position | null {
  return engine.boardCardsOf(me).find((c) => c.isQueen)?.pos ?? null;
}

function cardValue(c: CardInstance): number {
  return c.attack + c.hp * 0.5 + (c.abilities.length > 0 ? 1 : 0);
}

/** Míra ohrožení vlastní Královny (součet síly nepřátel, co ji dosáhnou brzy). */
function threatToQueen(engine: GameEngine, me: PlayerId): number {
  const qp = myQueenPos(engine, me);
  if (!qp) return 0;
  let t = 0;
  for (const e of engine.boardCardsOf(opponent(me))) {
    if (e.attack <= 0 || !e.pos) continue;
    const d = distance(e.pos, qp);
    if (d <= e.range) t += e.attack * 2; // zasáhne hned
    else if (d <= e.range + 1) t += e.attack; // příští tah
  }
  return t;
}
/** Je tahle nepřátelská jednotka hrozbou pro mou Královnu? */
function isThreat(engine: GameEngine, me: PlayerId, target: CardInstance): boolean {
  const qp = myQueenPos(engine, me);
  if (!qp || !target.pos || target.attack <= 0) return false;
  return distance(target.pos, qp) <= target.range + 1;
}

function scoreAttack(engine: GameEngine, me: PlayerId, attacker: CardInstance, target: CardInstance): number {
  const dealt = Math.min(attacker.attack, target.hp);
  const kills = dealt >= target.hp;
  let score = dealt;
  if (target.isQueen) score += attacker.attack * 10 + 40; // hlavní cíl
  if (kills) score += cardValue(target); // zabití
  // obrana: ničit jednotky ohrožující mou Královnu
  if (isThreat(engine, me, target)) {
    score += target.attack * 3 + 3;
    if (kills) score += 6;
  }
  // smrt v protiúderu (jen když cíl přežije)
  const melee = attacker.pos && target.pos && distance(attacker.pos, target.pos) === 1;
  if (melee && !kills && !target.isQueen && target.attack >= attacker.hp) score -= cardValue(attacker) * 0.7;
  return score;
}

function hasHeal(c: CardInstance): boolean {
  return c.abilities.some((a) => a.effect === 'heal');
}
function isSupport(c: CardInstance): boolean {
  return c.abilities.some((a) => a.trigger === 'aura' || (a.trigger === 'deploy' && a.effect === 'buff'));
}
function countNear(engine: GameEngine, me: PlayerId, pos: Position, wounded: boolean): number {
  let n = 0;
  for (const p of neighbors8(engine.state, pos)) {
    const c = cardAt(engine.state, p);
    if (c && c.owner === me && (!wounded || c.hp < c.maxHp)) n++;
  }
  return n;
}

/** Poziční hodnocení vyložení karty na konkrétní políčko. */
function scorePlayAt(engine: GameEngine, me: PlayerId, card: CardInstance, pos: Position): number {
  let s = cardValue(card) - card.cost * 0.4 + 0.5;
  const eqp = enemyQueenPos(engine, me);
  const myqp = myQueenPos(engine, me);
  const maxD = engine.state.rows + engine.state.cols;
  // ofenziva: postup k nepřátelské Královně
  if (eqp) s += (maxD - distance(pos, eqp)) * 0.22;
  // obrana: když je má Královna ohrožená, pokládej blízko ní (blok)
  const threat = threatToQueen(engine, me);
  if (threat > 0 && myqp) s += (2 - Math.min(2, distance(pos, myqp))) * Math.min(threat, 8) * 0.7;
  // zeď (0 útok, hodně HP) je cenná těsně před Královnou
  if (card.attack === 0 && card.hp >= 5 && myqp) s += (2 - Math.min(2, distance(pos, myqp))) * 1.2;
  // support: léčitel k raněným, aura/buff k co nejvíc spojencům
  if (hasHeal(card)) s += countNear(engine, me, pos, true) * 1.5;
  if (isSupport(card)) s += countNear(engine, me, pos, false) * 1.0;
  // vyhýbej se nepřátelským minám (vyložením bys dostal dmg)
  if (engine.state.terrain.get(key(pos))?.type === 'mine') s -= 3;
  return s;
}

type Move =
  | { kind: 'attack'; attacker: number; target: number; score: number }
  | { kind: 'play'; card: number; pos: Position; score: number }
  | { kind: 'activate'; card: number; target?: number; score: number };

/** Popis jedné provedené botí akce (pro animace v UI). */
export type BotAction =
  | { kind: 'attack'; attacker: number; target: number }
  | { kind: 'play'; card: number; pos: Position }
  | { kind: 'activate'; card: number; target?: number };

/** Spočítá a PROVEDE jednu nejlepší akci bota. Vrátí co udělal, nebo null (konec tahu). */
export function stepBot(engine: GameEngine): BotAction | null {
  const me = engine.active;
  let best: Move | null = null;

  for (const attacker of engine.boardCardsOf(me)) {
    for (const targetUid of engine.legalAttackTargets(attacker.uid)) {
      const target = engine.card(targetUid);
      if (!target) continue;
      const score = scoreAttack(engine, me, attacker, target);
      if (!best || score > best.score) best = { kind: 'attack', attacker: attacker.uid, target: targetUid, score };
    }
  }
  for (const card of engine.handOf(me)) {
    for (const pos of engine.legalPlacements(card.uid)) {
      const score = scorePlayAt(engine, me, card, pos);
      if (!best || score > best.score) best = { kind: 'play', card: card.uid, pos, score };
    }
  }
  for (const c of engine.boardCardsOf(me)) {
    if (!engine.canActivate(c.uid)) continue;
    const m = scoreActivate(engine, me, c.uid);
    if (m && (!best || m.score > best.score)) best = m;
  }

  if (!best || best.score <= 0) return null;
  if (best.kind === 'attack') { engine.attack(best.attacker, best.target); return { kind: 'attack', attacker: best.attacker, target: best.target }; }
  if (best.kind === 'play') { engine.play(best.card, best.pos); return { kind: 'play', card: best.card, pos: best.pos }; }
  engine.activate(best.card, best.target);
  return { kind: 'activate', card: best.card, target: best.target };
}

/** Odehraje celý tah aktivního (botího) hráče a ukončí ho (pro headless testy). */
export function botTakeTurn(engine: GameEngine): void {
  let guard = 0;
  while (!engine.winner && guard++ < 60) {
    if (stepBot(engine) === null) break;
  }
  engine.endTurn();
}

function scoreActivate(engine: GameEngine, me: PlayerId, uid: number): Move | null {
  const ab = engine.activeAbility(uid);
  if (!ab) return null;
  const val = Number(ab.params?.value ?? ab.params?.atk ?? 1);
  if (ab.target !== 'chosen') {
    return { kind: 'activate', card: uid, score: 1.5 }; // vlastní buff apod.
  }
  const targets = engine.activeTargets(uid)
    .map((id) => engine.card(id))
    .filter((c): c is CardInstance => c != null);
  if (targets.length === 0) return null;

  if (ab.effect === 'damage') {
    // priorita: nepřátelská Královna → hrozba pro mou Královnu → nejnižší HP
    const queen = targets.find((t) => t.isQueen);
    const threat = targets.filter((t) => isThreat(engine, me, t)).sort((a, b) => b.attack - a.attack)[0];
    const target = queen ?? threat ?? [...targets].sort((a, b) => a.hp - b.hp)[0];
    let score = Math.min(val, target.hp);
    if (target.isQueen) score += 30;
    else if (isThreat(engine, me, target)) score += target.attack * 2 + 4;
    if (val >= target.hp) score += cardValue(target);
    return { kind: 'activate', card: uid, target: target.uid, score };
  }
  if (ab.effect === 'heal') {
    const wounded = targets.filter((t) => t.hp < t.maxHp).sort((a, b) => (b.maxHp - b.hp) - (a.maxHp - a.hp));
    if (wounded.length === 0) return null;
    return { kind: 'activate', card: uid, target: wounded[0].uid, score: Math.min(val, wounded[0].maxHp - wounded[0].hp) };
  }
  return { kind: 'activate', card: uid, target: targets[0].uid, score: 1 };
}
