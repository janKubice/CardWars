// Lokalizace (CS/EN). Jeden slovník na jazyk + t(key, params).
// Výběr jazyka se ukládá do localStorage. Vše hráči viditelné jde přes t().

import type { LogEntry } from '../engine/types.ts';

export type Lang = 'cs' | 'en';

const STORE_KEY = 'cardwars.lang';
let current: Lang = load();

function load(): Lang {
  try {
    const v = localStorage.getItem(STORE_KEY);
    if (v === 'cs' || v === 'en') return v;
  } catch { /* localStorage nemusí být dostupný */ }
  return 'cs';
}

export function getLang(): Lang {
  return current;
}
export function setLang(lang: Lang): void {
  current = lang;
  try { localStorage.setItem(STORE_KEY, lang); } catch { /* ignore */ }
}

export function t(key: string, params?: Record<string, string | number>): string {
  const table = STRINGS[current];
  let s = table[key] ?? STRINGS.en[key] ?? key;
  if (params) {
    for (const k of Object.keys(params)) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k]));
  }
  return s;
}

/** Lokalizovaný název karty podle jejího id. */
export function cardName(defId: string): string {
  return t('card.' + defId);
}

/** Sestaví lokalizovaný text logu ze strukturovaného záznamu. */
export function formatLog(entry: LogEntry): string {
  const p: Record<string, string | number> = { ...(entry.params ?? {}) };
  for (const k of ['card', 'src', 'tgt']) if (p[k] != null) p[k] = cardName(String(p[k]));
  for (const k of ['owner', 'winner']) if (p[k] != null) p[k] = t('side.' + p[k]);
  if (p.t != null) p.t = t('terrain.' + p.t);
  return t('log.' + entry.code, p);
}

type Dict = Record<string, string>;

const cs: Dict = {
  // chrome / menu
  'app.tagline': 'Roguelike deckbuilder na mřížce',
  'menu.newRun': 'Nový run',
  'menu.howto': 'Rozšiřuj se z Královny (pokládej jen vedle svých karet), skládej balíček v obchodě a sejmi Královnu soupeře dřív, než on tu tvoji.',
  'menu.subtitle': 'Postav si balíček. Sejmi Královnu.',
  // shop
  'shop.title': 'Obchod',
  'shop.buy': 'Koupit',
  'shop.bought': 'koupeno',
  'shop.reroll': 'Přehodit',
  'shop.toBattle': 'Do boje',
  'shop.deck': 'Tvůj balíček',
  'shop.cards': 'karet',
  'shop.noAbility': 'bez schopnosti',
  'shop.wins': 'výher',
  'shop.remove': 'Odebrat',
  'shop.upgrade': 'Vylepšit (+1/+1)',
  // battle
  'battle.you': 'TY',
  'battle.bot': 'BOT',
  'battle.turn': 'Tah',
  'battle.endTurn': 'Ukončit tah',
  'battle.hint': 'Vyber kartu z ruky → klikni na zvýrazněné políčko. Klikni na svou jednotku → zaútoč na cíl.',
  'battle.thinking': 'Bot přemýšlí…',
  'battle.winTitle': 'Souboj vyhrán!',
  'battle.loseTitle': 'Prohra',
  'battle.reward': 'Získáváš 🪙 {n} zlata.',
  'battle.lastAnte': 'Poslední ante — dohráno!',
  'battle.queenFell': 'Tvoje Královna padla. Konec runu.',
  'battle.toShop': 'Do obchodu',
  'battle.finishRun': 'Dokončit run',
  'battle.endRun': 'Konec runu',
  'battle.log': 'Záznam boje',
  // end
  'end.wonTitle': 'Run dokončen!',
  'end.lostTitle': 'Konec runu',
  'end.summary': 'Vyhraných soubojů: {wins} / {max}',
  'end.newRun': 'Nový run',
  // rarities
  'rar.common': 'běžná', 'rar.uncommon': 'neobvyklá', 'rar.rare': 'vzácná', 'rar.epic': 'epická', 'rar.legendary': 'legendární',
  // keywords
  'kw.charge': 'Nájezd', 'kw.fragile': 'Křehkost',
  // sides
  'side.A': 'Ty', 'side.B': 'Bot',
  // terrain
  'terrain.mine': 'minu',
  // triggers
  'trig.deploy': 'Vylož', 'trig.death': 'Skon', 'trig.wound': 'Zranění', 'trig.onHeal': 'Vyléčení',
  'trig.onShield': 'Zaštítění', 'trig.attack': 'Útok', 'trig.kill': 'Zabití', 'trig.upkeepStart': 'Úsvit',
  'trig.upkeepEnd': 'Soumrak', 'trig.countdown': 'Odpočet',
  // directions
  'dir.forward': 'vpřed', 'dir.back': 'vzad', 'dir.left': 'vlevo', 'dir.right': 'vpravo',
  'dir.forwardLeft': 'šikmo vpřed-vlevo', 'dir.forwardRight': 'šikmo vpřed-vpravo',
  'dir.backLeft': 'šikmo vzad-vlevo', 'dir.backRight': 'šikmo vzad-vpravo',
  // effect templates
  'ab.damage': 'dá {n} dmg', 'ab.heal': 'léčí {n}', 'ab.shield': 'štít {n}', 'ab.buff': '+{atk}/{hp}',
  'ab.destroy': 'zničí', 'ab.terrain': 'rozmístí {t}', 'ab.discardRandom': 'zahodí nepříteli kartu z ruky',
  'ab.draw': 'dober {n}', 'ab.summon': 'přivolá jednotku',
  // target templates
  'tg.self': 'sobě', 'tg.neighbor': 'sousedovi {dir}', 'tg.direction': '{dir}', 'tg.around': 'v okolí',
  'tg.aroundVictim': 'v okolí oběti', 'tg.lowestHpAlly': 'nejslabšímu spojenci', 'tg.allEnemies': 'všem nepřátelům',
  'tg.allAllies': 'všem spojencům', 'tg.enemyQueen': 'nepřátelské Královně',
  // log
  'log.shieldAbsorb': '🛡️ {card} pohltil štítem {n}', 'log.damage': '💥 {card} dostal {n}',
  'log.heal': '❤️ {card} vyléčen o {n}', 'log.destroy': '☠️ {card} zničen',
  'log.queenFell': '👑 Královna hráče {owner} padla — vítězí {winner}!', 'log.summon': '✨ přivolán {card}',
  'log.discard': '🗑️ {owner} přišel o kartu z ruky ({card})', 'log.swap': '🔄 {src} ↔ {tgt}',
  'log.burn': '🔥 ruka plná, {card} spálen', 'log.terrain': '🧨 {card} rozmístil {t} do okolí',
  'log.play': '▶️ {owner} vyložil {card}', 'log.attack': '⚔️ {src} útočí na {tgt}',
  'log.fatigue': '😵 únava: Královna {owner} dostává {n}', 'log.turn': '— tah {n}: na tahu {owner} ({e}/{m}⚡) —',
  'log.guard': '⚠️ pojistka fronty událostí',
  'log.unknownTarget': '⚠️ neznámý cíl {name}', 'log.unknownEffect': '⚠️ neznámý efekt {name}',
  // card names
  'card.queen': 'Královna', 'card.recruit': 'Rekrut', 'card.spearman': 'Kopiník', 'card.archer': 'Lučištník',
  'card.medic': 'Zdravotník', 'card.wall': 'Křeček-zeď', 'card.minelayer': 'Minér', 'card.reaper': 'Kosec',
  'card.protector': 'Ochránce', 'card.berserk': 'Berserk', 'card.courier': 'Kurýr', 'card.vengetree': 'Mstivý strom',
  'card.runeshield': 'Runový štít', 'card.avenger': 'Mstitel', 'card.timebomb': 'Časovaná bomba',
  'card.cannon': 'Dělo', 'card.pyro': 'Pyroman', 'card.commander': 'Velitel',
};

const en: Dict = {
  'app.tagline': 'A grid roguelike deckbuilder',
  'menu.newRun': 'New Run',
  'menu.howto': 'Expand from your Queen (place only next to your own cards), build a deck in the shop, and take down the enemy Queen before they take yours.',
  'menu.subtitle': 'Build a deck. Slay the Queen.',
  'shop.title': 'Shop',
  'shop.buy': 'Buy',
  'shop.bought': 'bought',
  'shop.reroll': 'Reroll',
  'shop.toBattle': 'To battle',
  'shop.deck': 'Your deck',
  'shop.cards': 'cards',
  'shop.noAbility': 'no ability',
  'shop.wins': 'wins',
  'shop.remove': 'Remove',
  'shop.upgrade': 'Upgrade (+1/+1)',
  'battle.you': 'YOU',
  'battle.bot': 'BOT',
  'battle.turn': 'Turn',
  'battle.endTurn': 'End turn',
  'battle.hint': 'Pick a card from hand → click a highlighted tile. Click your unit → attack a target.',
  'battle.thinking': 'Bot is thinking…',
  'battle.winTitle': 'Battle won!',
  'battle.loseTitle': 'Defeat',
  'battle.reward': 'You gain 🪙 {n} gold.',
  'battle.lastAnte': 'Final ante — cleared!',
  'battle.queenFell': 'Your Queen has fallen. Run over.',
  'battle.toShop': 'To shop',
  'battle.finishRun': 'Finish run',
  'battle.endRun': 'End run',
  'battle.log': 'Battle log',
  'end.wonTitle': 'Run complete!',
  'end.lostTitle': 'Run over',
  'end.summary': 'Battles won: {wins} / {max}',
  'end.newRun': 'New run',
  'rar.common': 'common', 'rar.uncommon': 'uncommon', 'rar.rare': 'rare', 'rar.epic': 'epic', 'rar.legendary': 'legendary',
  'kw.charge': 'Charge', 'kw.fragile': 'Fragile',
  'side.A': 'You', 'side.B': 'Bot',
  'terrain.mine': 'a mine',
  'trig.deploy': 'Deploy', 'trig.death': 'Death', 'trig.wound': 'Wound', 'trig.onHeal': 'On-Heal',
  'trig.onShield': 'On-Shield', 'trig.attack': 'Attack', 'trig.kill': 'Kill', 'trig.upkeepStart': 'Upkeep',
  'trig.upkeepEnd': 'End', 'trig.countdown': 'Countdown',
  'dir.forward': 'forward', 'dir.back': 'back', 'dir.left': 'left', 'dir.right': 'right',
  'dir.forwardLeft': 'diagonally fwd-left', 'dir.forwardRight': 'diagonally fwd-right',
  'dir.backLeft': 'diagonally back-left', 'dir.backRight': 'diagonally back-right',
  'ab.damage': 'deals {n} dmg', 'ab.heal': 'heals {n}', 'ab.shield': 'shield {n}', 'ab.buff': '+{atk}/{hp}',
  'ab.destroy': 'destroys', 'ab.terrain': 'places {t}', 'ab.discardRandom': 'discards a random enemy card',
  'ab.draw': 'draw {n}', 'ab.summon': 'summons a unit',
  'tg.self': 'self', 'tg.neighbor': 'neighbor {dir}', 'tg.direction': '{dir}', 'tg.around': 'around',
  'tg.aroundVictim': 'around the victim', 'tg.lowestHpAlly': 'weakest ally', 'tg.allEnemies': 'all enemies',
  'tg.allAllies': 'all allies', 'tg.enemyQueen': 'enemy Queen',
  'log.shieldAbsorb': '🛡️ {card} absorbed {n} with shield', 'log.damage': '💥 {card} took {n}',
  'log.heal': '❤️ {card} healed {n}', 'log.destroy': '☠️ {card} destroyed',
  'log.queenFell': "👑 {owner}'s Queen fell — {winner} wins!", 'log.summon': '✨ {card} summoned',
  'log.discard': '🗑️ {owner} lost a hand card ({card})', 'log.swap': '🔄 {src} ↔ {tgt}',
  'log.burn': '🔥 hand full, {card} burned', 'log.terrain': '🧨 {card} scattered {t} nearby',
  'log.play': '▶️ {owner} played {card}', 'log.attack': '⚔️ {src} attacks {tgt}',
  'log.fatigue': "😵 fatigue: {owner}'s Queen takes {n}", 'log.turn': '— turn {n}: {owner} to move ({e}/{m}⚡) —',
  'log.guard': '⚠️ event queue guard tripped',
  'log.unknownTarget': '⚠️ unknown target {name}', 'log.unknownEffect': '⚠️ unknown effect {name}',
  'card.queen': 'Queen', 'card.recruit': 'Recruit', 'card.spearman': 'Spearman', 'card.archer': 'Archer',
  'card.medic': 'Medic', 'card.wall': 'Wall Hamster', 'card.minelayer': 'Minelayer', 'card.reaper': 'Reaper',
  'card.protector': 'Protector', 'card.berserk': 'Berserker', 'card.courier': 'Courier', 'card.vengetree': 'Vengeful Tree',
  'card.runeshield': 'Runeshield', 'card.avenger': 'Avenger', 'card.timebomb': 'Time Bomb',
  'card.cannon': 'Cannon', 'card.pyro': 'Pyromancer', 'card.commander': 'Commander',
};

const STRINGS: Record<Lang, Dict> = { cs, en };
