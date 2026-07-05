import type { AbilityDef, CardDef, CardInstance } from '../engine/index.ts';

// Převod schopnosti na krátký český text (do tooltipu / detailu karty).

const TRIGGER_LABEL: Record<string, string> = {
  deploy: 'Vylož',
  death: 'Skon',
  wound: 'Zranění',
  onHeal: 'Vyléčení',
  onShield: 'Zaštítění',
  attack: 'Útok',
  kill: 'Zabití',
  upkeepStart: 'Úsvit',
  upkeepEnd: 'Soumrak',
  countdown: 'Odpočet',
};

const DIR_LABEL: Record<string, string> = {
  forward: 'vpřed',
  back: 'vzad',
  left: 'vlevo',
  right: 'vpravo',
  forwardLeft: 'šikmo vpřed-vlevo',
  forwardRight: 'šikmo vpřed-vpravo',
  backLeft: 'šikmo vzad-vlevo',
  backRight: 'šikmo vzad-vpravo',
};

function n(params: Record<string, unknown> | undefined, ...keys: string[]): number {
  if (!params) return 1;
  for (const k of keys) if (params[k] != null) return Number(params[k]);
  return 1;
}

function effectText(a: AbilityDef): string {
  const p = a.params ?? {};
  switch (a.effect) {
    case 'damage': return `dá ${n(p, 'value', 'amount', 'damage')} dmg`;
    case 'heal': return `léčí ${n(p, 'value', 'amount')}`;
    case 'shield': return `štít ${n(p, 'value', 'amount')}`;
    case 'buff': return `+${Number(p.atk ?? 0)}/${Number(p.hp ?? 0)}`;
    case 'destroy': return 'zničí';
    case 'terrain': return `rozmístí ${String(p.terrain ?? 'mina')}`;
    case 'discardRandom': return 'zahodí nepříteli kartu z ruky';
    case 'draw': return `dober ${n(p, 'value', 'count')}`;
    case 'summon': return 'přivolá jednotku';
    default: return a.effect;
  }
}

function targetText(a: AbilityDef): string {
  const p = a.params ?? {};
  switch (a.target) {
    case 'self': return 'sobě';
    case 'none': return '';
    case 'neighbor': return `sousedovi ${DIR_LABEL[String(p.direction ?? 'forward')]}`;
    case 'direction': return `${DIR_LABEL[String(p.direction ?? 'forward')]}`;
    case 'around': return 'v okolí';
    case 'aroundVictim': return 'v okolí oběti';
    case 'lowestHpAlly': return 'nejslabšímu spojenci';
    case 'allEnemies': return 'všem nepřátelům';
    case 'allAllies': return 'všem spojencům';
    case 'enemyQueen': return 'nepřátelské Královně';
    default: return a.target;
  }
}

export function describeAbility(a: AbilityDef): string {
  const trig = TRIGGER_LABEL[a.trigger] ?? a.trigger;
  const count = a.trigger === 'countdown' ? ` ${n(a.params, 'count')}` : '';
  const parts = [effectText(a), targetText(a)].filter(Boolean).join(' ');
  return `${trig}${count}: ${parts}`;
}

function keywordLabel(k: string): string {
  return k === 'charge' ? 'Nájezd' : k === 'fragile' ? 'Křehkost' : k;
}

export function describeCard(c: CardInstance): string {
  const kw = c.keywords.map(keywordLabel);
  const lines = c.abilities.map(describeAbility);
  return [...kw, ...lines].join(' • ');
}

export function describeDef(def: CardDef): string {
  const kw = (def.keywords ?? []).map(keywordLabel);
  const lines = (def.abilities ?? []).map(describeAbility);
  return [...kw, ...lines].join(' • ');
}
