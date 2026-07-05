import './style.css';
import type { CardInstance, PlayerId, Position } from './engine/index.ts';
import { GameEngine, key } from './engine/index.ts';
import { botTakeTurn } from './ai/bot.ts';
import { LIBRARY } from './content/cards.ts';
import { describeCard, describeDef, describeAbility } from './ui/describe.ts';
import { t, cardName, formatLog, getLang, setLang, type Lang } from './i18n/index.ts';
import {
  createRun, makeBattleConfig, startBattle, onBattleWin, onBattleLoss,
  buy, reroll, removeCard, upgrade, canUpgrade, upgradeCost,
  deckSummary, cardDef, REMOVE_COST, MAX_ANTE, MAX_LEVEL,
  type RunState,
} from './run/run.ts';

const HUMAN: PlayerId = 'A';

type Screen = 'menu' | 'run';
type Selection = { type: 'hand' | 'board'; uid: number } | null;
interface BattleState { engine: GameEngine; selection: Selection; botPending: boolean; }

let screen: Screen = 'menu';
let run: RunState | null = null;
let battle: BattleState | null = null;
let pendingActive: number | null = null; // uid karty čekající na cíl aktivace

const app = document.getElementById('app') as HTMLDivElement;
const randomSeed = () => Math.floor(Math.random() * 1e9);
const rarityOf = (defId: string) => LIBRARY[defId].rarity;

// ── přechody ────────────────────────────────────────────────────────────────
function startRun(): void { run = createRun(randomSeed()); battle = null; screen = 'run'; render(); }
function toMenu(): void { screen = 'menu'; run = null; battle = null; render(); }
function enterBattle(): void {
  if (!run) return;
  startBattle(run);
  battle = { engine: new GameEngine(makeBattleConfig(run)), selection: null, botPending: false };
  render();
}
function afterBattle(): void {
  if (!run || !battle) return;
  if (battle.engine.winner === HUMAN) onBattleWin(run); else onBattleLoss(run);
  battle = null;
  render();
}

// ── zvýraznění ──────────────────────────────────────────────────────────────
function legalCells(b: BattleState): Set<string> {
  return b.selection?.type === 'hand' ? new Set(b.engine.legalPlacements(b.selection.uid).map(key)) : new Set();
}
function attackTargets(b: BattleState): Set<number> {
  if (pendingActive != null) return new Set();
  return b.selection?.type === 'board' ? new Set(b.engine.legalAttackTargets(b.selection.uid)) : new Set();
}
function activeTargetSet(b: BattleState): Set<number> {
  return pendingActive != null ? new Set(b.engine.activeTargets(pendingActive)) : new Set();
}

// ── malé stavební kameny ────────────────────────────────────────────────────
function pips(cur: number, max: number): string {
  let s = '';
  for (let i = 0; i < max; i++) s += `<i class="pip ${i < cur ? 'on' : ''}"></i>`;
  return `<span class="pips">${s}</span>`;
}
function badges(c: CardInstance): string {
  const b: string[] = [];
  if (c.shield > 0) b.push(`<span class="bdg shield">🛡${c.shield}</span>`);
  if (c.counters['countdown'] != null) b.push(`<span class="bdg count">⏳${c.counters['countdown']}</span>`);
  if (c.range > 1) b.push(`<span class="bdg rng">🏹${c.range}</span>`);
  return b.length ? `<div class="bdgs">${b.join('')}</div>` : '';
}
function pieceCard(c: CardInstance, extra: string): string {
  const cls = ['pc', c.owner === 'A' ? 'pc--a' : 'pc--b', c.isQueen ? 'pc--queen' : '', `r-${rarityOf(c.defId)}`, extra]
    .filter(Boolean).join(' ');
  const abil = c.abilities.length ? '<span class="dot">✦</span>' : '';
  const title = describeCard(c) || cardName(c.defId);
  const atkCls = c.attack > c.baseAttack ? 'atk buffed' : 'atk';
  return `<div class="${cls}" title="${escapeAttr(cardName(c.defId) + (title ? ' — ' + title : ''))}">
      ${c.isQueen ? '<span class="crown">♛</span>' : ''}
      <div class="pc__name">${escapeHtml(cardName(c.defId))}${abil}</div>
      ${badges(c)}
      <div class="pc__foot"><span class="${atkCls}">${c.attack}</span><span class="hp">${Math.max(0, c.hp)}</span></div>
    </div>`;
}

// ── LANG BAR (nahoře na všech obrazovkách) ──────────────────────────────────
function langBar(withHome: boolean): string {
  const l = getLang();
  const home = withHome ? `<button class="ghost sm" data-action="home" title="Menu">⌂</button>` : '';
  return `<div class="langbar">
      ${home}
      <div class="langtoggle">
        <button class="${l === 'cs' ? 'on' : ''}" data-action="lang" data-lang="cs">CS</button>
        <button class="${l === 'en' ? 'on' : ''}" data-action="lang" data-lang="en">EN</button>
      </div>
    </div>`;
}
function logo(size: 'big' | 'sm'): string {
  return `<div class="logo logo--${size}"><span class="crownlogo">♛</span>Card<span class="accent">Wars</span></div>`;
}

// ── MENU ────────────────────────────────────────────────────────────────────
function renderMenu(): string {
  return `${langBar(false)}
    <div class="menu">
      ${logo('big')}
      <p class="tagline">${t('app.tagline')}</p>
      <p class="subtitle">${t('menu.subtitle')}</p>
      <button class="primary xl" data-action="newrun">${t('menu.newRun')} ⚔️</button>
      <p class="howto">${t('menu.howto')}</p>
    </div>`;
}

// ── SOUBOJ ──────────────────────────────────────────────────────────────────
function renderBoard(b: BattleState): string {
  const legal = legalCells(b);
  const targets = attackTargets(b);
  const actTargets = activeTargetSet(b);
  const s = b.engine.state;
  let html = `<div class="board" style="grid-template-columns:repeat(${s.cols},1fr)">`;
  for (let r = 0; r < s.rows; r++) {
    for (let col = 0; col < s.cols; col++) {
      const pos: Position = { row: r, col };
      const uid = s.grid[r][col];
      const terr = s.terrain.get(key(pos));
      const cellCls = ['cell', legal.has(key(pos)) ? 'legal' : '', terr ? 'terr' : ''].filter(Boolean).join(' ');
      let inner = '';
      if (uid != null) {
        const c = s.cards.get(uid);
        if (c) {
          const sel = (b.selection?.type === 'board' && b.selection.uid === uid) || pendingActive === uid ? 'is-sel' : '';
          const tgt = targets.has(uid) ? 'is-tgt' : actTargets.has(uid) ? 'is-act' : '';
          inner = pieceCard(c, [sel, tgt].filter(Boolean).join(' '));
        }
      } else if (terr) inner = `<span class="mine">🧨</span>`;
      html += `<div class="${cellCls}" data-cell="${r},${col}">${inner}</div>`;
    }
  }
  return html + '</div>';
}
function renderHand(b: BattleState): string {
  const p = b.engine.state.players[HUMAN];
  const chips = b.engine.handOf(HUMAN).map((c) => {
    const sel = b.selection?.type === 'hand' && b.selection.uid === c.uid ? 'is-sel' : '';
    const aff = c.cost <= p.energy ? '' : 'is-dim';
    return `<div class="hcard r-${rarityOf(c.defId)} ${sel} ${aff}" data-hand="${c.uid}" title="${escapeAttr(describeCard(c) || cardName(c.defId))}">
        <span class="hcard__cost">${c.cost}</span>
        <div class="hcard__name">${escapeHtml(cardName(c.defId))}</div>
        <div class="hcard__foot"><span class="atk">${c.attack}</span><span class="hp">${c.hp}</span>${c.range > 1 ? `<span class="rng">🏹${c.range}</span>` : ''}</div>
      </div>`;
  }).join('');
  return `<div class="hand">${chips || `<div class="empty">—</div>`}</div>`;
}
function playerPlate(side: PlayerId): string {
  const b = battle as BattleState;
  const p = b.engine.state.players[side];
  const you = side === HUMAN;
  const active = b.engine.state.active === side;
  return `<div class="plate ${you ? 'plate--you' : 'plate--bot'} ${active ? 'active' : ''}">
      <span class="plate__who">${you ? t('battle.you') : t('battle.bot')}</span>
      ${pips(p.energy, p.maxEnergy)}
    </div>`;
}
function renderActionBar(b: BattleState): string {
  if (pendingActive != null) {
    return `<div class="actionbar act">
        <span>🎯 ${t('battle.chooseTarget')}</span>
        <button class="ghost sm" data-action="cancelactive">✕ ${t('battle.cancel')}</button>
      </div>`;
  }
  if (b.selection?.type !== 'board') return '';
  const uid = b.selection.uid;
  const parts: string[] = [];
  if (b.engine.legalAttackTargets(uid).length > 0) parts.push(`<span class="hint">${t('battle.attackHint')}</span>`);
  if (b.engine.canActivate(uid)) {
    const ab = b.engine.activeAbility(uid);
    if (ab) {
      const cost = Number(ab.params?.cost ?? 0);
      parts.push(`<button class="primary sm" data-action="activatebtn" data-uid="${uid}">✨ ${escapeHtml(describeAbility(ab))} (⚡${cost})</button>`);
    }
  }
  return parts.length ? `<div class="actionbar">${parts.join('')}</div>` : '';
}
function renderBattle(b: BattleState): string {
  const s = b.engine.state;
  const canEnd = s.active === HUMAN && !b.engine.winner && !b.botPending;
  const gold = run ? run.gold : 0;
  const ante = run ? run.ante : 1;
  return `${langBar(true)}
    <div class="game ${b.botPending ? 'thinking' : ''}">
      <div class="hud">
        <div class="hud__run">Ante <b>${ante}</b>/${MAX_ANTE} · <span class="gold">🪙 ${gold}</span></div>
        <div class="hud__turn">${t('battle.turn')} ${s.turnNumber}</div>
      </div>
      <div class="plates">${playerPlate('B')}${playerPlate('A')}</div>
      ${renderBoard(b)}
      ${renderActionBar(b)}
      ${renderHand(b)}
      <div class="controls">
        <button class="primary" data-action="endturn" ${canEnd ? '' : 'disabled'}>${t('battle.endTurn')} ⏭</button>
        ${b.botPending ? `<span class="thinking-tag">${t('battle.thinking')}</span>` : `<span class="hint">${t('battle.hint')}</span>`}
      </div>
      <details class="logbox"><summary>${t('battle.log')}</summary>
        <div class="log">${s.log.slice(-10).reverse().map((l) => `<div>${escapeHtml(formatLog(l))}</div>`).join('')}</div>
      </details>
    </div>
    ${renderBattleEnd(b)}`;
}
function renderBattleEnd(b: BattleState): string {
  if (!b.engine.winner || !run) return '';
  const won = b.engine.winner === HUMAN;
  const last = run.ante >= MAX_ANTE;
  const msg = won ? (last ? t('battle.lastAnte') : t('battle.reward', { n: 4 + run.ante })) : t('battle.queenFell');
  const btn = won ? (last ? t('battle.finishRun') : t('battle.toShop')) : t('battle.endRun');
  return `<div class="overlay"><div class="modal ${won ? 'win' : 'lose'}">
      <h1>${won ? '🏆 ' + t('battle.winTitle') : '💀 ' + t('battle.loseTitle')}</h1>
      <p>${msg}</p>
      <button class="primary" data-action="afterbattle">${btn}</button>
    </div></div>`;
}

// ── OBCHOD ──────────────────────────────────────────────────────────────────
function renderShop(): string {
  const r = run;
  if (!r) return '';
  const cards = r.shop.map((item, i) => {
    const def = cardDef(item.defId);
    const afford = r.gold >= item.price;
    const abil = describeDef(def);
    return `<div class="shopcard r-${def.rarity} ${item.sold ? 'sold' : ''}">
        <div class="shopcard__head">
          <span class="shopcard__name">${escapeHtml(cardName(def.id))}</span>
          <span class="shopcard__rar r-txt-${def.rarity}">${t('rar.' + def.rarity)}</span>
        </div>
        <div class="shopcard__stats"><span class="cost">⚡${def.cost}</span> <span class="atk">${def.attack}</span> <span class="hp">${def.hp}</span>${def.range > 1 ? ` <span class="rng">🏹${def.range}</span>` : ''}</div>
        <div class="shopcard__abil">${abil ? escapeHtml(abil) : `<span class="muted">${t('shop.noAbility')}</span>`}</div>
        <button class="buy" data-action="buy" data-idx="${i}" ${item.sold || !afford ? 'disabled' : ''}>
          ${item.sold ? t('shop.bought') : `${t('shop.buy')} 🪙${item.price}`}
        </button>
      </div>`;
  }).join('');
  const deck = deckSummary(r).map((d) => {
    const lvlTag = d.level > 0 ? `<span class="lvl">+${d.level}</span>` : '';
    const upBtn = d.level >= MAX_LEVEL
      ? `<span class="maxlvl">MAX</span>`
      : `<button class="mini up" data-action="upgrade" data-def="${d.defId}" ${canUpgrade(r, d.defId) ? '' : 'disabled'} title="${t('shop.upgrade')}">⬆🪙${upgradeCost(d.level)}</button>`;
    return `<div class="deckrow">
        <span>${d.count}× <b>${escapeHtml(cardName(d.defId))}</b>${lvlTag} <span class="muted">⚡${d.cost}</span></span>
        <span class="deckrow__btns">${upBtn}<button class="mini" data-action="remove" data-def="${d.defId}" ${r.gold >= REMOVE_COST ? '' : 'disabled'} title="${t('shop.remove')}">−🪙${REMOVE_COST}</button></span>
      </div>`;
  }).join('');
  return `${langBar(true)}
    <div class="shop">
      <div class="shopbar">
        <span class="shopbar__title">🛒 ${t('shop.title')}</span>
        <span>Ante <b>${r.ante}</b>/${MAX_ANTE}</span>
        <span class="gold">🪙 ${r.gold}</span>
        <span class="muted">${r.wins} ${t('shop.wins')}</span>
      </div>
      <div class="shopgrid">${cards}</div>
      <div class="shopactions">
        <button class="ghost" data-action="reroll" ${r.gold >= r.rerollCost ? '' : 'disabled'}>🔄 ${t('shop.reroll')} 🪙${r.rerollCost}</button>
        <button class="primary big" data-action="tobattle">${t('shop.toBattle')} ⚔️</button>
      </div>
      <h3>${t('shop.deck')} <span class="muted">(${r.deck.length} ${t('shop.cards')})</span></h3>
      <div class="decklist">${deck}</div>
    </div>`;
}

// ── KONEC RUNU ──────────────────────────────────────────────────────────────
function renderEnd(): string {
  if (!run) return '';
  const won = run.status === 'won';
  return `${langBar(true)}
    <div class="endscreen">
      <div class="modal center ${won ? 'win' : 'lose'}">
        <h1>${won ? '👑 ' + t('end.wonTitle') : '☠️ ' + t('end.lostTitle')}</h1>
        <p>${t('end.summary', { wins: run.wins, max: MAX_ANTE })}</p>
        <button class="primary xl" data-action="newrun">${t('end.newRun')} 🔁</button>
      </div>
    </div>`;
}

// ── ROUTER ──────────────────────────────────────────────────────────────────
function render(): void {
  let body: string;
  if (screen === 'menu') body = renderMenu();
  else if (!run) body = renderMenu();
  else if (run.status === 'won' || run.status === 'lost') body = renderEnd();
  else if (run.status === 'shop') body = renderShop();
  else if (battle) body = renderBattle(battle);
  else body = renderShop();
  app.innerHTML = body;
}

// ── interakce v souboji ─────────────────────────────────────────────────────
function trySelectBoard(b: BattleState, uid: number | null): void {
  if (uid == null) { b.selection = null; return; }
  const c = b.engine.card(uid);
  const canAct = c && c.owner === HUMAN && (b.engine.legalAttackTargets(uid).length > 0 || b.engine.canActivate(uid));
  b.selection = canAct ? { type: 'board', uid } : null;
}
function handleCell(b: BattleState, pos: Position): void {
  const uid = b.engine.state.grid[pos.row][pos.col];
  if (pendingActive != null) {
    if (uid != null && b.engine.activeTargets(pendingActive).includes(uid)) b.engine.activate(pendingActive, uid);
    pendingActive = null;
    b.selection = null;
    render();
    return;
  }
  if (b.selection?.type === 'hand') {
    if (legalCells(b).has(key(pos))) b.engine.play(b.selection.uid, pos);
    b.selection = null;
  } else if (b.selection?.type === 'board') {
    if (uid != null && attackTargets(b).has(uid)) { b.engine.attack(b.selection.uid, uid); b.selection = null; }
    else trySelectBoard(b, uid);
  } else trySelectBoard(b, uid);
  render();
}
function endTurn(b: BattleState): void {
  if (b.engine.active !== HUMAN || b.engine.winner) return;
  b.selection = null;
  pendingActive = null;
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
  if (actionEl) { handleAction(actionEl.dataset.action as string, actionEl); return; }
  if (screen !== 'run' || !run || run.status !== 'battle' || !battle) return;
  if (battle.engine.winner || battle.botPending || battle.engine.active !== HUMAN) return;
  const handEl = el.closest('[data-hand]') as HTMLElement | null;
  if (handEl) { battle.selection = { type: 'hand', uid: Number(handEl.dataset.hand) }; pendingActive = null; render(); return; }
  const cellEl = el.closest('[data-cell]') as HTMLElement | null;
  if (cellEl) { const [r, c] = (cellEl.dataset.cell as string).split(',').map(Number); handleCell(battle, { row: r, col: c }); }
});

function handleAction(action: string, el: HTMLElement): void {
  switch (action) {
    case 'lang': setLang(el.dataset.lang as Lang); render(); break;
    case 'home': toMenu(); break;
    case 'newrun': startRun(); break;
    case 'endturn': if (battle) endTurn(battle); break;
    case 'activatebtn': {
      if (!battle) break;
      const uid = Number(el.dataset.uid);
      const ab = battle.engine.activeAbility(uid);
      if (ab && ab.target === 'chosen') { pendingActive = uid; render(); }
      else { battle.engine.activate(uid); pendingActive = null; battle.selection = null; render(); }
      break;
    }
    case 'cancelactive': pendingActive = null; if (battle) battle.selection = null; render(); break;
    case 'afterbattle': afterBattle(); break;
    case 'tobattle': enterBattle(); break;
    case 'reroll': if (run) { reroll(run); render(); } break;
    case 'buy': if (run) { buy(run, Number(el.dataset.idx)); render(); } break;
    case 'remove': if (run) { removeCard(run, el.dataset.def as string); render(); } break;
    case 'upgrade': if (run) { upgrade(run, el.dataset.def as string); render(); } break;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] as string);
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

render();
