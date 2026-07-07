// Head-to-head: chytrý bot (src/ai/bot.ts) vs. jednoduchý „greedy“ baseline.
// Ověří, že nový bot je reálně silnější (vyhrává většinu partií).
// Spuštění: node --experimental-strip-types scripts/botcompare.ts

import { GameEngine } from '../src/engine/game.ts';
import type { PlayerId, Position } from '../src/engine/types.ts';
import { stepBot } from '../src/ai/bot.ts';
import { opponent } from '../src/engine/factory.ts';
import { distance } from '../src/engine/board.ts';
import { LIBRARY } from '../src/content/cards.ts';
import { STARTER_DECKS } from '../src/content/decks.ts';

declare const process: { exit(code: number): never };

// ── Baseline: greedy útok + pokládání co nejblíž nepřátelské Královně ──
// Bez obrany vlastní Královny, bez support-logiky, bez vyhýbání se minám.
function enemyQueenPos(engine: GameEngine, me: PlayerId): Position | null {
  return engine.boardCardsOf(opponent(me)).find((c) => c.isQueen)?.pos ?? null;
}
function stepSimple(engine: GameEngine): boolean {
  const me = engine.active;
  const eqp = enemyQueenPos(engine, me);
  type M = { kind: 'attack'; a: number; t: number; s: number } | { kind: 'play'; c: number; p: Position; s: number } | { kind: 'activate'; c: number; t?: number; s: number };
  let best: M | null = null;

  for (const attacker of engine.boardCardsOf(me)) {
    for (const tid of engine.legalAttackTargets(attacker.uid)) {
      const target = engine.card(tid);
      if (!target) continue;
      let s = Math.min(attacker.attack, target.hp);
      if (target.isQueen) s += attacker.attack * 10 + 40;
      if (attacker.attack >= target.hp) s += target.attack + target.hp * 0.5;
      if (!best || s > best.s) best = { kind: 'attack', a: attacker.uid, t: tid, s };
    }
  }
  for (const card of engine.handOf(me)) {
    const places = engine.legalPlacements(card.uid);
    if (places.length === 0) continue;
    // jen greedy: co nejblíž nepřátelské Královně
    let bp = places[0];
    if (eqp) for (const p of places) if (distance(p, eqp) < distance(bp, eqp)) bp = p;
    const s = card.attack + card.hp * 0.5 - card.cost * 0.4 + 0.5;
    if (!best || s > best.s) best = { kind: 'play', c: card.uid, p: bp, s };
  }
  for (const c of engine.boardCardsOf(me)) {
    if (!engine.canActivate(c.uid)) continue;
    const ab = engine.activeAbility(c.uid);
    if (!ab) continue;
    if (ab.target === 'chosen') {
      const targets = engine.activeTargets(c.uid);
      if (targets.length === 0) continue;
      if (!best || 1.5 > best.s) best = { kind: 'activate', c: c.uid, t: targets[0], s: 1.5 };
    } else if (!best || 1.5 > best.s) best = { kind: 'activate', c: c.uid, s: 1.5 };
  }

  if (!best || best.s <= 0) return false;
  if (best.kind === 'attack') engine.attack(best.a, best.t);
  else if (best.kind === 'play') engine.play(best.c, best.p);
  else engine.activate(best.c, best.t);
  return true;
}

type Driver = (e: GameEngine) => void;
const smartTurn: Driver = (e) => { let g = 0; while (!e.winner && g++ < 60) if (stepBot(e) === null) break; e.endTurn(); };
const simpleTurn: Driver = (e) => { let g = 0; while (!e.winner && g++ < 60) if (!stepSimple(e)) break; e.endTurn(); };

// Odehraje partii: A=driverA, B=driverB. Vrátí vítěze ('A'|'B'|null).
function play(seed: number, driverA: Driver, driverB: Driver): PlayerId | null {
  const engine = new GameEngine({ seed, library: LIBRARY, decks: STARTER_DECKS });
  let guard = 0;
  while (!engine.winner && guard++ < 400) {
    (engine.active === 'A' ? driverA : driverB)(engine);
  }
  return engine.winner;
}

// Férově: každý seed hrajeme dvakrát, jednou smart=A, jednou smart=B.
let smartWins = 0, simpleWins = 0, draws = 0;
const N = 40;
for (let seed = 1; seed <= N; seed++) {
  const w1 = play(seed, smartTurn, simpleTurn);   // smart = A
  if (w1 === 'A') smartWins++; else if (w1 === 'B') simpleWins++; else draws++;
  const w2 = play(1000 + seed, simpleTurn, smartTurn); // smart = B
  if (w2 === 'B') smartWins++; else if (w2 === 'A') simpleWins++; else draws++;
}
const total = N * 2;
const pct = ((smartWins / total) * 100).toFixed(1);
console.log(`Partií: ${total}`);
console.log(`Chytrý bot výher:   ${smartWins}  (${pct} %)`);
console.log(`Jednoduchý bot:     ${simpleWins}`);
console.log(`Remízy/zaseknuté:   ${draws}`);
if (smartWins > simpleWins) console.log('\nOK ✅ chytrý bot je silnější než greedy baseline.');
else { console.error('\nCHYBA: chytrý bot NEPŘEKONAL baseline.'); process.exit(1); }
