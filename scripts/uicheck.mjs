// Rychlá kontrola, že buildnutá hra reálně běží v prohlížeči.
// Načte dist/index.html, ověří vykreslení, zahraje kartu, ukončí tah, screenshot.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '../dist/index.html');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 760, height: 1000 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + htmlPath);
await page.waitForSelector('.board');

const cells = await page.locator('.cell').count();
const handCards = await page.locator('.handcard').count();
const queens = await page.locator('.card.queen').count();
console.log(`buňky=${cells} (čekáno 42), karty v ruce=${handCards}, královny=${queens}`);

// Během několika tahů zkus reálně položit jednotku přes UI (klik karta -> políčko).
let played = false;
for (let round = 0; round < 5 && !played; round++) {
  const affordable = page.locator('.handcard:not(.unaffordable)').first();
  if (await affordable.count()) {
    await affordable.click();
    const legal = page.locator('.cell.legal');
    if (await legal.count()) {
      await legal.first().click();
      played = true;
      console.log(`karta zahrána ✓ (tah ${round + 1})`);
      break;
    }
  }
  // nic k zahrání -> ukonči tah, nech bota odehrát
  await page.locator('button[data-action="endturn"]').click();
  await page.waitForTimeout(800);
}
const onBoardA = await page.locator('.card.owner-A').count();
console.log(`karet hráče A na desce=${onBoardA}`);

// Ukonči tah -> bot odehraje.
if (!(await page.locator('button[data-action="endturn"]').isDisabled())) {
  await page.locator('button[data-action="endturn"]').click();
  await page.waitForTimeout(900);
}
const logLines = await page.locator('.log div').count();
console.log(`řádků logu=${logLines}`);

await page.screenshot({ path: resolve(__dirname, '../dist/screenshot.png') });
console.log('screenshot uložen: dist/screenshot.png');

await browser.close();

if (cells !== 42) { console.error('CHYBA: nečekaný počet buněk'); process.exit(1); }
if (queens !== 2) { console.error('CHYBA: nejsou 2 královny'); process.exit(1); }
if (errors.length) { console.error('CHYBA: konzole/pageerror:', errors.slice(0, 5)); process.exit(1); }
console.log(`OK ✅ hra běží v prohlížeči bez chyb (karta zahrána: ${played}).`);
