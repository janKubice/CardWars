import framesUrl from '../../assets/Modular_Fantasy_Cards_Spritesheet.png';
import iconsUrl from '../../assets/pixelCardAssest_V01.png';
import homeUrl from '../../assets/01_TravelBookLite/Sprites/UI_TravelBook_IconHome01a.png';
import panelUrl from '../../assets/01_TravelBookLite/Sprites/UI_TravelBook_Popup01a.png';
import slotUrl from '../../assets/01_TravelBookLite/Sprites/UI_TravelBook_Slot01a.png';
import coverUrl from '../../assets/01_TravelBookLite/Sprites/UI_TravelBook_BookCover01a.png';
import coinUrl from '../../assets/01_TravelBookLite/Sprites/UI_TravelBook_IconCoin01a.png';
import energyUrl from '../../assets/01_TravelBookLite/Sprites/UI_TravelBook_IconEnergy01a.png';
import type { PlayerId } from '../engine/index.ts';

// Nařezání spritesheetů na jednotlivé PNG (data URI) za běhu přes canvas.
// Sprite jde pak roztáhnout responzivně a zůstane ostrý (image-rendering: pixelated).

const FW = 68;
const FH = 95;

// obloukové rámečky karet (Modular sheet) — [x,y]
const FRAME_SRC: Record<string, [number, number]> = {
  blue: [4, 4],
  red: [156, 4],
  gold: [308, 210],
};

// ikony (pixelCardAssest) — [x,y,w,h]
const ICON_SRC: Record<string, [number, number, number, number]> = {
  swordSteel: [544, 272, 16, 16],
  swordWood: [523, 271, 16, 16],
  spear: [506, 266, 12, 25],
  axe: [469, 308, 27, 21],
  hammer: [438, 306, 22, 19],
  bow: [604, 307, 28, 27],
  wandRed: [509, 310, 17, 17],
  wandGreen: [536, 314, 17, 17],
  heart: [429, 148, 13, 12],
  potionR: [463, 202, 15, 16],
  potionG: [496, 202, 15, 16],
  potionY: [529, 202, 15, 16],
  star: [399, 218, 20, 20],
  coin: [401, 184, 19, 18],
  shieldPurple: [568, 142, 26, 26],
  shieldBronze: [568, 172, 26, 26],
  shieldGreen: [568, 205, 26, 26],
  shieldBlue: [568, 237, 26, 26],
  shieldRed: [568, 266, 26, 26],
};

// mapování karty → ikona
const ART_MAP: Record<string, string> = {
  queen: 'star', recruit: 'swordSteel', spearman: 'spear', archer: 'bow', medic: 'potionG',
  wall: 'shieldBronze', minelayer: 'axe', reaper: 'axe', protector: 'shieldBlue', berserk: 'axe',
  courier: 'coin', vengetree: 'potionG', runeshield: 'shieldPurple', avenger: 'swordSteel',
  timebomb: 'wandRed', cannon: 'hammer', pyro: 'wandRed', commander: 'shieldBronze', banner: 'shieldGreen',
  zealot: 'swordWood', healer: 'potionR', zapper: 'wandGreen', slinger: 'bow', squire: 'shieldBronze',
  brute: 'hammer', scout: 'bow', shover: 'shieldBlue', sapper: 'axe', cleric: 'potionR', hexer: 'wandRed',
  sniper: 'bow', bouncer: 'shieldGreen', silencer: 'wandGreen', summoner: 'wandGreen', warlord: 'swordSteel',
  plague: 'potionY', archmage: 'shieldPurple', titan: 'hammer',
};

const frames: Record<string, string> = {};
const icons: Record<string, string> = {};

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function slice(img: HTMLImageElement, x: number, y: number, w: number, h: number): string {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  return cv.toDataURL();
}

export async function initSprites(): Promise<void> {
  const [framesImg, iconsImg] = await Promise.all([load(framesUrl), load(iconsUrl)]);
  if (framesImg) for (const [name, [x, y]] of Object.entries(FRAME_SRC)) frames[name] = slice(framesImg, x, y, FW, FH);
  if (iconsImg) for (const [name, [x, y, w, h]] of Object.entries(ICON_SRC)) icons[name] = slice(iconsImg, x, y, w, h);
  // UI kit → CSS proměnné (pergamenové panely, tmavé sloty, ikony)
  const root = document.documentElement.style;
  root.setProperty('--ui-panel', `url(${panelUrl})`);
  root.setProperty('--ui-slot', `url(${slotUrl})`);
  root.setProperty('--ui-cover', `url(${coverUrl})`);
  root.setProperty('--ic-home', `url(${homeUrl})`);
  root.setProperty('--ic-coin', `url(${coinUrl})`);
  root.setProperty('--ic-energy', `url(${energyUrl})`);
}

/** Rámeček karty podle vlastníka (Královna zlatý). */
export function frameFor(owner: PlayerId, isQueen: boolean): string {
  if (isQueen) return frames['gold'] ?? '';
  return owner === 'A' ? (frames['blue'] ?? '') : (frames['red'] ?? '');
}

/** Pixel-art ikona pro kartu (data URI), nebo '' když není. */
export function iconFor(defId: string): string {
  const key = ART_MAP[defId] ?? 'star';
  return icons[key] ?? '';
}
