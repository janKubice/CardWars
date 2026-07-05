// Deterministický test aury a aktivních schopností na úrovni enginu.
// Spuštění: node --experimental-strip-types scripts/featcheck.ts

import { GameEngine, EffectRunner, getEffect, instantiate, placeOnGrid, recomputeAuras, drawCards } from '../src/engine/index.ts';
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

// ── PUSH: odstrčí nepřítele o 1 políčko od zdroje ──
const shover = instantiate(st, 'shover', 'A', 'board');
placeOnGrid(st, shover.uid, { row: 5, col: 1 });
const pushed = instantiate(st, 'recruit', 'B', 'board');
placeOnGrid(st, pushed.uid, { row: 4, col: 1 }); // vpřed od shovera (A kouká nahoru)
const runner = new EffectRunner(st);
const pushEffect = getEffect('push');
check('efekt push je zaregistrován', pushEffect != null);
pushEffect?.(runner.makeApi(shover.uid), {}, [pushed], shover.uid, undefined);
check('push odstrčí cíl dál od zdroje', pushed.pos?.row === 3);

// ── BOUNCE: vrátí nepřítele do jeho ruky ──
const bouncer = instantiate(st, 'bouncer', 'A', 'board');
placeOnGrid(st, bouncer.uid, { row: 2, col: 5 });
const bounced = instantiate(st, 'recruit', 'B', 'board');
placeOnGrid(st, bounced.uid, { row: 2, col: 6 });
check('bounce nabízí platný cíl', e.activeTargets(bouncer.uid).includes(bounced.uid));
e.activate(bouncer.uid, bounced.uid);
check('bounce vrátí cíl do ruky', bounced.zone === 'hand' && st.players.B.hand.includes(bounced.uid));

// ── SILENCE: odstraní schopnosti cíle ──
const silencer = instantiate(st, 'silencer', 'A', 'board');
placeOnGrid(st, silencer.uid, { row: 1, col: 4 });
const victim = instantiate(st, 'commander', 'B', 'board');
placeOnGrid(st, victim.uid, { row: 1, col: 5 });
check('umlčovaný má před silence schopnost', victim.abilities.length > 0);
e.activate(silencer.uid, victim.uid);
check('silence odstraní schopnosti', victim.abilities.length === 0);

// ── RECYKLACE ODHOZU: prázdný balíček se doplní z odhozu ──
const pA = st.players.A;
pA.deck = [];
pA.discard = ['recruit', 'archer'];
pA.hand = [];
const drew = drawCards(st, 'A', 1);
check('recyklace: dobral kartu z odhozu', drew === 1 && pA.hand.length === 1);
check('recyklace: odhoz se přemíchal do balíčku', pA.deck.length === 1 && pA.discard.length === 0);

// padlá karta z balíčku jde do odhozu (recykluje se)
pA.discard = [];
const rec2 = instantiate(st, 'recruit', 'A', 'board', true);
placeOnGrid(st, rec2.uid, { row: 0, col: 6 });
const runner2 = new EffectRunner(st);
runner2.enqueue({ type: 'destroy', uid: rec2.uid });
runner2.drain();
check('padlá karta z balíčku jde do odhozu', pA.discard.includes('recruit'));

console.log(failed === 0 ? '\nOK ✅ vše OK (aura, aktivace, efekty, recyklace odhozu).' : `\nCHYBA: ${failed} kontrol selhalo.`);
if (failed > 0) process.exit(1);
