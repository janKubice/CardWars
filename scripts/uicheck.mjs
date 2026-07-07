// Ověří, že buildnutá hra běží v prohlížeči: menu → přepnutí jazyka →
// nový run → obchod → nákup → do boje → položení jednotky. + screenshoty.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '../dist/index.html');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 780, height: 1120 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + htmlPath);

// 1) Menu — výchozí jazyk musí být angličtina
await page.waitForSelector('.menu');
await page.waitForTimeout(500); // dokončit fade-in animaci
const defaultText = (await page.locator('.menu .primary').innerText()).trim();
const defaultEN = /New Run/i.test(defaultText);
console.log(`menu ✓ (výchozí jazyk: ${defaultEN ? 'EN' : 'jiný: ' + defaultText})`);
await page.screenshot({ path: resolve(__dirname, '../dist/menu.png') });

// 2) Přepnutí jazyka EN → CS (ověř, že se text mění)
await page.locator('button[data-action="lang"][data-lang="en"]').click();
const enText = await page.locator('.menu .primary').innerText();
await page.locator('button[data-action="lang"][data-lang="cs"]').click();
const csText = await page.locator('.menu .primary').innerText();
console.log(`jazyk EN="${enText.trim()}" CS="${csText.trim()}"`);
if (enText.trim() === csText.trim()) { console.error('CHYBA: přepnutí jazyka nic nezměnilo'); process.exit(1); }

// 3) Nový run → obchod
await page.locator('button[data-action="newrun"]').click();
await page.waitForSelector('.shop');
const shopCards = await page.locator('.shopcard').count();
console.log(`obchod: ${shopCards} karet`);
// vylepšení karty (gold 4 na startu → cena 3)
const upBtn = page.locator('button[data-action="upgrade"]:not([disabled])').first();
let upgraded = false;
if (await upBtn.count()) { await upBtn.click(); upgraded = (await page.locator('.lvl').count()) > 0; console.log(`vylepšení ✓ (lvl tag: ${upgraded})`); }
// nákup
const buyBtn = page.locator('.shopcard .buy:not([disabled])').first();
if (await buyBtn.count()) { await buyBtn.click(); console.log('nákup ✓'); }
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(__dirname, '../dist/shop.png') });

// 3b) Najížděcí nápověda: hover na kartu v obchodě ukáže tooltip s popisem
await page.locator('.shopcard').first().hover();
await page.waitForTimeout(150);
const tipVisible = (await page.locator('#tip:not([hidden])').count()) > 0;
const tipText = tipVisible ? (await page.locator('#tip').innerText()).trim() : '';
console.log(`tooltip: ${tipVisible ? 'zobrazen' : 'NE'} — "${tipText.slice(0, 46).replace(/\n/g, ' ')}"`);
await page.screenshot({ path: resolve(__dirname, '../dist/tooltip.png') });

// 4) Do boje
await page.locator('button[data-action="tobattle"]').click();
await page.waitForSelector('.board');
const cells = await page.locator('.cell').count();
const queens = await page.locator('.pc--queen').count();
console.log(`souboj: buňky=${cells}, královny=${queens}`);

// 5) Polož jednotku (počítáme JEN karty na desce; ruka má taky .pc)
async function waitHumanTurn() {
  for (let i = 0; i < 40; i++) { if (!(await page.locator('button[data-action="endturn"]').isDisabled())) return; await page.waitForTimeout(200); }
}
let played = false;
for (let turn = 0; turn < 8 && !played; turn++) {
  await waitHumanTurn();
  const aff = page.locator('.hslot:not(.is-dim)').first();
  if (await aff.count()) {
    await aff.click();
    const legal = page.locator('.cell.legal');
    if (await legal.count()) {
      const before = await page.locator('.board .pc').count();
      await legal.first().click();
      await page.waitForTimeout(250);
      if ((await page.locator('.board .pc').count()) > before) played = true;
    }
  }
  if (!(await page.locator('button[data-action="endturn"]').isDisabled())) await page.locator('button[data-action="endturn"]').click();
  await page.waitForTimeout(400);
}
console.log(`jednotka reálně položena na desku: ${played}`);
await page.screenshot({ path: resolve(__dirname, '../dist/screenshot.png') });
await browser.close();

if (cells !== 42) { console.error('CHYBA: nečekaný počet buněk'); process.exit(1); }
if (queens !== 2) { console.error('CHYBA: nejsou 2 královny'); process.exit(1); }
if (shopCards !== 5) { console.error('CHYBA: obchod nemá 5 karet'); process.exit(1); }
if (!upgraded) { console.error('CHYBA: vylepšení karty se neprojevilo'); process.exit(1); }
if (!played) { console.error('CHYBA: nešlo vyložit kartu na desku (regrese pokládání!)'); process.exit(1); }
if (!defaultEN) { console.error('CHYBA: výchozí jazyk není angličtina'); process.exit(1); }
if (!tipVisible) { console.error('CHYBA: najížděcí nápověda (tooltip) se nezobrazila'); process.exit(1); }
if (errors.length) { console.error('CHYBA konzole:', errors.slice(0, 5)); process.exit(1); }
console.log('OK ✅ menu + jazyk + tooltip + obchod + souboj fungují v prohlížeči.');
