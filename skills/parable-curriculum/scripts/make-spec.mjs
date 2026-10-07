// "Spec Sheet" cover: the aesthetic of a technical print proof, not its composition.
// White, a strict grid, black ink, one loud element (the title), small precise marks, mono metadata.
import { writeFileSync } from 'node:fs';

const INK = '#1C1A1D';
const RULE = '#C9C6CC';
const CYAN = '#3FD6E6';
const PINK = '#FF5FA8';
const GROT = "'Space Grotesk Variable', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// Grid: 60-unit margins on the 850 × 1100 page, 6 columns.
const L = 60, R = 790, colW = (R - L) / 6;
const col = (i) => L + colW * i;

const plus = (x, y, s = 5) => `<path d="M${x - s} ${y} H${x + s} M${x} ${y - s} V${y + s}" stroke="${INK}" stroke-width="1.2"/>`;
const crops = (x, y, w, h, l = 14) => {
  const m = (px, py, dx, dy) => `<path d="M${px + dx * l} ${py} H${px} V${py + dy * l}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
  return m(x, y, 1, 1) + m(x + w, y, -1, 1) + m(x, y + h, 1, -1) + m(x + w, y + h, -1, -1);
};
const diag = (t) => `M${-t / 4} ${t / 4} L${t / 4} ${-t / 4} M0 ${t} L${t} 0 M${t - t / 4} ${t + t / 4} L${t + t / 4} ${t - t / 4}`;
const at = (x, y, style, html) => `<div style="position:absolute;left:${(x / 100).toFixed(2)}in;top:${(y / 100).toFixed(2)}in;${style}">${html}</div>`;
const mono = (size, color = INK) => `font-family:${MONO};font-weight:600;font-size:${size}pt;letter-spacing:0.06em;text-transform:uppercase;color:${color};`;
const monoLight = (size, color = '#6B6870') => `font-family:${MONO};font-weight:400;font-size:${size}pt;letter-spacing:0.06em;text-transform:uppercase;color:${color};`;

// The spec table at the bottom: label / value rows on hairlines.
const rows = [['Dates', '{{dates}}'], ['For', '{{audience}}'], ['Length', '{{weeks}} weeks'], ['Format', 'Leader guide']];
const table = rows.map(([k, v], i) => {
  const y = 858 + i * 30;
  return at(col(0), y, `${monoLight(7)}`, k) + at(col(1), y, `${mono(7.5)}`, v);
}).join('');

const cover = `<div style="position:relative;width:8.5in;height:11in;overflow:hidden;background:#FFFFFF;">
<svg viewBox="0 0 850 1100" style="position:absolute;left:0;top:0;width:8.5in;height:11in">
<defs><pattern id="ssH" width="6" height="6" patternUnits="userSpaceOnUse"><path d="${diag(6)}" stroke="${INK}" stroke-width="2"/></pattern></defs>
<rect x="${L}" y="78" width="${R - L}" height="1" fill="${INK}"/>
${plus(col(2), 200)}${plus(col(4), 200)}${plus(R, 200)}
${crops(L - 18, 290, R - L + 36, 300)}
<rect x="${L}" y="618" width="${colW * 2 - 12}" height="12" fill="url(#ssH)"/>
<rect x="${col(2)}" y="618" width="12" height="12" fill="none" stroke="${INK}" stroke-width="1.2"/>
<rect x="${col(2) + 18}" y="618" width="12" height="12" fill="${INK}"/>
${plus(col(4), 760)}${plus(R, 760)}
<rect x="${L}" y="836" width="${R - L}" height="1" fill="${INK}"/>
${[0, 1, 2, 3].map((i) => `<rect x="${L}" y="${880 + i * 30}" width="${colW * 4}" height="0.8" fill="${RULE}"/>`).join('')}
<rect x="${col(4) + 20}" y="858" width="1" height="118" fill="${RULE}"/>
<rect x="${L}" y="1028" width="${R - L}" height="1" fill="${INK}"/>
<rect x="${L}" y="1029.5" width="${(R - L) * 0.38}" height="0.8" fill="${CYAN}"/>
</svg>
${at(L, 52, mono(7), 'Parable / Leader guide')}
${at(col(4), 52, mono(7), 'Ser. 01')}
<div style="position:absolute;right:0.6in;top:0.52in;${monoLight(7)}">{{weeks}} wk</div>
${at(L, 214, monoLight(7), '{{eyebrow}}')}
<div data-fit style="position:absolute;left:0.6in;top:3.05in;width:7.3in;height:2.7in;font-size:150pt;display:flex;align-items:center;">
  <h1 style="margin:0;font-family:${GROT};font-weight:600;font-size:1em;line-height:0.9;letter-spacing:-0.045em;color:${INK};text-shadow:-1.4pt 0 0 rgba(63,214,230,0.75), 1.4pt 0.6pt 0 rgba(255,95,168,0.7);">{{title}}</h1>
</div>
${at(col(2) + 42, 618, `${mono(7)}line-height:12px;`, 'Series overview')}
<p data-fit style="position:absolute;left:0.6in;top:6.62in;width:3.6in;height:1.05in;margin:0;font-family:${GROT};font-weight:500;font-size:15pt;line-height:1.3;letter-spacing:-0.01em;color:${INK};">{{subtitle}}</p>
<p data-fit style="position:absolute;left:${(col(4) / 100).toFixed(2)}in;top:6.62in;width:2.43in;height:0.9in;margin:0;font-family:${MONO};font-weight:400;font-size:7.5pt;line-height:1.55;color:#4A474D;">{{verse}}</p>
${table}
<div style="position:absolute;left:${((col(4) + 34) / 100).toFixed(2)}in;top:8.58in;width:2.2in;${monoLight(6.5)}line-height:1.7;">Print at 100%<br>Letter / 8.5 × 11 in<br>Double-sided</div>
${at(L, 1040, mono(6.5), 'Parable')}
<div style="position:absolute;right:0.6in;top:10.4in;${monoLight(6.5)}">PRL-{{weeks}}.01 % 18</div>
</div>`;

const pack = {
  id: 'spec-sheet-v1',
  name: 'Spec Sheet',
  description: 'Technical print-proof aesthetic: white, a strict grid, crop marks, mono metadata, one big title.',
  design: {
    palette: { paper: '#FFFFFF', ink: INK, accent: INK, secondary: CYAN, muted: '#6B6870', deep: INK },
    type: { display: 'grotesk', body: 'sans', label: 'mono', headingCase: 'normal' },
    page: { corners: 'square', headerRule: 'heavy', mark: 'none' },
    components: { questions: 'numbers', scripture: 'rule' },
  },
  cover,
};
writeFileSync(process.argv[2], JSON.stringify(pack, null, 2) + '\n');
console.log('cover', cover.length);
