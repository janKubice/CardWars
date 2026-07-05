import type { RngState } from './types.ts';

// Deterministický seedovaný RNG (mulberry32). Determinismus je klíčový:
// opakovatelné testy, replaye a do budoucna autoritativní multiplayer.

export function makeRng(seed: number): RngState {
  return { seed: seed >>> 0 };
}

/** Vrátí float v [0,1) a posune stav. */
export function nextFloat(rng: RngState): number {
  rng.seed = (rng.seed + 0x6d2b79f5) >>> 0;
  let t = rng.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Celé číslo v [0, n). */
export function nextInt(rng: RngState, n: number): number {
  return Math.floor(nextFloat(rng) * n);
}

/** Náhodný prvek pole (nebo undefined). */
export function pick<T>(rng: RngState, arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[nextInt(rng, arr.length)];
}

/** Zamíchá pole na místě (Fisher-Yates). */
export function shuffleInPlace<T>(arr: T[], rng: RngState): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}
