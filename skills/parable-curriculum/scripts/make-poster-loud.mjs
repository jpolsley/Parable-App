// Builds the "Poster Club" layout: type-led poster pages (giant ghost word behind a crisp title),
// swooping ribbons, spiky stars and small halftone sticker badges at the edges, stacked "echo" labels,
// and printed-paper grain and folds. Inside pages stay white and calm with the same accents.
import { readFileSync, writeFileSync } from 'node:fs';

const INK = '#16111A';
const CREAM = '#F6EFE3';
const P = { pink: '#F43FCB', red: '#EE3427', green: '#33D35B', blue: '#2F66FF', cream: CREAM, yellow: '#F8E63C' };
const DISPLAY = "'Plus Jakarta Sans Variable', sans-serif";

let seed = 21;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (n) => Math.round(n * 10) / 10;

// ---------- Stickers (same drawings as Sticker Shop) ----------
const ICONS = {
  pray: () => `<path d="M98 10 C84 26 70 62 64 100 L58 140 L44 152 L74 182 L98 156 Z"/><path d="M102 10 C116 26 130 62 136 100 L142 140 L156 152 L126 182 L102 156 Z"/><polygon points="38,160 70,192 58,204 26,172"/><polygon points="162,160 130,192 142,204 174,172"/>`,
  listen: () => `<path d="M34 118 C34 46 166 46 166 118 L150 118 C150 66 50 66 50 118 Z"/><rect x="24" y="106" width="42" height="74" rx="16"/><rect x="134" y="106" width="42" height="74" rx="16"/>`,
  eat: (bg) => `<path d="M26 92 Q34 62 56 72 Q66 48 88 62 Q100 40 118 58 Q136 42 146 66 Q166 58 174 90 Z"/><path d="M18 96 L182 96 A82 76 0 0 1 18 96 Z"/><path d="M18 96 L182 96" stroke="${bg}" stroke-width="5"/><path d="M60 126 L66 146 M100 132 L100 156 M140 126 L134 146" stroke="${bg}" stroke-width="5" stroke-linecap="round"/>`,
  serve: () => `<path d="M100 104 C78 90 56 72 56 50 C56 32 80 22 100 44 C120 22 144 32 144 50 C144 72 122 90 100 104 Z"/><path d="M14 132 Q56 116 96 132 L148 120 Q172 114 176 128 Q178 142 158 148 L112 162 Q88 176 58 172 L14 176 Z"/>`,
  share: () => `<path fill-rule="evenodd" d="M34 26 H166 Q184 26 184 44 V122 Q184 140 166 140 H94 L56 176 L64 140 H34 Q16 140 16 122 V44 Q16 26 34 26 Z M91 44 H109 V68 H134 V86 H109 V124 H91 V86 H66 V68 H91 Z"/>`,
  heart: () => `<path d="M100 172 C64 146 22 116 22 74 C22 40 64 24 100 62 C136 24 178 40 178 74 C178 116 136 146 100 172 Z"/>`,
};
const HULLS = JSON.parse(readFileSync(new URL('./hulls.json', import.meta.url), 'utf8'));
const halftone = (shape) =>
  `<g fill="url(#pcC)">${shape}</g><g fill="url(#pcA)" clip-path="url(#pcMid)">${shape}</g><g fill="url(#pcB)" clip-path="url(#pcShadow)">${shape}</g>`;
// A badge: cut backing with a thin dark edge, halftone icon on top.
const badge = (key, color, x, y, s, rot, cls = '') =>
  `<g${cls ? ` class="${cls}"` : ''} transform="translate(${x} ${y}) rotate(${rot} ${100 * s} ${100 * s}) scale(${s})"><polygon points="${HULLS[key]}" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>${halftone(ICONS[key](color))}</g>`;

// A spiky star, flat color with a thin dark outline (like screen-printed cut paper).
const star = (cx, cy, r, n, color, rot = 0, inner = 0.42) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + (rot * Math.PI) / 180;
    const rr = i % 2 ? r * inner * (0.9 + rnd() * 0.2) : r * (0.88 + rnd() * 0.18);
    pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${color}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
};
const sparkle = (cx, cy, r, color = CREAM) =>
  `<path d="M${cx} ${cy - r} Q${cx + r * 0.14} ${cy - r * 0.14} ${cx + r} ${cy} Q${cx + r * 0.14} ${cy + r * 0.14} ${cx} ${cy + r} Q${cx - r * 0.14} ${cy + r * 0.14} ${cx - r} ${cy} Q${cx - r * 0.14} ${cy - r * 0.14} ${cx} ${cy - r} Z" fill="${color}" stroke="${INK}" stroke-width="2.5"/>`;

// Ribbons: parallel swooping bands, each red with a dark edge.
const ribbons = (d, count, step, color = P.red) =>
  Array.from({ length: count }, (_, i) =>
    `<g transform="translate(${i * step * 0.35} ${i * step})"><path d="${d}" fill="none" stroke="${INK}" stroke-width="21" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="15" stroke-linecap="round"/></g>`).join('');

// Paper grain: a tile of random specks, dark and light, laid over the whole page.
const grainTile = () => {
  let s = '';
  for (let i = 0; i < 70; i++) {
    const x = f(rnd() * 64), y = f(rnd() * 64), r = f(0.35 + rnd() * 0.7);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${rnd() < 0.55 ? INK : '#FFFFFF'}" fill-opacity="${f(0.12 + rnd() * 0.22)}"/>`;
  }
  return s;
};
const DEFS = `<defs>
<pattern id="pcA" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2.15" fill="${INK}"/></pattern>
<pattern id="pcB" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="3.25" fill="${INK}"/></pattern>
<pattern id="pcC" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.25" fill="${INK}"/></pattern>
<pattern id="pcGrain" width="64" height="64" patternUnits="userSpaceOnUse">${grainTile()}</pattern>
<clipPath id="pcMid"><polygon points="70,0 200,0 200,200 0,200 0,90"/></clipPath>
<clipPath id="pcShadow"><polygon points="135,0 200,0 200,200 0,200 0,165"/></clipPath>
</defs>`;

// Printed-poster finish: grain, fold creases, and a few worn scuffs at the edges.
const finish = `
<rect width="850" height="1100" fill="url(#pcGrain)"/>
<line x1="425" y1="0" x2="425" y2="1100" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="1.6"/>
<line x1="427.5" y1="0" x2="427.5" y2="1100" stroke="${INK}" stroke-opacity="0.12" stroke-width="1.6"/>
<line x1="0" y1="367" x2="850" y2="367" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="1.6"/>
<line x1="0" y1="733" x2="850" y2="733" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="1.6"/>
<polygon points="0,0 70,0 52,12 18,22 0,40" fill="${CREAM}" fill-opacity="0.55"/>
<polygon points="850,1100 790,1100 806,1086 838,1074 850,1052" fill="${CREAM}" fill-opacity="0.5"/>
<polygon points="612,0 668,0 650,9 626,7" fill="${CREAM}" fill-opacity="0.45"/>`;

// The title repeated three times, stacked, each line with a hard dark shadow.
const echo = (text, size, color = CREAM) =>
  `<div style="font-family:${DISPLAY};font-weight:800;font-size:${size}pt;line-height:0.86;letter-spacing:-0.01em;text-transform:uppercase;color:${color};text-shadow:1.6pt 1.6pt 0 ${INK};white-space:nowrap;">
  <div>${text}</div><div>${text}</div><div>${text}</div></div>`;

const svgLayer = (inner) => `<svg viewBox="0 0 850 1100" style="position:absolute;left:0;top:0;width:8.5in;height:11in">${inner}</svg>`;
const ghost = (text, size, top, left = '-0.3in', width = '9in') =>
  `<div style="position:absolute;left:${left};top:${top};width:${width};font-family:${DISPLAY};font-weight:800;font-size:${size}pt;line-height:0.82;letter-spacing:-0.04em;text-transform:uppercase;color:${INK};opacity:0.9;">${text}</div>`;

// ---------- Cover ----------
const blob = 'M-40 120 C120 40 330 110 470 70 C640 20 800 60 900 150 L900 860 C760 960 560 900 400 980 C230 1060 80 990 -40 1020 Z';
const cover = `<div style="position:relative;width:8.5in;height:11in;overflow:hidden;background:${P.red};font-family:'Inter Variable',sans-serif;">
${svgLayer(`${DEFS}<path d="${blob}" fill="${P.pink}" stroke="${INK}" stroke-width="3"/>
${ribbons('M-60 640 C120 520 260 760 430 600 C600 440 640 300 920 340', 4, 34)}`)}
${ghost('{{title}}', 250, '3.05in', '-0.35in', '12in')}
${svgLayer(`
${star(150, 330, 118, 10, P.green, -8)}
${star(770, 120, 130, 9, P.blue, 12)}
${star(705, 905, 150, 10, P.green, 4)}
${star(70, 1020, 120, 8, P.blue, -6)}
${sparkle(800, 700, 30)}${sparkle(395, 1010, 26)}
${badge('heart', P.yellow, 515, 830, 0.62, 12)}`)}
<div style="position:absolute;right:0.45in;top:0.62in;">${echo('{{title}}', 15)}</div>
<div data-fit style="position:absolute;left:0.6in;top:3.25in;width:7.3in;height:2.5in;font-size:96pt;display:flex;align-items:center;justify-content:center;">
  <h1 style="margin:0;font-family:${DISPLAY};font-size:1em;font-weight:800;line-height:0.88;letter-spacing:-0.02em;text-transform:uppercase;text-align:center;color:${CREAM};text-shadow:3pt 3pt 0 ${INK};">{{title}}</h1>
</div>
<div style="position:absolute;left:0.6in;top:5.95in;width:7.3in;text-align:center;">
  <span style="display:inline-block;background:${INK};color:${CREAM};font-family:${DISPLAY};font-weight:800;font-size:15pt;letter-spacing:0.06em;text-transform:uppercase;padding:5pt 12pt;transform:rotate(-2deg);">Leader guide · {{weeks}} weeks</span>
</div>
<div style="position:absolute;left:0.6in;bottom:0.75in;width:4.3in;background:${INK};color:${CREAM};padding:12pt 14pt;transform:rotate(-1deg);">
  <p style="margin:0 0 4pt;font-family:${DISPLAY};font-weight:800;font-size:8pt;letter-spacing:0.14em;text-transform:uppercase;color:${P.green};">{{dates}} · {{audience}}</p>
  <p data-fit style="margin:0;height:0.62in;font-size:13pt;font-weight:600;line-height:1.3;">{{subtitle}}</p>
</div>
${svgLayer(finish)}
</div>`;

// ---------- Dividers ----------
// One template for every divider; the week number in the title ("Week 3" becomes classes "Week" and "3")
// lets the CSS below give each week its own composition: background, where the ghost word, title,
// ribbons, stars and badge sit. Colors and positions live in CSS (not inline) so each week can change them.
const WEEK_BADGES = [['pray', P.green], ['listen', P.yellow], ['eat', CREAM], ['serve', P.green], ['share', P.blue]];
const pcStar = (cls, ...args) => star(...args).replace('<polygon', `<polygon class="${cls}"`);
const divider = `<div class="pcdv {{title}}">
${svgLayer(`${DEFS}<path class="pc-band" d="M-40 -40 L900 -40 L900 210 C700 300 520 160 330 250 C180 320 60 260 -40 300 Z" fill="${P.red}" stroke="${INK}" stroke-width="3"/>
<g class="pc-ribbons">${ribbons('M-60 860 C160 700 300 980 520 820 C700 690 760 560 920 600', 3, 36)}</g>`)}
<div class="pc-ghost">{{title}}</div>
${svgLayer(`<g class="pc-stars">
${pcStar('pc-s1', 760, 360, 120, 10, P.green, 10)}
${pcStar('pc-s2', 90, 1040, 140, 9, P.blue, -4)}
${sparkle(130, 560, 30)}${sparkle(800, 760, 22)}</g>
<g class="pc-badges">${WEEK_BADGES.map(([key, color], i) => badge(key, color, 600, 846, 0.92, 9, `wk${i + 1}`)).join('')}
${star(690, 960, 92, 12, P.yellow, 0, 0.55).replace('<polygon', '<polygon class="wk0"')}</g>`)}
<div class="pc-echo">${echo('{{title}}', 17)}</div>
<div class="pc-kick">{{kicker}}</div>
<div class="pc-sub" data-fit><h1>{{subtitle}}</h1></div>
<div class="pc-title" data-fit><h1>{{title}}</h1></div>
<p class="pc-small">{{subtitle}}</p>
<p class="pc-idea" data-fit>{{idea}}</p>
${svgLayer(finish)}
</div>`;

// Per-week compositions. Week 1 is the base; 2–5 move and recolor the same pieces.
const dividerCss = [
  `.pcdv { position: relative; width: 8.5in; height: 11in; overflow: hidden; background: ${P.pink}; font-family: 'Inter Variable', sans-serif; }`,
  `.pcdv .pc-ghost { position: absolute; left: -0.25in; top: 2.15in; width: 7.2in; font-family: ${DISPLAY}; font-weight: 800; font-size: 230pt; line-height: 0.82; letter-spacing: -0.04em; text-transform: uppercase; color: ${INK}; opacity: 0.9; }`,
  `.pcdv .pc-echo { position: absolute; left: 0.6in; top: 0.55in; }`,
  `.pcdv .pc-kick { position: absolute; right: 0.6in; top: 0.62in; font-family: ${DISPLAY}; font-weight: 800; font-size: 8.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: ${CREAM}; }`,
  `.pcdv .pc-sub, .pcdv .pc-title { position: absolute; left: 0.6in; top: 5.35in; width: 7.1in; height: 2.2in; font-size: 76pt; display: flex; align-items: center; }`,
  `.pcdv .pc-title { font-size: 90pt; display: none; }`,
  `.pcdv h1 { margin: 0; font-family: ${DISPLAY}; font-size: 1em; font-weight: 800; line-height: 0.9; letter-spacing: -0.02em; text-transform: uppercase; color: ${CREAM}; text-shadow: 3pt 3pt 0 ${INK}; }`,
  `.pcdv .pc-small { display: none; position: absolute; left: 0.6in; top: 7.75in; margin: 0; background: ${INK}; color: ${CREAM}; padding: 6pt 12pt; font-family: ${DISPLAY}; font-weight: 800; font-size: 14pt; letter-spacing: 0.06em; text-transform: uppercase; transform: rotate(-1.5deg); }`,
  `.pcdv .pc-idea { position: absolute; left: 0.6in; top: 7.85in; width: 4.4in; height: 0.95in; margin: 0; background: ${INK}; color: ${CREAM}; padding: 12pt 14pt; transform: rotate(-1.2deg); font-size: 13pt; font-weight: 600; line-height: 1.35; }`,
  `.pcdv .pc-stars, .pcdv .pc-ribbons, .pcdv .pc-badges, .pcdv .pc-band { transform-box: view-box; transform-origin: 425px 550px; }`,
  // Leader guide and other non-week dividers: the title itself is the headline.
  `.pcdv:not(.Week) .pc-title { display: flex; }`,
  `.pcdv:not(.Week) .pc-small { display: block; }`,
  `.pcdv:not(.Week) .pc-sub { display: none; }`,
  // Badge switching.
  `.pcdv .wk1, .pcdv .wk2, .pcdv .wk3, .pcdv .wk4, .pcdv .wk5 { display: none; }`,
  ...[1, 2, 3, 4, 5].map((n) => `.pcdv[class~="${n}"] .wk${n} { display: inline; }`),
  `.pcdv.Week .wk0 { display: none; }`,
  // Week 2: blue, everything flipped: band at the bottom, title up top and right-aligned, ghost below.
  `.pcdv[class~="2"] { background: ${P.blue}; }`,
  `.pcdv[class~="2"] .pc-band { transform: scale(-1, -1); fill: ${P.pink}; }`,
  `.pcdv[class~="2"] .pc-ribbons { transform: scale(-1, -1); }`,
  `.pcdv[class~="2"] .pc-stars { transform: scale(-1, 1); }`,
  `.pcdv[class~="2"] .pc-s1 { fill: ${P.yellow}; }`,
  `.pcdv[class~="2"] .pc-s2 { fill: ${P.pink}; }`,
  `.pcdv[class~="2"] .pc-badges { transform: translate(-520px, -560px); }`,
  `.pcdv[class~="2"] .pc-ghost { top: 4.45in; left: auto; right: -0.15in; width: 8.6in; font-size: 196pt; text-align: right; }`,
  `.pcdv[class~="2"] .pc-sub { top: 1.35in; justify-content: flex-end; text-align: right; }`,
  `.pcdv[class~="2"] .pc-idea { top: 3.75in; left: auto; right: 0.6in; transform: rotate(1.2deg); }`,
  // Week 3: green, ghost runs up the right edge, title in the middle, badge bottom-left.
  `.pcdv[class~="3"] { background: ${P.green}; }`,
  `.pcdv[class~="3"] .pc-band { transform: scale(1, -1); }`,
  `.pcdv[class~="3"] .pc-ribbons { transform: translate(0, -420px) rotate(-8deg); }`,
  `.pcdv[class~="3"] .pc-s1 { fill: ${P.pink}; }`,
  `.pcdv[class~="3"] .pc-s2 { fill: ${P.blue}; }`,
  `.pcdv[class~="3"] .pc-stars { transform: translate(-560px, -40px); }`,
  `.pcdv[class~="3"] .pc-badges { transform: translate(-520px, 0); }`,
  `.pcdv[class~="3"] .pc-ghost { width: 11in; font-size: 200pt; left: 5.55in; top: 11.3in; transform: rotate(-90deg); transform-origin: top left; white-space: nowrap; }`,
  `.pcdv[class~="3"] .pc-sub { top: 3.2in; width: 5.2in; height: 3in; }`,
  `.pcdv[class~="3"] .pc-idea { top: 6.55in; width: 4.2in; }`,
  // Week 4: red, tilted ghost, centered title, badge top right.
  `.pcdv[class~="4"] { background: ${P.red}; }`,
  `.pcdv[class~="4"] .pc-band { fill: ${P.pink}; transform: translate(0, 840px) scale(1, 0.8); }`,
  `.pcdv[class~="4"] .pc-ribbons { transform: translate(0, -330px) scale(-1, 1); }`,
  `.pcdv[class~="4"] .pc-s1 { fill: ${P.yellow}; }`,
  `.pcdv[class~="4"] .pc-badges { transform: translate(10px, -600px); }`,
  `.pcdv[class~="4"] .pc-ghost { top: 1.45in; left: -0.5in; width: 9.5in; font-size: 205pt; text-align: center; transform: rotate(-7deg); }`,
  `.pcdv[class~="4"] .pc-sub { top: 4.75in; justify-content: center; text-align: center; }`,
  `.pcdv[class~="4"] .pc-idea { top: 7.35in; left: 2.05in; transform: rotate(1deg); }`,
  // Week 5: cream finale, dark title with a pink shadow.
  `.pcdv[class~="5"] { background: ${CREAM}; }`,
  `.pcdv[class~="5"] .pc-band { fill: ${P.pink}; transform: scale(-1, 1); }`,
  `.pcdv[class~="5"] .pc-ghost { color: ${P.red}; opacity: 1; top: 2.55in; }`,
  `.pcdv[class~="5"] h1 { color: ${INK}; text-shadow: 3pt 3pt 0 ${P.pink}; }`,
  `.pcdv[class~="5"] .pc-sub { top: 6.15in; }`,
  `.pcdv[class~="5"] .pc-idea { top: 8.45in; }`,
  `.pcdv[class~="5"] .pc-badges { transform: translate(-40px, -560px); }`,
  `.pcdv[class~="5"] .pc-stars { transform: scale(-1, 1); }`,
  `.pcdv[class~="5"] .pc-echo > div { color: ${INK} !important; text-shadow: 1.6pt 1.6pt 0 ${P.pink} !important; }`,
  `.pcdv[class~="5"] .pc-kick { color: ${INK}; }`,
].join('\n');

// ---------- Inside pages: the cover system, dialed down ----------
// Three motifs only: starbursts (bullets and accents), the swoop line (between parts), halftone strips
// (page furniture). Display face for titles, sticker chips for labels, cards for the plan and small group.
const starClip = (n, inner) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 50 * inner : 50;
    pts.push(`${f(50 + Math.cos(a) * r)}% ${f(50 + Math.sin(a) * r)}%`);
  }
  return `polygon(${pts.join(', ')})`;
};
const TINT = '#FCEFF6';
const STAR = starClip(10, 0.46);
const BULLET = starClip(8, 0.5);
const strip = (dot = INK, r = 0.95, cell = 3.6) => `radial-gradient(circle, ${dot} ${r}pt, transparent ${r + 0.25}pt) 0 0 / ${cell}pt ${cell}pt`;
const chip = (bg, fg = INK) => `display: table; background: ${bg}; color: ${fg}; border: 1.2pt solid ${INK}; font-family: ${DISPLAY}; font-weight: 800; font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1.25; padding: 2pt 5pt 1.5pt; transform: rotate(-2deg);`;
const card = `background: #FFFFFF; border: 1.5pt solid ${INK}; box-shadow: 4pt 4pt 0 ${P.pink}; border-radius: 0;`;
const SECTION_STARS = [P.green, P.blue, P.yellow, P.pink, P.green];
const css = [
  // Display face for every title.
  `.pr-head { border-bottom: 0; position: relative; padding: 5pt 0 18pt; }`
  ,`.pr-family-head { padding-top: 5pt; }`,
  `.pr-head h1, .pr-family-head h1 { font-family: ${DISPLAY}; font-weight: 800; text-transform: uppercase; letter-spacing: -0.035em; line-height: 0.88; font-size: 34pt; color: ${INK}; text-shadow: 2.5pt 2.5pt 0 ${P.pink}; }`,
  // Halftone strip as page furniture under every page title and section title.
  `.pr-head::after { content: ''; position: absolute; left: 0; right: 0; bottom: 3pt; height: 8pt; background: ${strip()}; }`,
  `.pr-eyebrow { ${chip(P.pink)} margin-bottom: 7pt !important; }`,
  `.pr-tag { ${chip(P.green)} display: inline-block; font-size: 7.5pt; max-width: 2.6in; }`,
  // Section titles: the big poster face, with a starburst committed to the word (overlapping its end).
  `.pr-sec-head { border-bottom: 0; position: relative; padding: 12pt 0 18pt; margin-bottom: 8pt; }`,
  `.pr-sec-head::after { content: ''; position: absolute; left: 0; right: 0; bottom: 4pt; height: 9pt; background: ${strip()}; }`,
  `.pr-sec-head h2 { display: inline-block; position: relative; z-index: 0; font-family: ${DISPLAY}; font-weight: 800; font-size: 42pt; line-height: 0.86; letter-spacing: -0.045em; text-transform: uppercase; color: ${INK}; text-shadow: 3pt 3pt 0 ${P.pink}; background: none; padding: 0 10pt 0 0; }`,
  `.pr-sec-head h2::after { content: ''; position: absolute; z-index: -1; right: -30pt; top: -4pt; width: 54pt; height: 54pt; background: ${P.green}; clip-path: ${STAR}; transform: rotate(-8deg); }`,
  ...SECTION_STARS.map((c, i) => `.pr-flow > .pr-sec:nth-child(5n+${i + 1}) .pr-sec-head h2::after { background: ${c}; transform: rotate(${i % 2 ? 14 : -8}deg); }`),
  // The swoop line between parts (an S-curve in a double red rule, like the cover ribbons).
  `.pr-p { border-top: 0; position: relative; padding-top: 22pt; }`,
  `.pr-p.first { padding-top: 6pt; }`,
  `.pr-p:not(.first)::before, .pr-p:not(.first)::after { content: ''; position: absolute; top: 2pt; width: 50%; height: 11pt; box-sizing: border-box; border: 0 double ${P.red}; }`,
  `.pr-p:not(.first)::before { left: 0; border-width: 6pt 6pt 0 6pt; border-radius: 50% 50% 0 0 / 100% 100% 0 0; }`,
  `.pr-p:not(.first)::after { left: calc(50% - 6pt); top: 13pt; width: calc(50% + 6pt); border-width: 0 6pt 6pt 6pt; border-radius: 0 0 50% 50% / 0 0 100% 100%; }`,
  `.pr-p.deeper { background: #FFFFFF; border: 1.5pt dashed ${INK}; border-radius: 0; }`,
  // Part titles and kinds.
  `.pr-p-head h3, .pr-weeks h3 { font-family: ${DISPLAY}; font-weight: 800; letter-spacing: -0.015em; }`,
  `.pr-p.point .pr-p-head h3 { font-size: 14pt; }`,
  `.pr-p-head { margin-bottom: 6pt; }`,
  `.pr-m { margin-bottom: 7pt; }`,
  `.pr-p-kind { ${chip(P.blue, '#FFFFFF')} margin-bottom: 5pt !important; }`,
  `.pr-p-num { color: ${INK}; background: ${P.green}; border: 1.3pt solid ${INK}; padding: 3pt 4pt 1pt; font-size: 22pt; transform: rotate(-3deg); display: inline-block; }`,
  // Margin labels become sticker chips, colored by what they introduce.
  `.pr-m-label { ${chip(INK, CREAM)} letter-spacing: 0.1em; padding-top: 2.5pt; }`,
  `.pr-m:has(.pr-say) .pr-m-label { background: ${P.pink}; color: ${INK}; transform: rotate(-3deg); }`,
  `.pr-m:has(.pr-questions) .pr-m-label { background: ${P.green}; color: ${INK}; transform: rotate(2deg); }`,
  `.pr-m:has(.pr-need) .pr-m-label { background: ${P.yellow}; color: ${INK}; }`,
  `.pr-m:has(.pr-reading) .pr-m-label, .pr-m:has(.pr-bigverse) .pr-m-label { background: ${P.blue}; color: #FFFFFF; transform: rotate(2deg); }`,
  `.pr-m.note .pr-m-label { background: ${CREAM}; color: ${INK}; }`,
  `.pr-m.note .pr-m-body, .pr-m.inclusion .pr-m-body { background: #FFFFFF; border: 1.2pt solid ${INK}; border-left-width: 1.2pt; border-radius: 0; }`,
  // Cue chips: the best interior detail, used more.
  `.pr-cue { ${chip(P.pink)} display: inline-block; font-size: 6.5pt; margin-right: 4pt; vertical-align: 1pt; transform: rotate(-1.5deg); }`,
  `.pr-lead { ${chip(INK, CREAM)} display: inline-block; font-size: 6.5pt; vertical-align: 1pt; margin-right: 3pt; }`,
  `.pr-lead + .pr-cue { transform: rotate(1.5deg); }`,
  // SAY blocks: a halftone strip in place of the pink rule, alternating color part to part,
  // and each teaching point lands on its last line in a black box (the family page's big-idea box).
  `.pr-say { border-left: 0; padding-left: 13pt; position: relative; }`,
  `.pr-say::before { content: ''; position: absolute; left: 0; top: 2pt; bottom: 2pt; width: 5.5pt; background: ${strip(P.pink, 1, 3.4)}; }`,
  `.pr-flow .pr-p:nth-of-type(even) .pr-say::before { background: ${strip(P.blue, 1, 3.4)}; }`,
  `.pr-p.point .pr-say > p:last-child { background: ${INK}; color: ${CREAM}; padding: 7pt 11pt; margin-top: 6pt; font-family: 'Inter Variable', sans-serif; font-weight: 600; font-size: 10.5pt; line-height: 1.45; transform: rotate(-0.6deg); }`,
  `.pr-p.point .pr-say > p:last-child .pr-direction { color: #CFC6D2; }`,
  `.pr-do p, .pr-do .pr-list li { color: #2A2430; }`,
  `.pr-say p, .pr-say .pr-list li { font-size: 10.5pt; line-height: 1.45; }`,
  // Starbursts as bullets.
  `.pr-list, .pr-bullets { list-style: none; padding-left: 0; }`,
  `.pr-list li, .pr-bullets li { position: relative; padding-left: 13pt; }`,
  `.pr-list li::before, .pr-bullets li::before { content: ''; position: absolute; left: 0; top: 0.32em; width: 8pt; height: 8pt; background: ${P.pink}; clip-path: ${BULLET}; }`,
  `.pr-list li:nth-child(even)::before, .pr-bullets li:nth-child(even)::before { background: ${P.blue}; }`,
  `.pr-reading { background: #FFFFFF; border: 1.5pt solid ${INK}; border-radius: 0; box-shadow: 4pt 4pt 0 ${P.blue}; }`,
  `.pr-questions .n { color: ${INK}; background: ${P.green}; border: 1.2pt solid ${INK}; text-align: center; font-size: 10pt !important; padding: 2pt 0 1pt; height: fit-content; }`,
  // Labels everywhere else are chips too.
  `.pr-label { ${chip(INK, CREAM)} margin-bottom: 7pt !important; }`,
  `.pr-sg-kicker { ${chip(P.pink)} font-size: 7.5pt; margin-bottom: 9pt !important; }`,
  `.pr-sg-kicker.warm { background: ${P.yellow}; color: ${INK}; }`,
  // Black boxes (from the family page) for the big idea and key verse.
  `.pr-sg-idea > div, .pr-family-strip { background: ${INK}; color: ${CREAM}; border-radius: 0; }`,
  `.pr-sg-idea > div:nth-child(2) { transform: rotate(0.8deg); }`,
  `.pr-sg-idea .pr-serif, .pr-family-strip p { color: ${CREAM}; }`,
  `.pr-sg-idea .pr-label { background: ${P.pink}; color: ${INK}; }`,
  `.pr-family-strip { position: relative; }`,
  `.pr-family-strip::after { content: ''; position: absolute; right: -8pt; top: -26pt; width: 44pt; height: 44pt; background: ${P.green}; clip-path: ${STAR}; transform: rotate(12deg); }`,
  // The family card language, applied to the family page, the small group guide and the session plan.
  `.pr-family-card, .pr-sg-close > div, .pr-roles > div, .pr-sg-open, .pr-sg-questions, .pr-plan .pr-row, .pr-side-verse, .pr-prep, .pr-notes { ${card} padding: 10pt 13pt 11pt; }`,
  `.pr-family-card-head span, .pr-role-icon, .pr-ico { display: none; }`,
  `.pr-family-card-head b { ${chip(P.pink)} display: inline-block; font-size: 8pt; }`,
  `.pr-sg-questions ol { border-top: 0; }`,
  `.pr-sg-questions li:last-child { border-bottom: 0; }`,
  `.pr-sg-questions span { color: ${INK}; background: ${P.green}; border: 1.2pt solid ${INK}; font-size: 13pt; text-align: center; padding: 3pt 0 1pt; height: fit-content; }`,
  `.pr-sg-notes { background: ${TINT}; border: 1.2pt dashed ${INK}; border-radius: 0; }`,
  `.pr-sg-open { margin-bottom: 12pt; }`,
  `.pr-sg-open .pr-serif { font-size: 12pt; }`,
  `.pr-sg-questions li { padding: 4.5pt 0; }`,
  `.pr-sg-questions p { font-size: 10.5pt; line-height: 1.38; }`,
  `.pr-sg-idea { margin-bottom: 12pt; }`,
  `.pr-sg-idea > div { padding: 9pt 12pt; }`,
  `.pr-sg-idea .pr-serif { font-size: 11.5pt; }`,
  `.pr-sg-notes { padding: 7pt 11pt; margin-bottom: 12pt; font-size: 8.5pt; }`,
  `.pr-sg-close { margin-bottom: 8pt; }`,
  `.pr-sg-pray { font-size: 10.5pt !important; line-height: 1.4 !important; }`,
  `.pr-sg .pr-head { margin-bottom: 12pt; }`,
  `.pr-sg-questions { margin-bottom: 12pt; }`,
  `.pr-sg-close > div:nth-child(2) { box-shadow: 4pt 4pt 0 ${P.green}; }`,
  `.pr-row { display: block; margin-bottom: 12pt !important; }`,
  `.pr-row-body h4 { ${chip(P.pink)} font-size: 8pt; margin: 0 0 8pt; }`,
  `.pr-row.inclusion h4, .pr-row.note h4 { color: ${INK}; }`,
  `.pr-plan .pr-row:nth-child(2) { box-shadow: 4pt 4pt 0 ${P.green}; }`,
  `.pr-plan .pr-row:nth-child(3) { box-shadow: 4pt 4pt 0 ${P.blue}; }`,
  `.pr-side-verse { margin-bottom: 14pt; }`,
  `.pr-side-verse .pr-serif { color: ${INK}; }`,
  `.pr-engage { background: ${INK}; border-radius: 0; transform: rotate(-0.6deg); margin-bottom: 16pt; }`,
  `.pr-engage .pr-label { background: ${P.green}; color: ${INK}; }`,
  `.pr-prep { margin-bottom: 14pt; }`,
  `.pr-notes { box-shadow: 4pt 4pt 0 ${P.yellow}; }`,
  // "Inside each week" cards: stamped numbers instead of icons; the symbol key is dropped.
  `.pr-roles { counter-reset: pc-role; }`,
  `.pr-roles > div::before { counter-increment: pc-role; content: '0' counter(pc-role); ${chip(P.pink)} display: inline-block; font-size: 18pt; letter-spacing: -0.02em; padding: 3pt 6pt 1pt; transform: rotate(-3deg); }`,
  `.pr-roles > div:nth-child(2)::before { background: ${P.green}; }`,
  `.pr-roles > div:nth-child(3)::before { background: ${P.yellow}; }`,
  `.pr-label:has(+ .pr-legend), .pr-legend { display: none; }`,
  `.pr-weeks .n { color: ${INK}; font-family: ${DISPLAY}; }`,
  `.pr-ov-sec { border-right-color: ${P.pink}; }`,
  `.pr-ov-sec span { color: ${INK}; }`,
].join('\n');

const pack = {
  id: 'poster-club-v1',
  name: 'Poster Club',
  description: 'Type-led posters: a giant ghost title behind a crisp one, swooping ribbons, spiky stars and small halftone sticker badges at the edges, printed-paper grain.',
  design: {
    palette: { paper: '#FCEFF6', ink: INK, accent: '#D4157F', secondary: P.green, muted: '#6B6470', deep: INK },
    type: { display: 'jakarta', body: 'sans', label: 'sans', headingCase: 'normal' },
    page: { corners: 'square', headerRule: 'heavy', mark: 'none' },
    components: { questions: 'numbers', scripture: 'rule' },
  },
  cover,
  divider,
  css: `${css}\n${dividerCss}`,
};

const out = process.argv[2];
writeFileSync(out, JSON.stringify(pack, null, 2) + '\n');
console.log('wrote', out, 'cover', cover.length, 'divider', divider.length, 'css', css.length);
