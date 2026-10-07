// Print a Parable series book to PDF, optionally with a design applied, to check how pages really look.
//
// Needs: Parable running locally (npm run build && npx vite preview --port 8123) and Playwright with Chromium.
//
//   node render-book-pdf.mjs out.pdf                                   default design, B.L.E.S.S.
//   node render-book-pdf.mjs out.pdf --layout my.parable-layout.json   import the design and apply it
//   node render-book-pdf.mjs out.pdf --series my.parable.json --id my-series
//                                                                       import a series file and print that series
// Options: --url http://localhost:8123  --chromium /path/to/chromium
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
if (!out) { console.error('Usage: node render-book-pdf.mjs out.pdf [--layout file] [--series file --id seriesId]'); process.exit(1); }

const base = opt('url') ?? 'http://localhost:8123';
const layout = opt('layout');
const seriesFile = opt('series');
const seriesId = opt('id') ?? 'bless-series';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.error('Playwright not found. Install it (npm i -D playwright) or run from a folder where it is installed.');
  process.exit(1);
}
const browser = await chromium.launch(opt('chromium') ? { executablePath: opt('chromium') } : {});
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const importFile = async (path) => {
  await page.goto(`${base}/#/library`);
  await page.waitForTimeout(800);
  await page.setInputFiles('input[type=file]', resolve(path));
  await page.waitForTimeout(600);
};

await page.goto(`${base}/#/`);
await page.waitForTimeout(800);
if (seriesFile) await importFile(seriesFile);
if (layout) await importFile(layout);

await page.goto(`${base}/#/series/${seriesId}`);
await page.waitForTimeout(800);
if (layout) {
  const name = JSON.parse(readFileSync(layout, 'utf8')).name;
  await page.click('button:has-text("Design")');
  await page.waitForTimeout(600);
  await page.click(`li button:has-text(${JSON.stringify(name)})`);
  await page.waitForTimeout(400);
  await page.click('button:has-text("Apply")');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

await page.evaluate(() => { window.print = () => {}; });
await page.click('main button:has-text("Print")');
await page.click('[role=menuitem]:has-text("Series book")');
await page.waitForTimeout(3500); // fonts, fit-to-page and text fitting run before printing
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
console.log(`Wrote ${out}`);
console.log(errors.length ? `Console errors:\n${errors.join('\n')}` : 'No console errors.');
await browser.close();
