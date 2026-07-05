import './style.css';
import type { CardInstance, PlayerId, Position } from './engine/index.ts';
import { GameEngine, key } from './engine/index.ts';
import { botTakeTurn } from './ai/bot.ts';
import { describeCard, describeDef } from './ui/describe.ts';
import {
  createRun, makeBattleConfig, startBattle, onBattleWin, onBattleLoss,
  buy, reroll, removeCard, deckSummary, cardDef, REMOVE_COST, MAX_ANTE,
  type RunState,
} from './run/run.ts';

const HUMAN: PlayerId = 'A';

type Selection = { type: 'hand' | 'board'; uid: number } | null;
interface BattleState {
  engine: GameEngine;
  selection: Selection;
  botPending: boolean;
}

let run: RunState = createRun(randomSeed());
let battle: BattleState | null = null;

const app = document.getElementById('app') as HTMLDivElement;

function randomSeed(): number {
  return Math.floor(Math.random() * 1e9);
}

// ── přechody run <-> souboj ────────────────────────────────────────────────
function enterBattle(): void {
  startBattle(run);
  battle = { engine: new GameEngine(makeBattleConfig(run)), selection: null, botPending: false };
  render();
}
function afterBattle(): void {
  if (!battle) return;
  if (battle.engine.winner === HUMAN) onBattleWin(run);
  else onBattleLoss(run);
  battle = null;
  render();
}
function newRun(): void {
  run = createRun(randomSeed());
  battle = null;
  render();
}

// ── zvýraznění v souboji ────────────────────────────────────────────────────
function legalCells(b: BattleState): Set<string> {
  if (b.selection?.type === 'hand') return new Set(b.engine.legalPlacements(b.selection.uid).map(key));
  return new Set();
}
function attackTargets(b: BattleState): Set<number> {
  if (b.selection?.type === 'board') return new Set(b.engine.legalAttackTargets(b.selection.uid));
  return new Set();
}

// ── vykreslení: SOUBOJ ──────────────────────────────────────────────────────
function statLine(c: CardInstance): string {
  const bits = [`⚔️${c.attack}`, `❤️${Math.max(0, c.hp)}`];
  if (c.range > 1) bits.push(`🏹${c.range}`);
  if (c.shield > 0) bits.push(`🛡️${c.shield}`);
  if (c.counters['countdown'] != null) bits.push(`⏳${c.counters['countdown']}`);
  return bits.join(' ');
}
function cardChip(c: CardInstance, extraClass: string): string {
  const cls = ['card', `owner-${c.owner}`, c.isQueen ? 'queen' : '', extraClass].filter(Boolean).join(' ');
  const title = describeCard(c) || c.name;
  const kw = c.keywords.length ? `<span class="kw">${c.keywords.map((k) => k[0].toUpperCase()).join('')}</span>` : '';
  const dot = c.abilities.length ? '<span class="abil">✦</span>' : '';
  return `<div class="${cls}" title="${escapeAttr(c.name + ' — ' + title)}">
      <div class="cname">${c.name}${dot}${kw}</div>
      <div class="cstats">${statLine(c)}</div>
    </div>`;
}
function renderBoard(b: BattleState): string {
  const legal = legalCells(b);
  const targets = attackTargets(b);
  const s = b.engine.state;
  let html = `<div class="board" style="grid-template-columns:repeat(${s.cols}, 1fr)">`;
  for (let r = 0; r < s.rows; r++) {
    for (let col = 0; col < s.cols; col++) {
      const pos: Position = { row: r, col };
      const uid = s.grid[r][col];
      const terr = s.terrain.get(key(pos));
      const cellCls = ['cell', legal.has(key(pos)) ? 'legal' : '', terr ? 'terrain' : ''].filter(Boolean).join(' ');
      let inner = '';
      if (uid != null) {
        const c = s.cards.get(uid);
        if (c) {
          const sel = b.selection?.type === 'board' && b.selection.uid === uid ? 'selected' : '';
          const tgt = targets.has(uid) ? 'target' : '';
          inner = cardChip(c, [sel, tgt].filter(Boolean).join(' '));
        }
      } else if (terr) {
        inner = `<span class="mine">🧨</span>`;
      }
      html += `<div class="${cellCls}" data-cell="${r},${col}">${inner}</div>`;
    }
  }
  return html + '</div>';
}
function renderHand(b: BattleState): string {
  const p = b.engine.state.players[HUMAN];
  const chips = b.engine.handOf(HUMAN)
    .map((c) => {
      const sel = b.selection?.type === 'hand' && b.selection.uid === c.uid ? 'selected' : '';
      const afford = c.cost <= p.energy ? '' : 'unaffordable';
      return `<div class="handcard ${sel} ${afford}" data-hand="${c.uid}" title="${escapeAttr(describeCard(c) || c.name)}">
        <div class="hc-cost">${c.cost}</div>
        <div class="hc-name">${c.name}</div>
        <div class="hc-stats">⚔️${c.attack} ❤️${c.hp}${c.range > 1 ? ' 🏹' + c.range : ''}</div>
      </div>`;
    })
    .join('');
  return `<div class="hand">${chips || '<div class="empty">(prázdná ruka)</div>'}</div>`;
}
function renderBattle(b: BattleState): string {
  const s = b.engine.state;
  const turnWho = s.active === HUMAN ? 'TY' : 'BOT';
  const canEnd = s.active === HUMAN && !b.engine.winner && !b.botPending;
  return `
    <div class="game ${b.botPending ? 'thinking' : ''}">
      <div class="runbar">Ante ${run.ante}/${MAX_ANTE} · 🪙 ${run.gold}</div>
      <div class="topbar">
        <div class="badge you">TY ⚡${s.players.A.energy}/${s.players.A.maxEnergy}</div>
        <div class="badge turn">Tah ${s.turnNumber} — ${turnWho}</div>
        <div class="badge bot">BOT ⚡${s.players.B.energy}/${s.players.B.maxEnergy}</div>
      </div>
      ${renderBoard(b)}
      ${renderHand(b)}
      <div class="controls">
        <button data-action="endturn" ${canEnd ? '' : 'disabled'}>Ukončit tah ⏭️</button>
        <span class="hint">Vyber kartu z ruky → klikni na zvýrazněné políčko. Klikni na svou jednotku → zaútoč na cíl.</span>
      </div>
      <div class="log">${s.log.slice(-8).reverse().map((l) => `<div>${escapeHtml(l)}</div>`).join('')}</div>
    </div>
    ${renderBattleEnd(b)}`;
}
function renderBattleEnd(b: BattleState): string {
  if (!b.engine.winner) return '';
  const won = b.engine.winner === HUMAN;
  const last = run.ante >= MAX_ANTE;
  return `<div class="overlay"><div class="modal ${won ? 'win' : 'lose'}">
      <h1>${won ? '🏆 Souboj vyhrán!' : '💀 Prohra'}</h1>
      <p>${won ? (last ? 'Poslední ante — dohráno!' : `Získáváš 🪙 ${4 + run.ante} zlata.`) : 'Tvoje Královna padla. Konec runu.'}</p>
      <button data-action="afterbattle">${won ? (last ? 'Dokončit run' : 'Do obchodu 🛒') : 'Konec runu'}</button>
    </div></div>`;
}

// ── vykreslení: OBCHOD ──────────────────────────────────────────────────────
function renderShop(): string {
  const canReroll = run.gold >= run.rerollCost;
  const shopCards = run.shop
    .map((item, i) => {
      const def = cardDef(item.defId);
      const afford = run.gold >= item.price;
      const cls = ['shopcard', `rar-${def.rarity}`, item.sold ? 'sold' : ''].join(' ');
      const abil = describeDef(def);
      return `<div class="${cls}">
        <div class="sc-top"><span class="sc-name">${def.name}</span><span class="sc-rar">${def.rarity}</span></div>
        <div class="sc-stats">⚡${def.cost} · ⚔️${def.attack} ❤️${def.hp}${def.range > 1 ? ' 🏹' + def.range : ''}</div>
        <div class="sc-abil">${abil ? escapeHtml(abil) : '<span class="muted">bez schopnosti</span>'}</div>
        <button data-action="buy" data-idx="${i}" ${item.sold || !afford ? 'disabled' : ''}>
          ${item.sold ? 'koupeno' : `Koupit 🪙${item.price}`}
        </button>
      </div>`;
    })
    .join('');

  const deck = deckSummary(run)
    .map((d) => `<div class="deckrow">
        <span>${d.count}× <b>${d.name}</b> <span class="muted">(⚡${d.cost})</span></span>
        <button class="mini" data-action="remove" data-def="${d.defId}" ${run.gold >= REMOVE_COST ? '' : 'disabled'}>−🪙${REMOVE_COST}</button>
      </div>`)
    .join('');

  return `
    <div class="shop">
      <div class="runbar big">🛒 Obchod — Ante ${run.ante}/${MAX_ANTE} · 🪙 ${run.gold} · výher: ${run.wins}</div>
      <div class="shopgrid">${shopCards}</div>
      <div class="shopactions">
        <button data-action="reroll" ${canReroll ? '' : 'disabled'}>Přehodit 🔄 🪙${run.rerollCost}</button>
        <button class="primary" data-action="tobattle">Do boje ⚔️ (ante ${run.ante})</button>
      </div>
      <h3>Tvůj balíček (${run.deck.length} karet)</h3>
      <div class="decklist">${deck}</div>
    </div>`;
}

// ── vykreslení: KONEC RUNU ──────────────────────────────────────────────────
function renderEnd(): string {
  const won = run.status === 'won';
  return `<div class="shop"><div class="modal center ${won ? 'win' : 'lose'}">
      <h1>${won ? '👑 Run dokončen!' : '☠️ Konec runu'}</h1>
      <p>Vyhraných soubojů: <b>${run.wins}</b> / ${MAX_ANTE}. Nasbíráno zlata cestou.</p>
      <button class="primary" data-action="newrun">Nový run 🔁</button>
    </div></div>`;
}

function render(): void {
  if (run.status === 'won' || run.status === 'lost') app.innerHTML = header() + renderEnd();
  else if (run.status === 'shop') app.innerHTML = header() + renderShop();
  else if (battle) app.innerHTML = header() + renderBattle(battle);
  else app.innerHTML = header();
}
function header(): string {
  return `<h2 class="title">CardWars <span>· roguelike MVP</span></h2>`;
}

// ── interakce v souboji ─────────────────────────────────────────────────────
function trySelectBoard(b: BattleState, uid: number | null): void {
  if (uid == null) { b.selection = null; return; }
  const c = b.engine.card(uid);
  b.selection = c && c.owner === HUMAN && b.engine.legalAttackTargets(uid).length > 0 ? { type: 'board', uid } : null;
}
function handleCell(b: BattleState, pos: Position): void {
  const uid = b.engine.state.grid[pos.row][pos.col];
  if (b.selection?.type === 'hand') {
    if (legalCells(b).has(key(pos))) b.engine.play(b.selection.uid, pos);
    b.selection = null;
  } else if (b.selection?.type === 'board') {
    if (uid != null && attackTargets(b).has(uid)) { b.engine.attack(b.selection.uid, uid); b.selection = null; }
    else trySelectBoard(b, uid);
  } else {
    trySelectBoard(b, uid);
  }
  render();
}
function endTurn(b: BattleState): void {
  if (b.engine.active !== HUMAN || b.engine.winner) return;
  b.selection = null;
  b.engine.endTurn();
  render();
  if (!b.engine.winner && b.engine.active !== HUMAN) {
    b.botPending = true;
    render();
    window.setTimeout(() => { botTakeTurn(b.engine); b.botPending = false; render(); }, 450);
  }
}

// ── delegace kliknutí ───────────────────────────────────────────────────────
app.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  const actionEl = el.closest('[data-action]') as HTMLElement | null;
  if (actionEl) {
    handleAction(actionEl.dataset.action as string, actionEl);
    return;
  }
  // klikání v souboji (výběr karty / políčka)
  if (run.status !== 'battle' || !battle || battle.engine.winner || battle.botPending || battle.engine.active !== HUMAN) return;
  const handEl = el.closest('[data-hand]') as HTMLElement | null;
  if (handEl) { battle.selection = { type: 'hand', uid: Number(handEl.dataset.hand) }; render(); return; }
  const cellEl = el.closest('[data-cell]') as HTMLElement | null;
  if (cellEl) {
    const [r, c] = (cellEl.dataset.cell as string).split(',').map(Number);
    handleCell(battle, { row: r, col: c });
  }
});

function handleAction(action: string, el: HTMLElement): void {
  switch (action) {
    case 'endturn': if (battle) endTurn(battle); break;
    case 'afterbattle': afterBattle(); break;
    case 'tobattle': enterBattle(); break;
    case 'reroll': reroll(run); render(); break;
    case 'buy': buy(run, Number(el.dataset.idx)); render(); break;
    case 'remove': removeCard(run, el.dataset.def as string); render(); break;
    case 'newrun': newRun(); break;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] as string);
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

render();
