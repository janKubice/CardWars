// Automaticky najde ohraničení spritů ve spritesheetech (connected components
// přes alfa kanál). Vypíše bounding boxy, ať je můžu přesně nařezat.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const files = process.argv.slice(2);

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage();

for (const rel of files) {
  const path = resolve(__dirname, '..', rel);
  const b64 = readFileSync(path).toString('base64');
  const boxes = await page.evaluate(async ({ b64 }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const w = img.naturalWidth, h = img.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    const A = 16; // alfa práh
    const seen = new Uint8Array(w * h);
    const solid = (x, y) => data[(y * w + x) * 4 + 3] > A;
    const boxes = [];
    const stack = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (seen[i] || !solid(x, y)) continue;
      let minX = x, maxX = x, minY = y, maxY = y, area = 0;
      stack.length = 0; stack.push(i); seen[i] = 1;
      while (stack.length) {
        const p = stack.pop(); const px = p % w, py = (p / w) | 0; area++;
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (py < minY) minY = py; if (py > maxY) maxY = py;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (!seen[ni] && solid(nx, ny)) { seen[ni] = 1; stack.push(ni); }
        }
      }
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      if (bw >= 8 && bh >= 8 && area >= 40) boxes.push({ x: minX, y: minY, w: bw, h: bh, area });
    }
    return { w, h, boxes };
  }, { b64 });

  boxes.boxes.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  console.log(`\n=== ${rel} (${boxes.w}x${boxes.h}) — ${boxes.boxes.length} spritů ===`);
  // seskup do řádků podle y
  let row = [], lastY = -999;
  const rows = [];
  for (const bx of boxes.boxes) {
    if (Math.abs(bx.y - lastY) > 20 && row.length) { rows.push(row); row = []; }
    if (!row.length || Math.abs(bx.y - row[0].y) <= 40) { row.push(bx); lastY = bx.y; }
    else { rows.push(row); row = [bx]; lastY = bx.y; }
  }
  if (row.length) rows.push(row);
  rows.forEach((r, ri) => {
    console.log(`  řádek ${ri} (y~${r[0].y}): ` + r.map((b) => `[${b.x},${b.y} ${b.w}x${b.h}]`).join(' '));
  });
}
await browser.close();
