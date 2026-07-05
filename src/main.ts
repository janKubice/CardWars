import './style.css';
import type { CardInstance, PlayerId, Position } from './engine/index.ts';
import { GameEngine, key } from './engine/index.ts';
import { stepBot } from './ai/bot.ts';
import { LIBRARY } from './content/cards.ts';
import { describeCard, describeDef, describeAbility } from './ui/describe.ts';
import { initSprites, frameFor, iconFor } from './ui/sprites.ts';
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

const CARD_ART: Record<string, string> = {
  queen: '👑', recruit: '⚔️', spearman: '🔱', archer: '🏹', medic: '➕', wall: '🧱',
  minelayer: '💣', reaper: '🌾', protector: '🛡️', berserk: '😡', courier: '✉️', vengetree: '🌳',
  runeshield: '🔷', avenger: '🗡️', timebomb: '🧨', cannon: '💥', pyro: '🔥', commander: '🎖️',
  banner: '🚩', zealot: '🙏', healer: '💚', zapper: '⚡', slinger: '🪨', squire: '🪖',
  brute: '👊', scout: '👁️', shover: '🤚', sapper: '🧨', cleric: '✝️', hexer: '🔮',
  sniper: '🎯', bouncer: '🚪', silencer: '🤫', summoner: '🌀', warlord: '🎗️', plague: '🐦‍⬛',
  archmage: '🧙', titan: '🗿',
};
// pixel-art ikona ze sheetu; Královna má korunu, jinak fallback na emoji
function cardArt(defId: string): string {
  if (defId === 'queen') return '<span class="artemoji">👑</span>';
  const uri = iconFor(defId);
  if (uri) return `<span class="spr" style="background-image:url(${uri})"></span>`;
  return `<span class="artemoji">${CARD_ART[defId] ?? '❔'}</span>`;
}

// vrstva pro efekty (plovoucí čísla, záblesky) — přežívá překreslení #app
const fx = document.createElement('div');
fx.id = 'fx';
document.body.appendChild(fx);
let renderedUids = new Set<number>(); // pro animaci "vyložení" jen u nových karet

// ── animační pomůcky ────────────────────────────────────────────────────────
interface Snap { row: number; col: number; hp: number; maxHp: number; }
function snapshot(engine: GameEngine): Map<number, Snap> {
  const m = new Map<number, Snap>();
  for (const c of engine.state.cards.values()) {
    if (c.zone === 'board' && c.pos) m.set(c.uid, { row: c.pos.row, col: c.pos.col, hp: c.hp, maxHp: c.maxHp });
  }
  return m;
}
function cellRect(row: number, col: number): DOMRect | null {
  const el = app.querySelector(`.cell[data-cell="${row},${col}"]`);
  return el ? el.getBoundingClientRect() : null;
}
function flashCard(uid: number, cls: string): void {
  const el = app.querySelector(`.pc[data-uid="${uid}"]`);
  if (el) el.classList.add(cls);
}
function floatText(row: number, col: number, text: string, cls: string): void {
  const r = cellRect(row, col);
  if (!r) return;
  const d = document.createElement('div');
  d.className = `fxfloat ${cls}`;
  d.textContent = text;
  d.style.left = `${r.left + r.width / 2}px`;
  d.style.top = `${r.top + r.height / 2}px`;
  fx.appendChild(d);
  window.setTimeout(() => d.remove(), 950);
}
function burstAt(row: number, col: number, cls: string, glyph: string): void {
  const r = cellRect(row, col);
  if (!r) return;
  const d = document.createElement('div');
  d.className = `fxburst ${cls}`;
  d.textContent = glyph;
  d.style.left = `${r.left + r.width / 2}px`;
  d.style.top = `${r.top + r.height / 2}px`;
  fx.appendChild(d);
  window.setTimeout(() => d.remove(), 650);
}
function animateDiff(before: Map<number, Snap>, after: Map<number, Snap>): void {
  for (const [uid, b] of before) {
    const a = after.get(uid);
    if (!a) { burstAt(b.row, b.col, 'death', '💥'); continue; }
    if (a.hp < b.hp) { flashCard(uid, 'hit'); floatText(a.row, a.col, `-${b.hp - a.hp}`, 'dmg'); }
    else if (a.hp > b.hp) { flashCard(uid, 'healed'); floatText(a.row, a.col, `+${a.hp - b.hp}`, 'heal'); }
  }
}

// útočník se rozmáchne směrem k cíli
function lungeAttack(eng: GameEngine, before: Map<number, Snap>, attacker: number, target: number): void {
  const a = eng.card(attacker);
  const tp = before.get(target);
  if (!a?.pos || !tp) return;
  const dx = Math.sign(tp.col - a.pos.col) * 12;
  const dy = Math.sign(tp.row - a.pos.row) * 12;
  const el = app.querySelector(`.pc[data-uid="${attacker}"]`) as HTMLElement | null;
  if (el) { el.style.setProperty('--lx', `${dx}px`); el.style.setProperty('--ly', `${dy}px`); el.classList.add('lunge-move'); }
}

type Fx = { kind: 'attack'; attacker: number; target: number } | { kind: 'act'; card: number } | undefined;
function applyFx(b: BattleState, before: Map<number, Snap>, fx: Fx): void {
  if (fx?.kind === 'attack') lungeAttack(b.engine, before, fx.attacker, fx.target);
  else if (fx?.kind === 'act') flashCard(fx.card, 'acting');
  animateDiff(before, snapshot(b.engine));
}

// ── přechody ────────────────────────────────────────────────────────────────
function startRun(): void { run = createRun(randomSeed()); battle = null; screen = 'run'; render(); }
function toMenu(): void { screen = 'menu'; run = null; battle = null; render(); }
function enterBattle(): void {
  if (!run) return;
  startBattle(run);
  battle = { engine: new GameEngine(makeBattleConfig(run)), selection: null, botPending: false };
  renderedUids = new Set(); // nová bitva → karty se "dealnou"
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
  const enter = renderedUids.has(c.uid) ? '' : 'enter';
  const cls = ['pc', c.owner === 'A' ? 'pc--a' : 'pc--b', c.isQueen ? 'pc--queen' : '', `r-${rarityOf(c.defId)}`, enter, extra]
    .filter(Boolean).join(' ');
  const abil = c.abilities.length ? '<span class="dot">✦</span>' : '';
  const title = describeCard(c) || cardName(c.defId);
  const atkCls = c.attack > c.baseAttack ? 'atk buffed' : 'atk';
  const frame = frameFor(c.owner, c.isQueen);
  const bg = frame ? `style="background-image:url(${frame})"` : '';
  // jméno je v tooltipu, na desce ukazujeme jen art + staty (ať to není přeplácané)
  return `<div class="${cls}" data-uid="${c.uid}" ${bg} title="${escapeAttr(cardName(c.defId) + (title ? ' — ' + title : ''))}">
      ${c.isQueen ? '<span class="crown">♛</span>' : ''}
      ${abil ? '<span class="pc__abil">✦</span>' : ''}
      <div class="pc__art">${cardArt(c.defId)}</div>
      ${badges(c)}
      <div class="pc__foot"><span class="${atkCls}">${c.attack}</span><span class="hp">${Math.max(0, c.hp)}/${c.maxHp}</span></div>
    </div>`;
}

// ── LANG BAR (nahoře na všech obrazovkách) ──────────────────────────────────
function langBar(withHome: boolean): string {
  const l = getLang();
  const home = withHome ? `<button class="ghost sm" data-action="home" title="Menu"><span class="ic ic-home"></span></button>` : '';
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
  const frame = frameFor(HUMAN, false);
  const bg = frame ? `style="background-image:url(${frame})"` : '';
  const chips = b.engine.handOf(HUMAN).map((c) => {
    const sel = b.selection?.type === 'hand' && b.selection.uid === c.uid ? 'is-sel' : '';
    const aff = c.cost <= p.energy ? '' : 'is-dim';
    const rng = c.range > 1 ? `<span class="hrng">🏹${c.range}</span>` : '';
    return `<div class="hslot ${sel} ${aff}" data-hand="${c.uid}" title="${escapeAttr(describeCard(c) || cardName(c.defId))}">
        <div class="pc pc--a hframe r-${rarityOf(c.defId)}" ${bg}>
          <span class="hcost">${c.cost}</span>${rng}
          <div class="pc__art">${cardArt(c.defId)}</div>
          <div class="pc__foot"><span class="atk">${c.attack}</span><span class="hp">${c.hp}/${c.maxHp}</span></div>
        </div>
        <div class="hcaption">${escapeHtml(cardName(c.defId))}</div>
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
          <span class="spr shopicon" style="background-image:url(${iconFor(def.id)})"></span>
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
  // po vykreslení si zapamatuj karty na desce (aby "enter" animace hrála jen u nových)
  if (battle) {
    const now = new Set<number>();
    for (const c of battle.engine.state.cards.values()) if (c.zone === 'board') now.add(c.uid);
    renderedUids = now;
  } else {
    renderedUids = new Set();
  }
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
    const src = pendingActive;
    pendingActive = null;
    b.selection = null;
    if (uid != null && b.engine.activeTargets(src).includes(uid)) withFx(b, () => b.engine.activate(src, uid), { kind: 'act', card: src });
    else render();
    return;
  }
  if (b.selection?.type === 'hand') {
    const cardUid = b.selection.uid;
    const canPlay = legalCells(b).has(key(pos)); // POZOR: zjistit PŘED vynulováním výběru
    b.selection = null;
    if (canPlay) withFx(b, () => b.engine.play(cardUid, pos));
    else render();
    return;
  }
  if (b.selection?.type === 'board') {
    const attacker = b.selection.uid;
    if (uid != null && attackTargets(b).has(uid)) {
      const tgt = uid;
      b.selection = null;
      withFx(b, () => b.engine.attack(attacker, tgt), { kind: 'attack', attacker, target: tgt });
      return;
    }
    trySelectBoard(b, uid);
    render();
    return;
  }
  trySelectBoard(b, uid);
  render();
}
/** Provede akci hráče, překreslí a přehraje efekty (plovoucí čísla, záblesky, výpad). */
function withFx(b: BattleState, action: () => void, fx?: Fx): void {
  const before = snapshot(b.engine);
  action();
  render();
  applyFx(b, before, fx);
}

function endTurn(b: BattleState): void {
  if (b.engine.active !== HUMAN || b.engine.winner) return;
  b.selection = null;
  pendingActive = null;
  b.engine.endTurn(); // předá tah botovi (jeho úsvit proběhne hned)
  runBotTurn(b);
}

function runBotTurn(b: BattleState): void {
  b.botPending = true;
  render();
  window.setTimeout(() => botStep(b), 600);
}

/** Jeden krok bota: jedna akce, překreslení, efekty, pak naplánuj další. */
function botStep(b: BattleState): void {
  if (b !== battle) return; // hra se mezitím změnila
  const eng = b.engine;
  if (eng.winner) { b.botPending = false; render(); return; }
  const before = snapshot(eng);
  const action = stepBot(eng);
  if (action === null) {
    eng.endTurn(); // konec tahu bota → zpět na hráče
    b.botPending = false;
    render();
    return;
  }
  render();
  const fx: Fx = action.kind === 'attack' ? { kind: 'attack', attacker: action.attacker, target: action.target }
    : action.kind === 'activate' ? { kind: 'act', card: action.card } : undefined;
  applyFx(b, before, fx);
  if (eng.winner) { b.botPending = false; render(); return; }
  window.setTimeout(() => botStep(b), 650);
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
      else { const b = battle; b.selection = null; withFx(b, () => b.engine.activate(uid), { kind: 'act', card: uid }); }
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

// nejdřív nařež pixel-art rámečky, pak vykresli
initSprites().finally(render);
