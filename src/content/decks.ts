import type { PlayerId } from '../engine/types.ts';

// Pevné startovní balíčky pro MVP (bez obchodu). Ekonomika přijde ve Fázi 2.
// Karty se v balíčku smí opakovat (kopie).

const STARTER: string[] = [
  'recruit', 'recruit', 'recruit',
  'spearman', 'spearman',
  'archer', 'archer',
  'medic',
  'wall', 'wall',
  'minelayer',
  'reaper',
  'protector',
  'berserk', 'berserk',
  'courier',
  'vengetree',
  'runeshield',
  'avenger',
  'timebomb',
  'cannon',
  'pyro',
  'commander',
  'banner',
  'zealot',
  'healer',
  'zapper',
  'slinger', 'squire', 'brute', 'scout',
  'shover', 'sapper', 'cleric', 'hexer',
  'sniper', 'bouncer', 'silencer', 'summoner',
  'warlord', 'plague', 'archmage', 'titan',
  'ritualist', 'collector', 'catalyst', 'pyromaniac', 'grandmaster',
  'conductor', 'sparkmage', 'grenadier',
];

export const STARTER_DECKS: Record<PlayerId, string[]> = {
  A: [...STARTER],
  B: [...STARTER],
};
