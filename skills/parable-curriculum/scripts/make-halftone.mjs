// Builds the "Sticker Shop" layout: black poster cover, light gray week dividers with halftone cut-paper
// stickers (one icon per B.L.E.S.S. week), and inside pages with highlight headings and sticker flair.
import { readFileSync, writeFileSync } from 'node:fs';

const INK = '#0B0B0D';
const GRAY = '#E8E8ED';
const CYAN = '#5AD7FF';
const C = { magenta: '#FF3DF0', lime: '#B8FF3D', orange: '#FF6A2B', mint: '#3DFFA8', cyan: CYAN, yellow: '#F5F23A', white: '#FFFFFF' };

// Seeded random, so the cut edges are the same every build.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (n) => Math.round(n * 10) / 10;

// A scissor-cut backing around a 200×200 icon box: an uneven polygon with straight cuts.
const backing = (color, r = 122, n = 11) => {
  const pts = [];
  const start = rnd() * Math.PI;
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    const rr = r * (0.9 + rnd() * 0.16);
    pts.push(`${f(100 + Math.cos(a) * rr)},${f(100 + Math.sin(a) * rr)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${color}"/>`;
};

// Halftone shading: light dots everywhere, medium dots past the middle, big dots in the shadow corner.
const halftone = (shape) =>
  `<g fill="url(#htC)">${shape}</g><g fill="url(#htA)" clip-path="url(#htMid)">${shape}</g><g fill="url(#htB)" clip-path="url(#htShadow)">${shape}</g>`;

// Backings cut close around each icon: a convex hull of its outline (measured in a browser), pushed out a little.
let HULLS = {};
try { HULLS = JSON.parse(readFileSync(new URL('./hulls.json', import.meta.url), 'utf8')); } catch { /* first run: measure with hulls.mjs */ }
const cut = (key, color) => key === 'burst'
  ? `<g transform="translate(100 100) scale(1.22) translate(-100 -100)" fill="${color}">${ICONS.burst()}</g>`
  : (HULLS[key] ? `<polygon points="${HULLS[key]}" fill="${color}"/>` : backing(color));
const sticker = (key, color, x, y, s, rot, cls = '') =>
  `<g${cls ? ` class="${cls}"` : ''} transform="translate(${x} ${y}) rotate(${rot} ${100 * s} ${100 * s}) scale(${s})">${cut(key, color)}${halftone(ICONS[key](color))}</g>`;

// ---------- Icons, drawn in a 200×200 box ----------
export const ICONS = {
  // Begin with prayer: praying hands.
  pray: () =>
    `<path d="M98 10 C84 26 70 62 64 100 L58 140 L44 152 L74 182 L98 156 Z"/><path d="M102 10 C116 26 130 62 136 100 L142 140 L156 152 L126 182 L102 156 Z"/><polygon points="38,160 70,192 58,204 26,172"/><polygon points="162,160 130,192 142,204 174,172"/>`,
  // Listen with care: headphones.
  listen: () =>
    `<path d="M34 118 C34 46 166 46 166 118 L150 118 C150 66 50 66 50 118 Z"/><rect x="24" y="106" width="42" height="74" rx="16"/><rect x="134" y="106" width="42" height="74" rx="16"/>`,
  // Eat together: a taco.
  eat: (bg) =>
    `<path d="M26 92 Q34 62 56 72 Q66 48 88 62 Q100 40 118 58 Q136 42 146 66 Q166 58 174 90 Z"/><path d="M18 96 L182 96 A82 76 0 0 1 18 96 Z"/><path d="M18 96 L182 96" stroke="${bg}" stroke-width="5"/><path d="M60 126 L66 146 M100 132 L100 156 M140 126 L134 146" stroke="${bg}" stroke-width="5" stroke-linecap="round"/>`,
  // Serve with love: a heart held by an open hand.
  serve: () =>
    `<path d="M100 104 C78 90 56 72 56 50 C56 32 80 22 100 44 C120 22 144 32 144 50 C144 72 122 90 100 104 Z"/><path d="M14 132 Q56 116 96 132 L148 120 Q172 114 176 128 Q178 142 158 148 L112 162 Q88 176 58 172 L14 176 Z"/>`,
  // Share the story: a speech bubble with a cross cut out.
  share: () =>
    `<path fill-rule="evenodd" d="M34 26 H166 Q184 26 184 44 V122 Q184 140 166 140 H94 L56 176 L64 140 H34 Q16 140 16 122 V44 Q16 26 34 26 Z M91 44 H109 V68 H134 V86 H109 V124 H91 V86 H66 V68 H91 Z"/>`,
  // Flair.
  burst: () => {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? 44 + (i % 3) * 6 : 92 - (i % 4) * 5;
      pts.push(`${f(100 + Math.cos(a) * r)},${f(100 + Math.sin(a) * r)}`);
    }
    return `<polygon points="${pts.join(' ')}"/>`;
  },
  heart: () => `<path d="M100 172 C64 146 22 116 22 74 C22 40 64 24 100 62 C136 24 178 40 178 74 C178 116 136 146 100 172 Z"/>`,
  smile: () =>
    `<path fill-rule="evenodd" d="M100 20 A80 80 0 1 1 99.9 20 Z M70 64 A14 18 0 1 0 70.1 64 Z M130 64 A14 18 0 1 0 130.1 64 Z M56 112 Q100 160 144 112 Q100 140 56 112 Z"/>`,
  sparkle: () => `<path d="M100 10 Q112 88 190 100 Q112 112 100 190 Q88 112 10 100 Q88 88 100 10 Z"/>`,
};

if (process.argv[2] === '--icons') { console.log(JSON.stringify(Object.fromEntries(Object.entries(ICONS).map(([k, fn]) => [k, fn('#fff')])))); process.exit(0); }

// Patterns and clips shared by every sticker (they live in each page's always-visible background).
const DEFS = `<defs>
<pattern id="htA" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2.15" fill="${INK}"/></pattern>
<pattern id="htB" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="3.25" fill="${INK}"/></pattern>
<pattern id="htC" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.25" fill="${INK}"/></pattern>
<pattern id="htCy" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.9" fill="${CYAN}"/></pattern>
<pattern id="htDk" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" fill="#1C1C21"/></pattern>
<clipPath id="htMid"><polygon points="70,0 200,0 200,200 0,200 0,90"/></clipPath>
<clipPath id="htShadow"><polygon points="135,0 200,0 200,200 0,200 0,165"/></clipPath>
</defs>`;

const wrap = (bg, inner) => `<div style="position:relative;width:8.5in;height:11in;overflow:hidden;background:${bg};font-family:'Inter Variable',sans-serif;">${inner}</div>`;

// ---------- Cover ----------
const cover = wrap(INK, `
<svg viewBox="0 0 850 1100" style="position:absolute;left:0;top:0;width:8.5in;height:11in">${DEFS}
<rect x="0" y="430" width="850" height="420" fill="url(#htDk)"/>
<polygon points="0,868 540,792 610,832 850,748 850,1100 0,1100" fill="url(#htCy)"/>
<polygon points="0,884 540,808 610,848 850,764 850,1100 0,1100" fill="${GRAY}"/>
${sticker('pray', C.mint, 26, 26, 1.02, -14)}
${sticker('burst', C.yellow, 590, 520, 1.05, 8)}
${sticker('heart', C.orange, 665, 738, 0.8, 14)}
</svg>
<div style="position:absolute;right:0.6in;top:0.55in;color:#FFFFFF;font-size:9pt;font-weight:700;letter-spacing:0.04em;">Parable</div>
<div data-fit style="position:absolute;left:0.7in;top:2.05in;width:7.2in;height:1.9in;font-size:118pt;display:flex;align-items:flex-end;">
  <h1 style="margin:0;font-size:1em;font-weight:650;line-height:0.95;letter-spacing:-0.035em;color:#FFFFFF;">{{title}}</h1>
</div>
<div style="position:absolute;left:0.7in;top:4.1in;display:flex;align-items:baseline;gap:9pt;background:${INK};padding:4pt 10pt 4pt 0;font-size:30pt;font-weight:650;letter-spacing:-0.02em;color:#FFFFFF;">
  <span>Leader guide,</span><span style="background:${CYAN};color:${INK};padding:0 7pt;">{{weeks}} weeks.</span>
</div>
<div style="position:absolute;left:0.7in;top:5.15in;font-size:17pt;line-height:2.1;color:#2997FF;font-weight:450;">
  <div>{{dates}} ↗</div><div>For {{audience}} ↗</div>
</div>
<div style="position:absolute;left:0.7in;bottom:0.7in;width:4.9in;color:#1D1D1F;">
  <p style="margin:0 0 5pt;font-size:8pt;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6E6E73;">The big idea</p>
  <p data-fit style="margin:0;height:0.8in;font-size:17pt;font-weight:600;line-height:1.25;letter-spacing:-0.01em;">{{subtitle}}</p>
  <p data-fit style="margin:8pt 0 0;height:0.36in;font-size:10pt;line-height:1.4;color:#6E6E73;">{{verse}}</p>
</div>`);

// ---------- Dividers: one sticker per week, picked by the week number in the title ----------
const weekStickers = [
  ['wk0', 'burst', C.yellow],
  ['wk1', 'pray', C.magenta],
  ['wk2', 'listen', C.lime],
  ['wk3', 'eat', C.orange],
  ['wk4', 'serve', C.mint],
  ['wk5', 'share', C.cyan],
];
const divider = `<div class="htdv {{title}}" style="position:relative;width:8.5in;height:11in;overflow:hidden;background:${GRAY};font-family:'Inter Variable',sans-serif;">
<svg viewBox="0 0 850 1100" style="position:absolute;left:0;top:0;width:8.5in;height:11in">${DEFS}
${weekStickers.map(([cls, icon, color]) => sticker(icon, color, 250, 540, 1.85, -6, cls)).join('\n')}
${sticker('burst', C.yellow, 170, 470, 0.72, -12, 'flair')}
${sticker('sparkle', C.white, 610, 860, 0.62, 10)}
</svg>
<div style="position:absolute;left:0.7in;top:0.62in;font-size:8.5pt;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6E6E73;">{{kicker}}</div>
<div data-fit style="position:absolute;left:0.7in;top:0.95in;width:7.1in;height:1.55in;font-size:110pt;display:flex;align-items:flex-end;">
  <h1 style="margin:0;font-size:1em;font-weight:650;line-height:0.95;letter-spacing:-0.035em;color:${INK};">{{title}}</h1>
</div>
<div style="position:absolute;left:0.7in;top:2.7in;width:6.6in;font-size:28pt;font-weight:650;letter-spacing:-0.02em;line-height:1.3;color:${INK};">
  <span style="background:${CYAN};padding:0 7pt;-webkit-box-decoration-break:clone;box-decoration-break:clone;">{{subtitle}}</span>
</div>
<p data-fit style="position:absolute;left:0.7in;top:3.55in;width:4.6in;height:0.95in;margin:0;font-size:14pt;line-height:1.4;color:#3A3A3C;">{{idea}}</p>
</div>`;

// ---------- Inside pages ----------
// Small cut-paper flair stickers drawn in CSS (clip-path + dot gradients), one color per section.
const dots = (r) => `radial-gradient(circle, ${INK} ${r}pt, transparent ${r + 0.25}pt) 0 0 / 4pt 4pt`;
const burstClip = 'polygon(50% 0%, 61% 30%, 90% 14%, 74% 44%, 100% 56%, 70% 64%, 82% 96%, 54% 76%, 34% 100%, 34% 70%, 4% 80%, 24% 54%, 0% 32%, 32% 30%, 22% 4%)';
const cutClip = 'polygon(8% 14%, 46% 0%, 92% 8%, 100% 52%, 88% 94%, 40% 100%, 4% 82%, 0% 40%)';
const SECTION_COLORS = [C.yellow, C.lime, C.magenta, C.orange, C.cyan];
const css = [
  `.pr-head { border-bottom: 0; position: relative; padding-bottom: 14pt; }`,
  `.pr-head::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 7pt; background: radial-gradient(circle, ${INK} 1pt, transparent 1.25pt) 0 0 / 4pt 3.5pt; }`,
  `.pr-head h1, .pr-family-head h1 { font-family: 'Inter Variable', sans-serif; font-weight: 700; letter-spacing: -0.03em; }`,
  `.pr-sec-head { border-bottom: 0; position: relative; padding-bottom: 12pt; margin-bottom: 10pt; }`,
  `.pr-sec-head::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 5pt; background: radial-gradient(circle, ${INK} 0.85pt, transparent 1.1pt) 0 0 / 3.5pt 2.5pt; }`,
  `.pr-sec-head h2 { display: inline; background: ${CYAN}; padding: 0 6pt; font-family: 'Inter Variable', sans-serif; font-weight: 700; letter-spacing: -0.03em; }`,
  `.pr-sec-head::before { content: ''; position: absolute; right: 8pt; top: 2pt; width: 46pt; height: 46pt; transform: rotate(-10deg); clip-path: ${burstClip}; background: ${dots(0.75)}, ${C.yellow}; }`,
  ...SECTION_COLORS.map((c, i) => `.pr-flow > .pr-sec:nth-child(5n+${i + 1}) .pr-sec-head::before { background: ${dots(0.75)}, ${c}; clip-path: ${i % 2 ? cutClip : burstClip}; transform: rotate(${i % 2 ? 8 : -10}deg); }`),
  `.pr-p-head h3, .pr-weeks h3 { font-family: 'Inter Variable', sans-serif; font-weight: 700; letter-spacing: -0.015em; }`,
  `.pr-p-num { color: ${INK}; background: ${C.lime}; padding: 3pt 4pt 1pt; font-size: 24pt; }`,
  `.pr-eyebrow, .pr-p-kind, .pr-sg-kicker { color: #0A6CFF; }`,
  `.pr-sg-kicker.warm { color: #E0480F; }`,
  `.pr-tag { background: ${CYAN}; color: ${INK}; border-radius: 0; }`,
  `.pr-sg-idea > div, .pr-family-strip { background: ${INK}; color: #FFFFFF; border-radius: 0; }`,
  `.pr-sg-idea .pr-serif { color: #FFFFFF; }`,
  `.pr-sg-idea .pr-label { color: ${CYAN}; }`,
  `.pr-sg-questions span { color: ${INK}; background: ${C.lime}; font-size: 15pt; text-align: center; padding: 3pt 0 1pt; }`,
  `.pr-sg-notes { background: ${GRAY}; border-radius: 0; }`,
  `.pr-family-card, .pr-sg-close > div, .pr-roles > div { border: 1.5pt solid ${INK}; border-radius: 0; box-shadow: 4pt 4pt 0 ${INK}; }`,
  `.pr-weeks .n { color: ${INK}; }`,
  `.pr-family-strip { position: relative; }`,
  `.pr-family-strip::after { content: ''; position: absolute; right: 10pt; top: -14pt; width: 54pt; height: 54pt; transform: rotate(12deg); clip-path: ${burstClip}; background: ${dots(0.8)}, ${C.yellow}; }`,
].join('\n');

// Divider sticker switching: the title ("Week 3") becomes classes, so [class~="3"] picks week 3's icon.
const switching = [
  `.htdv .wk1, .htdv .wk2, .htdv .wk3, .htdv .wk4, .htdv .wk5 { display: none; }`,
  ...[1, 2, 3, 4, 5].map((n) => `.htdv[class~="${n}"] .wk${n} { display: inline; }`),
  `.htdv.Week .wk0 { display: none; }`,
  `.htdv.Week .flair { display: inline; }`,
  `.htdv .flair { display: none; }`,
].join('\n');

const pack = {
  id: 'sticker-shop-v1',
  name: 'Sticker Shop',
  description: 'Black poster cover, light gray dividers with halftone cut-paper stickers (one per week), highlight headings and neon accents.',
  design: {
    palette: { paper: '#FFFFFF', ink: '#1D1D1F', accent: '#0A6CFF', secondary: CYAN, muted: '#6E6E73', deep: INK },
    type: { display: 'inter', body: 'sans', label: 'sans', headingCase: 'normal' },
    page: { corners: 'square', headerRule: 'heavy', mark: 'none' },
    components: { questions: 'numbers', scripture: 'rule' },
  },
  cover,
  divider,
  css: `${css}\n${switching}`,
};

const out = process.argv[2];
writeFileSync(out, JSON.stringify(pack, null, 2) + '\n');
console.log('wrote', out, 'cover', cover.length, 'divider', divider.length, 'css', pack.css.length);
