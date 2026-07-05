// Headless test: bot vs bot až do konce. Ověří, že engine dojede k vítězství
// bez zaseknutí a bez neznámých efektů/cílů.
// Spuštění: npm run smoke   (node --experimental-strip-types)

import { GameEngine } from '../src/engine/game.ts';
import { botTakeTurn } from '../src/ai/bot.ts';
import { LIBRARY } from '../src/content/cards.ts';
import { STARTER_DECKS } from '../src/content/decks.ts';

declare const process: { exit(code: number): never };

function runOne(seed: number): { winner: string | null; turns: number } {
  const engine = new GameEngine({ seed, library: LIBRARY, decks: STARTER_DECKS });
  let guard = 0;
  while (!engine.winner && guard++ < 400) {
    botTakeTurn(engine);
  }
  return { winner: engine.winner, turns: engine.state.turnNumber };
}

let ok = 0;
let stuck = 0;
const N = 20;
for (let seed = 1; seed <= N; seed++) {
  const r = runOne(seed);
  if (r.winner) ok++;
  else stuck++;
  console.log(`seed ${String(seed).padStart(2)}: vítěz=${r.winner ?? 'NIKDO (zaseknuto)'} po ${r.turns} tazích`);
}

// Ukázka logu z jedné partie.
const demo = new GameEngine({ seed: 7, library: LIBRARY, decks: STARTER_DECKS });
let g = 0;
while (!demo.winner && g++ < 400) botTakeTurn(demo);
console.log('\n— posledních 12 řádků logu (seed 7) —');
for (const line of demo.state.log.slice(-12)) console.log('  ' + line);

console.log(`\nVýsledek: ${ok}/${N} partií skončilo vítězstvím, ${stuck} zaseknutých.`);
if (stuck > 0) {
  console.error('CHYBA: nějaká partie se nedohrála.');
  process.exit(1);
}
console.log('OK ✅ engine dojede do konce ve všech partiích.');
