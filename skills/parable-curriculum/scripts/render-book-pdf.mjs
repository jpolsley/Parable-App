// Print a Parable series book to PDF: the same pages Justin gets from Print → Series book.
//
// By default it serves the copy of Parable bundled in ../assets/parable-app (no repo, no internet needed).
// Needs Node 18+ and Playwright with Chromium: npm i playwright && npx playwright install chromium
//
//   node render-book-pdf.mjs out.pdf --series my-series.parable.json
//        imports the series file and prints it (the series id is read from the file)
//   node render-book-pdf.mjs out.pdf --series my-series.parable.json --design "Poster Club"
//        also applies a design already in Parable's library (built in: "Poster Club", "Spine")
//   node render-book-pdf.mjs out.pdf --series my-series.parable.json --layout my.parable-layout.json
//        imports a design file first and applies it
//   node render-book-pdf.mjs out.pdf
//        the built-in B.L.E.S.S. series in the default design
// Options: --url <running Parable, e.g. http://localhost:8123>  --chromium /path/to/chromium  --id <series id>
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const out = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!out) { console.error('Usage: node render-book-pdf.mjs out.pdf [--series file] [--design name | --layout file]'); process.exit(1); }

const seriesFile = opt('series');
const layoutFile = opt('layout');
let designName = opt('design');
if (layoutFile) designName = JSON.parse(readFileSync(layoutFile, 'utf8')).name;
const seriesId = opt('id') ?? (seriesFile ? JSON.parse(readFileSync(seriesFile, 'utf8')).series?.[0]?.id : 'bless-series');
if (!seriesId) { console.error('No series found in the series file.'); process.exit(1); }

// ---------- Serve the bundled app unless a URL was given ----------
let base = opt('url');
let server;
if (!base) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/parable-app');
  if (!existsSync(join(root, 'index.html'))) { console.error(`Bundled app not found at ${root}. Pass --url to a running Parable.`); process.exit(1); }
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
  server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = resolve(join(root, path));
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
}

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  try { ({ chromium } = await import('playwright-core')); } catch {
    console.error('Playwright not found. Install it next to this script: npm i playwright && npx playwright install chromium');
    server?.close();
    process.exit(1);
  }
}
const browser = await chromium.launch(opt('chromium') ? { executablePath: opt('chromium') } : {});
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|status of 404/.test(m.text())) errors.push(m.text()); });

// Series files import from the shelf ("More → Import a file"); design files from Library → Book designs.
const importFile = async (path, route) => {
  await page.goto(`${base}/#/${route}`);
  await page.waitForTimeout(800);
  await page.setInputFiles('input[type=file]', resolve(path));
  await page.waitForTimeout(700);
};

try {
  await page.goto(`${base}/#/`);
  await page.waitForTimeout(1000); // first load seeds the built-in series and designs
  if (seriesFile) await importFile(seriesFile, '');
  if (layoutFile) await importFile(layoutFile, 'library');

  await page.goto(`${base}/#/series/${seriesId}`);
  await page.waitForTimeout(800);
  const printButton = page.getByRole('button', { name: 'Print', exact: true });
  if (!(await printButton.count())) throw new Error(`Series "${seriesId}" didn't open. Did the import work?`);
  if (designName) {
    await page.click('button:has-text("Design")');
    await page.waitForTimeout(600);
    await page.click(`li button:has-text(${JSON.stringify(designName)})`);
    await page.waitForTimeout(400);
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  await page.evaluate(() => { window.print = () => {}; });
  await printButton.click(); // by exact name: a cover thumbnail can contain the word "PRINT" too
  await page.click('[role=menuitem]:has-text("Series book")');
  await page.waitForTimeout(3500); // fonts, fit-to-page and text fitting run before printing
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  const pages = (readFileSync(out).toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`Wrote ${out} (${pages} pages)`);
  console.log(errors.length ? `Console errors:\n${errors.join('\n')}` : 'No console errors.');
} finally {
  await browser.close();
  server?.close();
}
