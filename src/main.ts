import './style.css';
import type { CardInstance, PlayerId, Position } from './engine/index.ts';
import { GameEngine, key } from './engine/index.ts';
import { botTakeTurn } from './ai/bot.ts';
import { LIBRARY } from './content/cards.ts';
import { STARTER_DECKS } from './content/decks.ts';
import { describeCard } from './ui/describe.ts';

const HUMAN: PlayerId = 'A';

type Selection = { type: 'hand' | 'board'; uid: number } | null;

let engine = new GameEngine({ library: LIBRARY, decks: STARTER_DECKS, seed: Math.floor(Math.random() * 1e9) });
let selection: Selection = null;
let botPending = false;

const app = document.getElementById('app') as HTMLDivElement;

// ── odvozené zvýraznění podle výběru ──────────────────────────────────────
function legalCells(): Set<string> {
  if (selection?.type === 'hand') {
    return new Set(engine.legalPlacements(selection.uid).map(key));
  }
  return new Set();
}
function attackTargets(): Set<number> {
  if (selection?.type === 'board') return new Set(engine.legalAttackTargets(selection.uid));
  return new Set();
}

// ── vykreslení ────────────────────────────────────────────────────────────
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

function renderBoard(): string {
  const legal = legalCells();
  const targets = attackTargets();
  const s = engine.state;
  let html = `<div class="board" style="grid-template-columns:repeat(${s.cols}, 1fr)">`;
  for (let r = 0; r < s.rows; r++) {
    for (let col = 0; col < s.cols; col++) {
      const pos: Position = { row: r, col };
      const uid = s.grid[r][col];
      const isLegal = legal.has(key(pos));
      const terr = s.terrain.get(key(pos));
      const cellCls = ['cell', isLegal ? 'legal' : '', terr ? 'terrain' : ''].filter(Boolean).join(' ');
      let inner = '';
      if (uid != null) {
        const c = s.cards.get(uid);
        if (c) {
          const sel = selection?.type === 'board' && selection.uid === uid ? 'selected' : '';
          const tgt = targets.has(uid) ? 'target' : '';
          inner = cardChip(c, [sel, tgt].filter(Boolean).join(' '));
        }
      } else if (terr) {
        inner = `<span class="mine">🧨</span>`;
      }
      html += `<div class="${cellCls}" data-cell="${r},${col}">${inner}</div>`;
    }
  }
  html += '</div>';
  return html;
}

function renderHand(): string {
  const cards = engine.handOf(HUMAN);
  const p = engine.state.players[HUMAN];
  const chips = cards
    .map((c) => {
      const sel = selection?.type === 'hand' && selection.uid === c.uid ? 'selected' : '';
      const afford = c.cost <= p.energy ? '' : 'unaffordable';
      const title = describeCard(c) || c.name;
      return `<div class="handcard ${sel} ${afford}" data-hand="${c.uid}" title="${escapeAttr(title)}">
        <div class="hc-cost">${c.cost}</div>
        <div class="hc-name">${c.name}</div>
        <div class="hc-stats">⚔️${c.attack} ❤️${c.hp}${c.range > 1 ? ' 🏹' + c.range : ''}</div>
      </div>`;
    })
    .join('');
  return `<div class="hand">${chips || '<div class="empty">(prázdná ruka)</div>'}</div>`;
}

function renderTopbar(): string {
  const s = engine.state;
  const pA = s.players.A;
  const pB = s.players.B;
  const turnWho = s.active === HUMAN ? 'TY (A)' : 'BOT (B)';
  return `<div class="topbar">
    <div class="badge you">TY ⚡${pA.energy}/${pA.maxEnergy}</div>
    <div class="badge turn">Tah ${s.turnNumber} — ${turnWho}</div>
    <div class="badge bot">BOT ⚡${pB.energy}/${pB.maxEnergy}</div>
  </div>`;
}

function renderControls(): string {
  const canEnd = engine.active === HUMAN && !engine.winner && !botPending;
  return `<div class="controls">
    <button data-action="endturn" ${canEnd ? '' : 'disabled'}>Ukončit tah ⏭️</button>
    <button data-action="newgame">Nová hra 🔁</button>
    <span class="hint">Vyber kartu z ruky → klikni na zvýrazněné políčko. Klikni na svou jednotku → zaútoč na cíl.</span>
  </div>`;
}

function renderOverlay(): string {
  if (!engine.winner) return '';
  const won = engine.winner === HUMAN;
  return `<div class="overlay"><div class="modal ${won ? 'win' : 'lose'}">
      <h1>${won ? '🏆 Vyhrál jsi!' : '💀 Prohrál jsi'}</h1>
      <p>Královna hráče ${engine.winner === 'A' ? 'B' : 'A'} padla.</p>
      <button data-action="newgame">Nová hra</button>
    </div></div>`;
}

function renderLog(): string {
  const lines = engine.state.log.slice(-8).reverse();
  return `<div class="log">${lines.map((l) => `<div>${escapeHtml(l)}</div>`).join('')}</div>`;
}

function render(): void {
  app.innerHTML = `
    <div class="game ${botPending ? 'thinking' : ''}">
      <h2 class="title">CardWars <span>· MVP</span></h2>
      ${renderTopbar()}
      ${renderBoard()}
      ${renderHand()}
      ${renderControls()}
      ${renderLog()}
    </div>
    ${renderOverlay()}
  `;
}

// ── interakce ──────────────────────────────────────────────────────────────
function trySelectBoard(uid: number | null): void {
  if (uid == null) {
    selection = null;
    return;
  }
  const c = engine.card(uid);
  if (c && c.owner === HUMAN && engine.legalAttackTargets(uid).length > 0) {
    selection = { type: 'board', uid };
  } else {
    selection = null;
  }
}

function handleCell(pos: Position): void {
  const uid = engine.state.grid[pos.row][pos.col];
  if (selection?.type === 'hand') {
    if (legalCells().has(key(pos))) {
      engine.play(selection.uid, pos);
      selection = null;
    } else {
      selection = null;
    }
  } else if (selection?.type === 'board') {
    if (uid != null && attackTargets().has(uid)) {
      engine.attack(selection.uid, uid);
      selection = null;
    } else {
      trySelectBoard(uid);
    }
  } else {
    trySelectBoard(uid);
  }
  render();
}

function endTurn(): void {
  if (engine.active !== HUMAN || engine.winner) return;
  selection = null;
  engine.endTurn();
  render();
  runBot();
}

function runBot(): void {
  if (engine.winner || engine.active === HUMAN) return;
  botPending = true;
  render();
  window.setTimeout(() => {
    botTakeTurn(engine);
    botPending = false;
    render();
  }, 500);
}

function newGame(): void {
  engine = new GameEngine({ library: LIBRARY, decks: STARTER_DECKS, seed: Math.floor(Math.random() * 1e9) });
  selection = null;
  botPending = false;
  render();
}

app.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  const actionEl = el.closest('[data-action]') as HTMLElement | null;
  if (actionEl) {
    const action = actionEl.dataset.action;
    if (action === 'endturn') endTurn();
    else if (action === 'newgame') newGame();
    return;
  }
  if (engine.winner || botPending || engine.active !== HUMAN) return;

  const handEl = el.closest('[data-hand]') as HTMLElement | null;
  if (handEl) {
    selection = { type: 'hand', uid: Number(handEl.dataset.hand) };
    render();
    return;
  }
  const cellEl = el.closest('[data-cell]') as HTMLElement | null;
  if (cellEl) {
    const [r, c] = (cellEl.dataset.cell as string).split(',').map(Number);
    handleCell({ row: r, col: c });
  }
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] as string);
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

render();
