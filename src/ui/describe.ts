import type { AbilityDef, CardDef, CardInstance } from '../engine/index.ts';
import { t } from '../i18n/index.ts';

// Lokalizovaný popis schopnosti/karty. Vše přes i18n (t()).

function n(params: Record<string, unknown> | undefined, ...keys: string[]): number {
  if (!params) return 1;
  for (const k of keys) if (params[k] != null) return Number(params[k]);
  return 1;
}

function dir(params: Record<string, unknown> | undefined): string {
  return t('dir.' + String(params?.direction ?? 'forward'));
}

function effectText(a: AbilityDef): string {
  const p = a.params ?? {};
  switch (a.effect) {
    case 'damage': return t('ab.damage', { n: n(p, 'value', 'amount', 'damage') });
    case 'heal': return t('ab.heal', { n: n(p, 'value', 'amount') });
    case 'shield': return t('ab.shield', { n: n(p, 'value', 'amount') });
    case 'buff': return t('ab.buff', { atk: Number(p.atk ?? 0), hp: Number(p.hp ?? 0) });
    case 'destroy': return t('ab.destroy');
    case 'terrain': return t('ab.terrain', { t: t('terrain.' + String(p.terrain ?? 'mine')) });
    case 'discardRandom': return t('ab.discardRandom');
    case 'draw': return t('ab.draw', { n: n(p, 'value', 'count') });
    case 'summon': return t('ab.summon');
    case 'push': return t('ab.push');
    case 'pull': return t('ab.pull');
    case 'bounce': return t('ab.bounce');
    case 'silence': return t('ab.silence');
    default: return a.effect;
  }
}

function targetText(a: AbilityDef): string {
  switch (a.target) {
    case 'self': return t('tg.self');
    case 'none': return '';
    case 'neighbor': return t('tg.neighbor', { dir: dir(a.params) });
    case 'direction': return t('tg.direction', { dir: dir(a.params) });
    case 'around': return t('tg.around');
    case 'aroundVictim': return t('tg.aroundVictim');
    case 'lowestHpAlly': return t('tg.lowestHpAlly');
    case 'allEnemies': return t('tg.allEnemies');
    case 'allAllies': return t('tg.allAllies');
    case 'enemyQueen': return t('tg.enemyQueen');
    case 'randomEnemy': return t('tg.randomEnemy');
    default: return a.target;
  }
}

export function describeAbility(a: AbilityDef): string {
  const trig = t('trig.' + a.trigger);
  const count = a.trigger === 'countdown' ? ' ' + n(a.params, 'count') : '';
  const parts = [effectText(a), targetText(a)].filter(Boolean).join(' ');
  return `${trig}${count}: ${parts}`;
}

function keywords(kw: string[]): string[] {
  return kw.map((k) => t('kw.' + k));
}

export function describeCard(c: CardInstance): string {
  return [...keywords(c.keywords), ...c.abilities.map(describeAbility)].join(' • ');
}

export function describeDef(def: CardDef): string {
  return [...keywords(def.keywords ?? []), ...(def.abilities ?? []).map(describeAbility)].join(' • ');
}
