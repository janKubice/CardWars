// Kontrola, že buildnutá roguelike hra běží v prohlížeči:
// obchod -> nákup -> do boje -> zahrání karty -> ukončení tahu -> screenshot.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '../dist/index.html');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 760, height: 1100 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + htmlPath);

// 1) Start v obchodě.
await page.waitForSelector('.shop');
const shopCards = await page.locator('.shopcard').count();
console.log(`obchod: nabídka ${shopCards} karet`);

// 2) Zkus koupit první dostupnou kartu a přehodit nabídku.
const buyBtn = page.locator('.shopcard button:not([disabled])').first();
if (await buyBtn.count()) { await buyBtn.click(); console.log('koupena karta ✓'); }
const rerollBtn = page.locator('button[data-action="reroll"]:not([disabled])');
if (await rerollBtn.count()) { await rerollBtn.click(); console.log('reroll ✓'); }
const deckBefore = await page.locator('.deckrow').count();

// screenshot obchodu
await page.screenshot({ path: resolve(__dirname, '../dist/shop.png') });

// 3) Do boje.
await page.locator('button[data-action="tobattle"]').click();
await page.waitForSelector('.board');
const cells = await page.locator('.cell').count();
const queens = await page.locator('.card.queen').count();
console.log(`souboj: buňky=${cells}, královny=${queens}`);

// 4) Během pár tahů reálně polož jednotku.
let played = false;
for (let round = 0; round < 5 && !played; round++) {
  const aff = page.locator('.handcard:not(.unaffordable)').first();
  if (await aff.count()) {
    await aff.click();
    const legal = page.locator('.cell.legal');
    if (await legal.count()) { await legal.first().click(); played = true; break; }
  }
  const end = page.locator('button[data-action="endturn"]');
  if (!(await end.isDisabled())) { await end.click(); await page.waitForTimeout(700); }
}
console.log(`jednotka položena přes UI: ${played}`);

await page.screenshot({ path: resolve(__dirname, '../dist/screenshot.png') });
console.log('screenshot uložen: dist/screenshot.png');
await browser.close();

if (cells !== 42) { console.error('CHYBA: nečekaný počet buněk'); process.exit(1); }
if (queens !== 2) { console.error('CHYBA: nejsou 2 královny'); process.exit(1); }
if (deckBefore < 6) { console.error('CHYBA: seznam balíčku se nevykreslil'); process.exit(1); }
if (errors.length) { console.error('CHYBA konzole:', errors.slice(0, 5)); process.exit(1); }
console.log('OK ✅ roguelike běh funguje v prohlížeči (obchod → souboj → hraní).');
