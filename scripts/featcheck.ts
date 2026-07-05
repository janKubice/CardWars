// Deterministický test aury a aktivních schopností na úrovni enginu.
// Spuštění: node --experimental-strip-types scripts/featcheck.ts

import { GameEngine, instantiate, placeOnGrid, recomputeAuras } from '../src/engine/index.ts';
import { LIBRARY } from '../src/content/cards.ts';

declare const process: { exit(code: number): never };

let failed = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? 'OK  ' : 'FAIL'}  ${name}`);
  if (!cond) failed++;
}

const e = new GameEngine({ library: LIBRARY, decks: { A: [], B: [] }, seed: 1 });
const st = e.state;

// ── AURA: Velitel dává +1 útok sousednímu spojenci ──
const cmd = instantiate(st, 'commander', 'A', 'board');
placeOnGrid(st, cmd.uid, { row: 4, col: 3 });
const rec = instantiate(st, 'recruit', 'A', 'board');
placeOnGrid(st, rec.uid, { row: 4, col: 4 });
recomputeAuras(st);
check('aura zvýší útok sousedního spojence (+1)', rec.attack === rec.baseAttack + 1);

// nepřítel poblíž auru NEdostane
const foeNear = instantiate(st, 'recruit', 'B', 'board');
placeOnGrid(st, foeNear.uid, { row: 3, col: 3 });
recomputeAuras(st);
check('aura nebuffuje nepřítele', foeNear.attack === foeNear.baseAttack);

// po zničení zdroje aura zmizí (dynamické)
cmd.zone = 'dead';
recomputeAuras(st);
check('aura po zničení zdroje zmizí', rec.attack === rec.baseAttack);

// ── AKTIVACE (self): Fanatik +1/+1 sobě ──
st.active = 'A';
st.players.A.energy = 9;
const zealot = instantiate(st, 'zealot', 'A', 'board');
placeOnGrid(st, zealot.uid, { row: 5, col: 2 });
const atk0 = zealot.baseAttack;
const hp0 = zealot.hp;
const r1 = e.activate(zealot.uid);
check('self-aktivace projde', r1.ok);
check('self-aktivace: +1 útok', zealot.baseAttack === atk0 + 1);
check('self-aktivace: +1 život', zealot.hp === hp0 + 1);
check('aktivaci nelze použít dvakrát za tah', !e.canActivate(zealot.uid));

// ── AKTIVACE (cílená): Zaklínač dá 2 dmg zvolenému nepříteli v dosahu ──
const zap = instantiate(st, 'zapper', 'A', 'board');
placeOnGrid(st, zap.uid, { row: 3, col: 4 });
const foe = instantiate(st, 'recruit', 'B', 'board');
placeOnGrid(st, foe.uid, { row: 3, col: 5 });
check('cílená aktivace nabízí platný cíl', e.activeTargets(zap.uid).includes(foe.uid));
const foeHp0 = foe.hp;
e.activate(zap.uid, foe.uid);
check('cílená aktivace zraní zvolený cíl (−2)', foe.hp === foeHp0 - 2);

console.log(failed === 0 ? '\nOK ✅ aura i aktivace fungují.' : `\nCHYBA: ${failed} kontrol selhalo.`);
if (failed > 0) process.exit(1);
