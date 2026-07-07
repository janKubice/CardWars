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
  return 'en'; // výchozí jazyk = angličtina
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
  'shop.nextFoe': 'Soupeř',
  // battle
  'battle.you': 'TY',
  'battle.bot': 'BOT',
  'battle.turn': 'Tah',
  'battle.endTurn': 'Ukončit tah',
  'battle.hint': 'Vyber kartu z ruky → klikni na zvýrazněné políčko. Klikni na svou jednotku → zaútoč na cíl.',
  'battle.chooseTarget': 'Vyber cíl aktivace',
  'battle.attackHint': '⚔ klikni na nepřítele v dosahu',
  'battle.cancel': 'Zrušit',
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
  'kw.charge': 'Nájezd', 'kw.fragile': 'Křehkost', 'kw.thorns': 'Trny', 'kw.bloodthirst': 'Krvežíznivost',
  // tag (kmeny/synergie)
  'tag.Explosive': 'Výbušný', 'tag.Beast': 'Zvíře', 'tag.Undead': 'Nemrtvý',
  // tooltip
  'tip.stats': 'cena · útok · život', 'tip.queenTerm': 'Královna', 'tip.vanilla': 'Obyčejná jednotka bez schopností.',
  'tip.hoverHelp': 'Najeď myší na kartu pro nápovědu.',
  // nápovědy (glosář v tooltipu)
  'help.queen': 'Královna je cíl hry. Když padne ta tvoje, prohráváš — sejmi soupeřovu, abys vyhrál.',
  'help.charge': 'Může útočit hned v kole, kdy ji vyložíš (bez únavy z vyložení).',
  'help.fragile': 'Dostává o 1 poškození navíc z každého zásahu.',
  'help.thorns': 'Kdo na ni zaútočí zblízka, dostane 2 poškození zpět.',
  'help.bloodthirst': 'Pokaždé když padne nepřátelská jednotka, vyléčí se o 2.',
  'help.deploy': 'Spustí se ve chvíli, kdy kartu vyložíš na desku.',
  'help.allyDeploy': 'Spustí se pokaždé, když vyložíš jinou svou kartu (řetězí se s energií).',
  'help.death': 'Spustí se, když tato karta padne (Skon).',
  'help.wound': 'Spustí se, když tato karta dostane poškození.',
  'help.onHeal': 'Spustí se, když je tato karta vyléčena.',
  'help.onShield': 'Spustí se, když tato karta dostane štít.',
  'help.attack': 'Spustí se, když tato karta zaútočí.',
  'help.kill': 'Spustí se, když tato karta zabije nepřítele.',
  'help.upkeepStart': 'Spustí se na začátku každého tvého tahu (Úsvit).',
  'help.upkeepEnd': 'Spustí se na konci tvého tahu.',
  'help.countdown': 'Po pár tazích odpočet vyprší, schopnost se spustí a karta pak zmizí.',
  'help.aura': 'Trvalý efekt, který působí, dokud je karta na desce.',
  'help.active': 'Ruční schopnost — jednou za tah ji za energii spustíš kliknutím.',
  'help.Explosive': 'Výbušný: když padne, vybuchne a zraní okolí — může zapálit další výbušné karty (řetězení).',
  'help.Beast': 'Zvíře: velitelé zvířat (Psovod, Pán zvířat…) posilují všechna tvá Zvířata.',
  'help.Undead': 'Nemrtvý: nekromanti přivolávají Kostlivce a těží ze smrti jednotek.',
  // sides
  'side.A': 'Ty', 'side.B': 'Bot',
  // terrain
  'terrain.mine': 'minu',
  // triggers
  'trig.deploy': 'Vylož', 'trig.allyDeploy': 'Když vyložíš kartu', 'trig.death': 'Skon', 'trig.wound': 'Zranění', 'trig.onHeal': 'Vyléčení',
  'trig.onShield': 'Zaštítění', 'trig.attack': 'Útok', 'trig.kill': 'Zabití', 'trig.upkeepStart': 'Úsvit',
  'trig.upkeepEnd': 'Soumrak', 'trig.countdown': 'Odpočet', 'trig.aura': 'Aura', 'trig.active': 'Aktivace',
  // directions
  'dir.forward': 'vpřed', 'dir.back': 'vzad', 'dir.left': 'vlevo', 'dir.right': 'vpravo',
  'dir.forwardLeft': 'šikmo vpřed-vlevo', 'dir.forwardRight': 'šikmo vpřed-vpravo',
  'dir.backLeft': 'šikmo vzad-vlevo', 'dir.backRight': 'šikmo vzad-vpravo',
  // effect templates
  'ab.damage': 'dá {n} dmg', 'ab.heal': 'léčí {n}', 'ab.shield': 'štít {n}', 'ab.buff': '+{atk}/{hp}',
  'ab.destroy': 'zničí', 'ab.terrain': 'rozmístí {t}', 'ab.discardRandom': 'zahodí nepříteli kartu z ruky',
  'ab.draw': 'dober {n}', 'ab.summon': 'přivolá jednotku',
  'ab.push': 'odstrčí', 'ab.pull': 'přitáhne', 'ab.bounce': 'vrátí do ruky', 'ab.silence': 'umlčí',
  'ab.energy': '+{n} energie tento tah',
  // target templates
  'tg.self': 'sobě', 'tg.neighbor': 'sousedovi {dir}', 'tg.direction': '{dir}', 'tg.around': 'v okolí',
  'tg.aroundVictim': 'v okolí oběti', 'tg.lowestHpAlly': 'nejslabšímu spojenci', 'tg.allEnemies': 'všem nepřátelům',
  'tg.allAllies': 'všem spojencům', 'tg.enemyQueen': 'nepřátelské Královně', 'tg.randomEnemy': 'náhodnému nepříteli',
  'tg.lowestHpEnemy': 'nejslabšímu nepříteli', 'tg.alliesTag': 'tvým {tag}',
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
  'log.activate': '✨ {card} použil schopnost',
  'log.bounce': '↩️ {card} vrácen do ruky', 'log.silence': '🔇 {card} umlčen',
  'log.reshuffle': '🔀 {owner} zamíchal odhoz zpět do balíčku',
  'log.energy': '⚡ {owner} získal {n} energie',
  // card names
  'card.queen': 'Královna', 'card.recruit': 'Rekrut', 'card.spearman': 'Kopiník', 'card.archer': 'Lučištník',
  'card.medic': 'Zdravotník', 'card.wall': 'Křeček-zeď', 'card.minelayer': 'Minér', 'card.reaper': 'Kosec',
  'card.protector': 'Ochránce', 'card.berserk': 'Berserk', 'card.courier': 'Kurýr', 'card.vengetree': 'Mstivý strom',
  'card.runeshield': 'Runový štít', 'card.avenger': 'Mstitel', 'card.timebomb': 'Časovaná bomba',
  'card.cannon': 'Dělo', 'card.pyro': 'Pyroman', 'card.commander': 'Velitel',
  'card.zealot': 'Fanatik', 'card.healer': 'Léčitel', 'card.zapper': 'Zaklínač', 'card.banner': 'Válečná standarta',
  'card.slinger': 'Prakovník', 'card.squire': 'Panoš', 'card.brute': 'Rváč', 'card.scout': 'Zvěd',
  'card.shover': 'Postrkovač', 'card.sapper': 'Zákopník', 'card.cleric': 'Klerik', 'card.hexer': 'Kletbář',
  'card.sniper': 'Odstřelovač', 'card.bouncer': 'Vyhazovač', 'card.silencer': 'Umlčovač', 'card.summoner': 'Přivolávač',
  'card.warlord': 'Válečník', 'card.plague': 'Morová vrána', 'card.archmage': 'Arcimág', 'card.titan': 'Titán',
  'card.swarmling': 'Roj', 'card.queen_swarm': 'Rojová královna', 'card.queen_thorn': 'Trnová královna',
  'card.queen_blood': 'Krvavá královna', 'card.queen_fire': 'Ohnivá královna', 'card.queen_war': 'Velící královna',
  'card.queen_titan': 'Titánská královna',
  'card.ritualist': 'Ritualista', 'card.collector': 'Sběratel', 'card.catalyst': 'Katalyzátor',
  'card.pyromaniac': 'Pyromaniak', 'card.grandmaster': 'Velmistr',
  'card.conductor': 'Dirigent', 'card.sparkmage': 'Jiskřič', 'card.grenadier': 'Granátník',
  // rozšíření poolu (Beast/Undead kmeny + doplnění napříč raritami)
  'card.wolf': 'Vlk', 'card.skeleton': 'Kostlivec',
  'card.wardog': 'Válečný pes', 'card.stoneguard': 'Kamenná stráž', 'card.javelineer': 'Oštěpař',
  'card.torchbearer': 'Pochodňonoš', 'card.initiate': 'Nováček', 'card.bruiser': 'Hromotluk',
  'card.hound': 'Ohař', 'card.crossbowman': 'Kušištník', 'card.footsoldier': 'Pěšák',
  'card.acolyte': 'Novic', 'card.skirmisher': 'Harcovník', 'card.ratling': 'Krysák',
  'card.houndmaster': 'Psovod', 'card.packleader': 'Vůdce smečky', 'card.necromancer': 'Nekromant',
  'card.boneguard': 'Kostěná hlídka', 'card.pyrokin': 'Ohnivec', 'card.warpriest': 'Válečný kněz',
  'card.duelist': 'Duelant', 'card.harpooner': 'Harpunář', 'card.warhorn': 'Nosič rohu',
  'card.sister': 'Sestra řádu', 'card.impaler': 'Nabodávač', 'card.bombthrower': 'Vrhač bomb',
  'card.recruiter': 'Verbíř', 'card.spearguard': 'Kopiníkova stráž', 'card.windrunner': 'Větroběžec',
  'card.lifebinder': 'Poutník života', 'card.tinkerer': 'Kutil',
  'card.beastlord': 'Pán zvířat', 'card.lich': 'Lich', 'card.bombard': 'Bombarda', 'card.executioner': 'Kat',
  'card.battlemage': 'Bojový mág', 'card.templar': 'Templář', 'card.warchief': 'Náčelník',
  'card.plaguebearer': 'Morem stižený', 'card.windlord': 'Pán vichrů', 'card.enchanter': 'Zaříkávač',
  'card.ballista': 'Balista', 'card.archivist': 'Archivář', 'card.gravedigger': 'Hrobník', 'card.firelord': 'Pán ohně',
  'card.hydra': 'Hydra', 'card.necrolord': 'Nekrolord', 'card.inferno': 'Inferno', 'card.archon': 'Archon',
  'card.stormcaller': 'Bouřný mág', 'card.beastking': 'Zvířecí král', 'card.warlock': 'Černokněžník',
  'card.guardian': 'Strážce', 'card.phoenix': 'Fénix',
  'card.dragon': 'Drak', 'card.deathknight': 'Rytíř smrti', 'card.worldtree': 'Strom světa',
  'card.reaperlord': 'Pán žní', 'card.colossus': 'Železný kolos', 'card.oracle': 'Věštec',
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
  'shop.nextFoe': 'Foe',
  'battle.you': 'YOU',
  'battle.bot': 'BOT',
  'battle.turn': 'Turn',
  'battle.endTurn': 'End turn',
  'battle.hint': 'Pick a card from hand → click a highlighted tile. Click your unit → attack a target.',
  'battle.chooseTarget': 'Choose a target',
  'battle.attackHint': '⚔ click an enemy in range',
  'battle.cancel': 'Cancel',
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
  'kw.charge': 'Charge', 'kw.fragile': 'Fragile', 'kw.thorns': 'Thorns', 'kw.bloodthirst': 'Bloodthirst',
  'tag.Explosive': 'Explosive', 'tag.Beast': 'Beast', 'tag.Undead': 'Undead',
  'tip.stats': 'cost · attack · health', 'tip.queenTerm': 'Queen', 'tip.vanilla': 'A plain unit with no abilities.',
  'tip.hoverHelp': 'Hover a card for help.',
  'help.queen': 'The Queen is the win condition. If yours falls you lose — destroy the enemy Queen to win.',
  'help.charge': 'Can attack the turn it is played (no summoning sickness).',
  'help.fragile': 'Takes 1 extra damage from every hit.',
  'help.thorns': 'Attackers in melee take 2 damage back.',
  'help.bloodthirst': 'Heals 2 whenever an enemy unit dies.',
  'help.deploy': 'Triggers the moment the card is played onto the board.',
  'help.allyDeploy': 'Triggers each time you play another of your cards (chains with energy).',
  'help.death': 'Triggers when this card is destroyed.',
  'help.wound': 'Triggers when this card takes damage.',
  'help.onHeal': 'Triggers when this card is healed.',
  'help.onShield': 'Triggers when this card gains a shield.',
  'help.attack': 'Triggers when this card attacks.',
  'help.kill': 'Triggers when this card kills an enemy.',
  'help.upkeepStart': 'Triggers at the start of each of your turns (Upkeep).',
  'help.upkeepEnd': 'Triggers at the end of your turn.',
  'help.countdown': 'After a few turns the countdown fires the ability, then the card is gone.',
  'help.aura': 'A constant effect that lasts while the card is on the board.',
  'help.active': 'A manual ability — activate once per turn for energy by clicking.',
  'help.Explosive': 'Explosive: on death it blasts neighbors — which can set off other Explosives (chain reaction).',
  'help.Beast': 'Beast: beast leaders (Houndmaster, Beastlord…) buff all your Beasts.',
  'help.Undead': 'Undead: necromancers summon Skeletons and profit from units dying.',
  'side.A': 'You', 'side.B': 'Bot',
  'terrain.mine': 'a mine',
  'trig.deploy': 'Deploy', 'trig.allyDeploy': 'When you play a card', 'trig.death': 'Death', 'trig.wound': 'Wound', 'trig.onHeal': 'On-Heal',
  'trig.onShield': 'On-Shield', 'trig.attack': 'Attack', 'trig.kill': 'Kill', 'trig.upkeepStart': 'Upkeep',
  'trig.upkeepEnd': 'End', 'trig.countdown': 'Countdown', 'trig.aura': 'Aura', 'trig.active': 'Active',
  'dir.forward': 'forward', 'dir.back': 'back', 'dir.left': 'left', 'dir.right': 'right',
  'dir.forwardLeft': 'diagonally fwd-left', 'dir.forwardRight': 'diagonally fwd-right',
  'dir.backLeft': 'diagonally back-left', 'dir.backRight': 'diagonally back-right',
  'ab.damage': 'deals {n} dmg', 'ab.heal': 'heals {n}', 'ab.shield': 'shield {n}', 'ab.buff': '+{atk}/{hp}',
  'ab.destroy': 'destroys', 'ab.terrain': 'places {t}', 'ab.discardRandom': 'discards a random enemy card',
  'ab.draw': 'draw {n}', 'ab.summon': 'summons a unit',
  'ab.push': 'pushes', 'ab.pull': 'pulls', 'ab.bounce': 'returns to hand', 'ab.silence': 'silences',
  'ab.energy': '+{n} energy this turn',
  'tg.self': 'self', 'tg.neighbor': 'neighbor {dir}', 'tg.direction': '{dir}', 'tg.around': 'around',
  'tg.aroundVictim': 'around the victim', 'tg.lowestHpAlly': 'weakest ally', 'tg.allEnemies': 'all enemies',
  'tg.allAllies': 'all allies', 'tg.enemyQueen': 'enemy Queen', 'tg.randomEnemy': 'a random enemy',
  'tg.lowestHpEnemy': 'the weakest enemy', 'tg.alliesTag': 'your {tag}',
  'log.shieldAbsorb': '🛡️ {card} absorbed {n} with shield', 'log.damage': '💥 {card} took {n}',
  'log.heal': '❤️ {card} healed {n}', 'log.destroy': '☠️ {card} destroyed',
  'log.queenFell': "👑 {owner}'s Queen fell — {winner} wins!", 'log.summon': '✨ {card} summoned',
  'log.discard': '🗑️ {owner} lost a hand card ({card})', 'log.swap': '🔄 {src} ↔ {tgt}',
  'log.burn': '🔥 hand full, {card} burned', 'log.terrain': '🧨 {card} scattered {t} nearby',
  'log.play': '▶️ {owner} played {card}', 'log.attack': '⚔️ {src} attacks {tgt}',
  'log.fatigue': "😵 fatigue: {owner}'s Queen takes {n}", 'log.turn': '— turn {n}: {owner} to move ({e}/{m}⚡) —',
  'log.guard': '⚠️ event queue guard tripped',
  'log.unknownTarget': '⚠️ unknown target {name}', 'log.unknownEffect': '⚠️ unknown effect {name}',
  'log.activate': '✨ {card} used its ability',
  'log.bounce': '↩️ {card} returned to hand', 'log.silence': '🔇 {card} silenced',
  'log.reshuffle': '🔀 {owner} shuffled discard back into deck',
  'log.energy': '⚡ {owner} gained {n} energy',
  'card.queen': 'Queen', 'card.recruit': 'Recruit', 'card.spearman': 'Spearman', 'card.archer': 'Archer',
  'card.medic': 'Medic', 'card.wall': 'Wall Hamster', 'card.minelayer': 'Minelayer', 'card.reaper': 'Reaper',
  'card.protector': 'Protector', 'card.berserk': 'Berserker', 'card.courier': 'Courier', 'card.vengetree': 'Vengeful Tree',
  'card.runeshield': 'Runeshield', 'card.avenger': 'Avenger', 'card.timebomb': 'Time Bomb',
  'card.cannon': 'Cannon', 'card.pyro': 'Pyromancer', 'card.commander': 'Commander',
  'card.zealot': 'Zealot', 'card.healer': 'Healer', 'card.zapper': 'Zapper', 'card.banner': 'War Banner',
  'card.slinger': 'Slinger', 'card.squire': 'Squire', 'card.brute': 'Brute', 'card.scout': 'Scout',
  'card.shover': 'Shover', 'card.sapper': 'Sapper', 'card.cleric': 'Cleric', 'card.hexer': 'Hexer',
  'card.sniper': 'Sniper', 'card.bouncer': 'Bouncer', 'card.silencer': 'Silencer', 'card.summoner': 'Summoner',
  'card.warlord': 'Warlord', 'card.plague': 'Plague Crow', 'card.archmage': 'Archmage', 'card.titan': 'Titan',
  'card.swarmling': 'Swarmling', 'card.queen_swarm': 'Swarm Queen', 'card.queen_thorn': 'Thorn Queen',
  'card.queen_blood': 'Blood Queen', 'card.queen_fire': 'Fire Queen', 'card.queen_war': 'War Queen',
  'card.queen_titan': 'Titan Queen',
  'card.ritualist': 'Ritualist', 'card.collector': 'Collector', 'card.catalyst': 'Catalyst',
  'card.pyromaniac': 'Pyromaniac', 'card.grandmaster': 'Grandmaster',
  'card.conductor': 'Conductor', 'card.sparkmage': 'Sparkmage', 'card.grenadier': 'Grenadier',
  'card.wolf': 'Wolf', 'card.skeleton': 'Skeleton',
  'card.wardog': 'War Dog', 'card.stoneguard': 'Stone Guard', 'card.javelineer': 'Javelineer',
  'card.torchbearer': 'Torchbearer', 'card.initiate': 'Initiate', 'card.bruiser': 'Bruiser',
  'card.hound': 'Hound', 'card.crossbowman': 'Crossbowman', 'card.footsoldier': 'Footsoldier',
  'card.acolyte': 'Acolyte', 'card.skirmisher': 'Skirmisher', 'card.ratling': 'Ratling',
  'card.houndmaster': 'Houndmaster', 'card.packleader': 'Pack Leader', 'card.necromancer': 'Necromancer',
  'card.boneguard': 'Bone Guard', 'card.pyrokin': 'Pyrokin', 'card.warpriest': 'War Priest',
  'card.duelist': 'Duelist', 'card.harpooner': 'Harpooner', 'card.warhorn': 'Hornblower',
  'card.sister': 'Sister of the Order', 'card.impaler': 'Impaler', 'card.bombthrower': 'Bomb Thrower',
  'card.recruiter': 'Recruiter', 'card.spearguard': 'Spear Guard', 'card.windrunner': 'Windrunner',
  'card.lifebinder': 'Lifebinder', 'card.tinkerer': 'Tinkerer',
  'card.beastlord': 'Beastlord', 'card.lich': 'Lich', 'card.bombard': 'Bombard', 'card.executioner': 'Executioner',
  'card.battlemage': 'Battlemage', 'card.templar': 'Templar', 'card.warchief': 'Warchief',
  'card.plaguebearer': 'Plaguebearer', 'card.windlord': 'Windlord', 'card.enchanter': 'Enchanter',
  'card.ballista': 'Ballista', 'card.archivist': 'Archivist', 'card.gravedigger': 'Gravedigger', 'card.firelord': 'Firelord',
  'card.hydra': 'Hydra', 'card.necrolord': 'Necrolord', 'card.inferno': 'Inferno', 'card.archon': 'Archon',
  'card.stormcaller': 'Stormcaller', 'card.beastking': 'Beast King', 'card.warlock': 'Warlock',
  'card.guardian': 'Guardian', 'card.phoenix': 'Phoenix',
  'card.dragon': 'Dragon', 'card.deathknight': 'Death Knight', 'card.worldtree': 'World Tree',
  'card.reaperlord': 'Reaper Lord', 'card.colossus': 'Iron Colossus', 'card.oracle': 'Oracle',
};

const STRINGS: Record<Lang, Dict> = { cs, en };
