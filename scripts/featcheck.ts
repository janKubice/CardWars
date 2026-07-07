// Deterministický test aury a aktivních schopností na úrovni enginu.
// Spuštění: node --experimental-strip-types scripts/featcheck.ts

import { GameEngine, EffectRunner, getEffect, getTarget, instantiate, placeOnGrid, recomputeAuras, drawCards } from '../src/engine/index.ts';
import { CARD_DEFS, LIBRARY } from '../src/content/cards.ts';
import { setLang, cardName } from '../src/i18n/index.ts';

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

// ── BOSS: TRNY — útočník zblízka na trnovou Královnu dostane dmg ──
const e3 = new GameEngine({ library: LIBRARY, decks: { A: [], B: [] }, seed: 5, queens: { A: 'queen', B: 'queen_thorn' } });
const st3 = e3.state;
st3.active = 'A';
st3.players.A.energy = 9;
const brute = instantiate(st3, 'brute', 'A', 'board');
placeOnGrid(st3, brute.uid, { row: 1, col: 3 });
brute.justPlayed = false;
const thornQueen = e3.boardCardsOf('B').find((c) => c.isQueen);
const bruteHp0 = brute.hp;
if (thornQueen) e3.attack(brute.uid, thornQueen.uid);
check('trny: útočník zblízka na trnovou Královnu dostane dmg', brute.hp < bruteHp0 - 1);

// ── BOSS: KRVEŽÍZNIVOST — Krvavá Královna se léčí za padlou nepřátelskou kartu ──
const e4 = new GameEngine({ library: LIBRARY, decks: { A: [], B: [] }, seed: 6, queens: { A: 'queen', B: 'queen_blood' } });
const st4 = e4.state;
const bloodQueen = e4.boardCardsOf('B').find((c) => c.isQueen);
if (bloodQueen) bloodQueen.hp = 10;
const victim2 = instantiate(st4, 'recruit', 'A', 'board', true);
placeOnGrid(st4, victim2.uid, { row: 3, col: 3 });
const runner4 = new EffectRunner(st4);
runner4.enqueue({ type: 'destroy', uid: victim2.uid });
runner4.drain();
check('krvežíznivost: boss se léčí za padlou nepřátelskou kartu', bloodQueen?.hp === 12);

// ── KOMBO: energie navíc + tag synergie ──
const e5 = new GameEngine({ library: LIBRARY, decks: { A: [], B: [] }, seed: 7 });
const st5 = e5.state;
st5.active = 'A';
st5.players.A.energy = 1;
const rit = instantiate(st5, 'ritualist', 'A', 'board');
placeOnGrid(st5, rit.uid, { row: 3, col: 1 });
const runnerE = new EffectRunner(st5);
getEffect('energy')?.(runnerE.makeApi(rit.uid), { value: 2 }, [], rit.uid, undefined);
runnerE.drain();
check('kombo: efekt energy dá +2 energie tento tah', st5.players.A.energy === 3);

const pyro = instantiate(st5, 'pyromaniac', 'A', 'board');
placeOnGrid(st5, pyro.uid, { row: 3, col: 2 });
const mlr = instantiate(st5, 'minelayer', 'A', 'board');
placeOnGrid(st5, mlr.uid, { row: 3, col: 3 });
const tagTargets = getTarget('alliesTag')?.(st5, pyro.uid, { tag: 'Explosive' }, undefined) ?? [];
const mlrAtk = mlr.baseAttack;
const runnerB = new EffectRunner(st5);
getEffect('buff')?.(runnerB.makeApi(pyro.uid), { atk: 1, tag: 'Explosive' }, tagTargets, pyro.uid, undefined);
runnerB.drain();
check('kombo: tag synergie buffne Explosive spojence (+1 útok)', mlr.baseAttack === mlrAtk + 1);

// ── COMBO MOTOR: allyDeploy — Dirigent roste s každou vyloženou kartou ──
const e6 = new GameEngine({ library: LIBRARY, decks: { A: [], B: [] }, seed: 8 });
const st6 = e6.state;
st6.active = 'A';
st6.players.A.energy = 9;
const cond = instantiate(st6, 'conductor', 'A', 'board');
placeOnGrid(st6, cond.uid, { row: 3, col: 3 });
const condAtk0 = cond.baseAttack;
const handCard = instantiate(st6, 'recruit', 'A', 'hand');
st6.players.A.hand.push(handCard.uid);
const played = e6.play(handCard.uid, { row: 3, col: 4 }); // sousedí s Dirigentem
check('allyDeploy: vyložení karty projde', played.ok);
check('allyDeploy: Dirigent získá +1 útok za vyloženou kartu', cond.baseAttack === condAtk0 + 1);

// ── COMBO MOTOR: řetězení výbuchů — sapper → granátník → nepřítel ──
const e7 = new GameEngine({ library: LIBRARY, decks: { A: [], B: [] }, seed: 9 });
const st7 = e7.state;
const sap = instantiate(st7, 'sapper', 'A', 'board');
placeOnGrid(st7, sap.uid, { row: 2, col: 2 });
const gren = instantiate(st7, 'grenadier', 'A', 'board');
placeOnGrid(st7, gren.uid, { row: 2, col: 3 }); // v dosahu výbuchu sappera
const chainFoe = instantiate(st7, 'recruit', 'B', 'board');
placeOnGrid(st7, chainFoe.uid, { row: 2, col: 4 }); // jen v dosahu granátníka, ne sappera
const runner7 = new EffectRunner(st7);
runner7.enqueue({ type: 'destroy', uid: sap.uid });
runner7.drain();
check('řetězení: první výbuch zabije druhého bombera', gren.zone === 'dead');
check('řetězení: druhý výbuch zasáhne vzdálenějšího nepřítele', chainFoe.zone === 'dead');

// ── VALIDACE POOLU: jména (CS+EN) a platné odkazy přivolání ──
let missingName = 0;
for (const lang of ['cs', 'en'] as const) {
  setLang(lang);
  for (const d of CARD_DEFS) {
    if (cardName(d.id) === 'card.' + d.id) { console.log(`  chybí jméno [${lang}]: ${d.id}`); missingName++; }
  }
}
setLang('cs');
check(`pool: každá karta má jméno v CS i EN (${CARD_DEFS.length} karet)`, missingName === 0);

let badSummon = 0;
for (const d of CARD_DEFS) {
  for (const ab of d.abilities ?? []) {
    const ref = ab.params?.defId;
    if (typeof ref === 'string' && !LIBRARY[ref]) { console.log(`  neplatné přivolání: ${d.id} → ${ref}`); badSummon++; }
  }
}
check('pool: všechna přivolání (defId) míří na existující kartu', badSummon === 0);

const buyable = CARD_DEFS.filter((d) => !d.isQueen && !(d.tags ?? []).includes('token'));
check(`pool: 100+ kupitelných karet (aktuálně ${buyable.length})`, buyable.length >= 100);

console.log(failed === 0 ? '\nOK ✅ vše OK (aura, aktivace, efekty, recyklace, bossové, kombo, combo motory, pool).' : `\nCHYBA: ${failed} kontrol selhalo.`);
if (failed > 0) process.exit(1);
