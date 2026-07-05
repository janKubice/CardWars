import type { Edge, Position } from './types.ts';

// Směry jsou RELATIVNÍ K MAJITELI: "vpřed" = k nepříteli.
// Deska: row 0 = horní okraj (domov hráče 'top'), poslední row = dolní (domov 'bottom').
// Hráč 'bottom' kouká nahoru (forward = row-1), 'top' kouká dolů (forward = row+1).
// Pravá/levá strana se zrcadlí, aby "forwardRight" vypadalo stejně z pohledu obou.

export type Direction =
  | 'forward'
  | 'back'
  | 'left'
  | 'right'
  | 'forwardLeft'
  | 'forwardRight'
  | 'backLeft'
  | 'backRight';

interface Delta {
  dr: number;
  dc: number;
}

// Deltas z pohledu hráče 'bottom' (kouká nahoru).
const BOTTOM: Record<Direction, Delta> = {
  forward: { dr: -1, dc: 0 },
  back: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
  forwardLeft: { dr: -1, dc: -1 },
  forwardRight: { dr: -1, dc: 1 },
  backLeft: { dr: 1, dc: -1 },
  backRight: { dr: 1, dc: 1 },
};

/** Delta pro daný směr a majitele (zrcadlí se pro 'top'). */
export function directionDelta(edge: Edge, dir: Direction): Delta {
  const base = BOTTOM[dir];
  if (edge === 'bottom') return base;
  // 'top' hráč: zrcadlíme obě osy
  return { dr: -base.dr, dc: -base.dc };
}

export function step(pos: Position, edge: Edge, dir: Direction, dist = 1): Position {
  const d = directionDelta(edge, dir);
  return { row: pos.row + d.dr * dist, col: pos.col + d.dc * dist };
}
