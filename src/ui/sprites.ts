import framesUrl from '../../assets/Modular_Fantasy_Cards_Spritesheet.png';
import type { PlayerId } from '../engine/index.ts';

// Nařezání spritesheetu na jednotlivé PNG (data URI) za běhu přes canvas.
// Díky tomu jde sprite roztáhnout responzivně (background-size:100% 100%)
// a zůstane ostrý (image-rendering: pixelated).

const FW = 68;
const FH = 95;

// souřadnice obloukových rámečků ve sheetu (změřeno analyzátorem)
const FRAME_SRC: Record<string, { x: number; y: number }> = {
  blue: { x: 4, y: 4 },
  red: { x: 156, y: 4 },
  gold: { x: 308, y: 210 },
  green: { x: 308, y: 4 },
};

const frames: Record<string, string> = {};

export function initSprites(): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      for (const [name, s] of Object.entries(FRAME_SRC)) {
        const cv = document.createElement('canvas');
        cv.width = FW;
        cv.height = FH;
        const ctx = cv.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, s.x, s.y, FW, FH, 0, 0, FW, FH);
          frames[name] = cv.toDataURL();
        }
      }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = framesUrl;
  });
}

/** Rámeček karty podle vlastníka (Královna dostane zlatý). */
export function frameFor(owner: PlayerId, isQueen: boolean): string {
  if (isQueen) return frames['gold'] ?? '';
  return owner === 'A' ? (frames['blue'] ?? '') : (frames['red'] ?? '');
}
