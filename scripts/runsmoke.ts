// Headless test roguelike smyčky: odsimuluje celé runy (souboje bot vs bot,
// mezi nimi nákupy v obchodě) a ověří, že run vždy skončí (won/lost) bez chyby.
// Spuštění: node --experimental-strip-types scripts/runsmoke.ts

import { GameEngine } from '../src/engine/index.ts';
import { botTakeTurn } from '../src/ai/bot.ts';
import { nextInt } from '../src/engine/index.ts';
import {
  createRun, makeBattleConfig, onBattleWin, onBattleLoss, startBattle,
  buy, reroll, MAX_ANTE, type RunState,
} from '../src/run/run.ts';

declare const process: { exit(code: number): never };

function shopPhase(run: RunState): void {
  // Utrať trochu zlata: pár nákupů + občas reroll.
  for (let i = 0; i < 3; i++) {
    const idx = nextInt(run.rng, run.shop.length);
    if (!buy(run, idx)) {
      if (nextInt(run.rng, 2) === 0) reroll(run);
    }
  }
}

function playBattle(run: RunState): 'A' | 'B' | null {
  const engine = new GameEngine(makeBattleConfig(run));
  let guard = 0;
  while (!engine.winner && guard++ < 400) botTakeTurn(engine);
  return engine.winner;
}

function runOnce(seed: number): { status: string; wins: number; ante: number } {
  const run = createRun(seed);
  let guard = 0;
  while (run.status !== 'won' && run.status !== 'lost' && guard++ < 50) {
    if (run.status === 'shop') {
      shopPhase(run);
      startBattle(run);
    }
    const winner = playBattle(run);
    if (winner === 'A') onBattleWin(run);
    else onBattleLoss(run);
  }
  return { status: run.status, wins: run.wins, ante: run.ante };
}

let terminated = 0;
let won = 0;
let maxWins = 0;
const N = 40;
for (let seed = 1; seed <= N; seed++) {
  const r = runOnce(seed);
  if (r.status === 'won' || r.status === 'lost') terminated++;
  if (r.status === 'won') won++;
  maxWins = Math.max(maxWins, r.wins);
}

console.log(`runů=${N}: ukončeno=${terminated}, dohráno (won)=${won}, nejvíc výher v runu=${maxWins}/${MAX_ANTE}`);
if (terminated !== N) {
  console.error('CHYBA: nějaký run se neukončil.');
  process.exit(1);
}
console.log('OK ✅ roguelike smyčka vždy skončí (won/lost) bez chyby.');
