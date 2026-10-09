// Builds the "Proof Sheet" layout: a technical print-proof look. A module grid on pale gray and white,
// diagonal hatching (dense black, wide pale gray, thin cyan), crop marks, + crosshairs, small squares,
// black label bars in mono, a big geometric number per week, and a slight RGB misregistration on the blacks.
import { writeFileSync } from 'node:fs';

const INK = '#1C1A1D';
const GRAY = '#EEECEF';
const PALE = '#E2E0E4';
const CYAN = '#3FD6E6';
const PINK = '#FF5FA8';
const GROT = "'Space Grotesk Variable', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// Columns on the 850 × 1100 page.
const COL = [[-10, 160], [172, 334], [346, 508], [520, 682]];
const cx = (i) => COL[i][0];
const cw = (i) => COL[i][1] - COL[i][0];

const diag = (t) => `M${-t / 4} ${t / 4} L${t / 4} ${-t / 4} M0 ${t} L${t} 0 M${t - t / 4} ${t + t / 4} L${t + t / 4} ${t - t / 4}`;
const hatchTile = (id, t, w, color, extra = '') =>
  `<pattern id="${id}" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><path d="${diag(t)}" stroke="${color}" stroke-width="${w}"/>${extra}</pattern>`;
const DEFS = `<defs>
${hatchTile('pfH', 7, 2.4, INK)}
${hatchTile('pfHc', 7, 2.4, CYAN)}
${hatchTile('pfHp', 7, 2.4, PINK)}
${hatchTile('pfW', 26, 9, PALE)}
<pattern id="pfT" width="26" height="26" patternUnits="userSpaceOnUse"><path d="${diag(26)}" stroke="${PALE}" stroke-opacity="0.75" stroke-width="9"/><path d="${diag(26)}" transform="translate(9 0)" stroke="${CYAN}" stroke-width="0.9"/></pattern>
</defs>`;

// Black shapes print slightly off-register: a cyan copy nudged left and a pink copy nudged right underneath.
const mis = (shape) =>
  `<g transform="translate(-1.6 0)" opacity="0.85">${shape.replaceAll(INK, CYAN).replaceAll('url(#pfH)', 'url(#pfHc)')}</g>` +
  `<g transform="translate(1.6 0.8)" opacity="0.85">${shape.replaceAll(INK, PINK).replaceAll('url(#pfH)', 'url(#pfHp)')}</g>${shape}`;

const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const plus = (x, y, s = 5, c = INK) => `<path d="M${x - s} ${y} H${x + s} M${x} ${y - s} V${y + s}" stroke="${c}" stroke-width="1.4"/>`;
const sq = (x, y, s = 9, filled = false) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${filled ? INK : 'none'}" stroke="${INK}" stroke-width="1.3"/>`;
// Crop marks at the four corners of a box.
const crops = (x, y, w, h, l = 9) => {
  const m = (px, py, dx, dy) => `<path d="M${px + dx * l} ${py} H${px} V${py + dy * l}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
  return m(x, y, 1, 1) + m(x + w, y, -1, 1) + m(x, y + h, 1, -1) + m(x + w, y + h, -1, -1);
};
// A black block with its bottom-right corner cut.
const cutBlock = (x, y, w, h, c = 26) => `<path d="M${x} ${y} H${x + w} V${y + h - c} L${x + w - c} ${y + h} H${x} Z" fill="${INK}"/>`;
// A black label bar: "002 ◻■" (the text is HTML on top, placed by the template).
const bar = (x, y, w) => mis(rect(x, y, w, 17, INK)) + sq(x + w - 26, y + 4.5, 7) .replaceAll(INK, '#FFFFFF') + `<rect x="${x + w - 14}" y="${y + 4.5}" width="7" height="7" fill="#FFFFFF"/>`;

const svg = (inner) => `<svg viewBox="0 0 850 1100" style="position:absolute;left:0;top:0;width:8.5in;height:11in">${inner}</svg>`;
const at = (x, y, style, html) => `<div style="position:absolute;left:${(x / 100).toFixed(2)}in;top:${(y / 100).toFixed(2)}in;${style}">${html}</div>`;
const mono = (size, extra = '') => `font-family:${MONO};font-weight:600;font-size:${size}pt;letter-spacing:0.04em;${extra}`;
const rgb = 'text-shadow:-1.2pt 0 0 rgba(63,214,230,0.85), 1.2pt 0.5pt 0 rgba(255,95,168,0.85);';

// ---------- Cover ----------
const cover = `<div style="position:relative;width:8.5in;height:11in;overflow:hidden;background:#FFFFFF;">
${svg(`${DEFS}
<path d="M0 0 H770 V540 H508 V720 H346 V540 H0 Z" fill="${GRAY}"/>
${rect(0, 470, cx(1), 70, 'url(#pfW)')}
${rect(0, 540, cx(1) + cw(0), 52, 'url(#pfT)')}
${mis(rect(cx(1), 96, cw(1), 5, INK))}
${[142, 172, 202].map((y) => mis(rect(136, y, 14, 6, INK))).join('')}
${mis(rect(cx(1), 212, cw(1), 12, INK))}
${mis(rect(cx(2), 196, cw(2), 24, 'url(#pfH)'))}
${mis(rect(cx(2), 230, cw(2), 11, 'url(#pfH)'))}
${mis(rect(cx(3), 230, cw(3), 11, 'url(#pfH)'))}
${mis(rect(0, 230, cx(0) + cw(0) + 10, 112, 'url(#pfH)'))}
${mis(rect(136, 245, 13, 13, INK))}
${mis(cutBlock(cx(1), 230, cw(1), 112))}
${plus(cx(1) + cw(1) / 2, 286, 5, '#FFFFFF')}
${rect(cx(2), 250, cw(2), 92, 'url(#pfW)')}
${plus(cx(2) + cw(2) - 12, 262)}${sq(cx(2) + cw(2) / 2 - 5, 338)}
${rect(cx(3), 345, cw(3), 112, 'url(#pfW)')}${plus(cx(3) + cw(3) / 2, 342)}
${crops(cx(3), 345, cw(3), 112)}
${bar(cx(1), 462, cw(1))}
${crops(cx(2), 462, cw(2), 300)}
${mis(rect(cx(3), 512, cw(3), 22, 'url(#pfH)'))}
${rect(cx(1), 590, 850 - cx(1), 105, 'url(#pfT)')}
${sq(244, 575)}
${crops(cx(1), 590, cw(1), 105)}${crops(cx(3), 590, cw(3), 105)}
${bar(cx(2), 726, cw(2))}
${rect(cx(3), 745, cw(3), 108, 'url(#pfT)')}${plus(cx(3) + cw(3) / 2, 852)}
${rect(cx(2), 860, cw(2), 112, 'url(#pfW)')}
${crops(cx(1), 860, cw(1), 112)}${crops(cx(2), 860, cw(2), 112)}
<path d="M690 925 h7 v-7 M712 925 h-7 v-7 M690 932 h7 v7 M712 932 h-7 v7" fill="none" stroke="${INK}" stroke-width="1.3"/>
${rect(0, 1010, 334, 26, GRAY)}${rect(0, 1009, 334, 1.2, CYAN)}
${mis(rect(262, 1022, 240, 2, INK))}`)}
${at(cx(1) + 6, 464, `${mono(7)}color:#FFFFFF;line-height:13pt;`, 'Leader guide')}
${at(cx(2) + 8, 255, `${mono(7)}color:${INK};`, 'For {{audience}}')}
<div data-fit style="position:absolute;left:1.62in;top:5.95in;width:5.3in;height:1.25in;font-size:92pt;display:flex;align-items:center;">
  <h1 style="margin:0;font-family:${GROT};font-weight:600;font-size:1em;line-height:0.9;letter-spacing:-0.03em;color:${INK};${rgb}">{{title}}</h1>
</div>
${at(cx(2) + 6, 728, `${mono(7)}color:#FFFFFF;line-height:13pt;`, '+{{weeks}} weeks')}
${at(cx(2) + 6, 700, `${mono(6.5)}color:${INK};`, '{{dates}}')}
<p data-fit style="position:absolute;left:0.2in;top:8.72in;width:3.05in;height:0.95in;margin:0;font-family:${GROT};font-weight:500;font-size:13pt;line-height:1.3;color:${INK};">{{subtitle}}</p>
<p data-fit style="position:absolute;left:5.3in;top:7.55in;width:1.45in;height:0.9in;margin:0;${mono(6.5)}line-height:1.45;color:${INK};">{{verse}}</p>
${at(155, 1012, `font-family:${GROT};font-weight:700;font-size:10pt;color:${INK};`, 'Leader guide')}
${at(560, 1013, `${mono(7.5)}color:${INK};text-transform:uppercase;`, 'Series / {{weeks}} wk % {{audience}}')}
</div>`;

// ---------- Dividers ----------
// The title ("Week 3" → classes "Week" and "3") lets the CSS swap the big number and move the modules per week.
const divider = `<div class="pfdv {{title}}">
${svg(`${DEFS}
<path class="pf-field" d="M0 0 H770 V520 H508 V700 H346 V520 H0 Z" fill="${GRAY}"/>
<g class="pf-a">
${mis(rect(cx(1), 96, cw(1), 5, INK))}
${[142, 172, 202].map((y) => mis(rect(136, y, 14, 6, INK))).join('')}
${mis(rect(0, 230, cx(0) + cw(0) + 10, 112, 'url(#pfH)'))}
${mis(rect(cx(2), 230, cw(2), 11, 'url(#pfH)'))}${mis(rect(cx(3), 230, cw(3), 11, 'url(#pfH)'))}
${rect(cx(2), 250, cw(2), 92, 'url(#pfW)')}${plus(cx(2) + cw(2) - 12, 262)}
${rect(cx(3), 345, cw(3), 112, 'url(#pfW)')}${crops(cx(3), 345, cw(3), 112)}
</g>
<g class="pf-b">
${rect(0, 560, 850, 100, 'url(#pfT)')}
${crops(cx(1), 560, cw(1), 100)}${crops(cx(2), 560, cw(2), 100)}${sq(cx(2) - 30, 540)}
${rect(cx(3), 690, cw(3), 108, 'url(#pfT)')}${plus(cx(3) + cw(3) / 2, 797)}
${rect(cx(2), 820, cw(2), 112, 'url(#pfW)')}${crops(cx(2), 820, cw(2), 112)}
</g>
<path d="M690 985 h7 v-7 M712 985 h-7 v-7 M690 992 h7 v7 M712 992 h-7 v7" fill="none" stroke="${INK}" stroke-width="1.3"/>
${rect(0, 1010, 334, 26, GRAY)}${rect(0, 1009, 334, 1.2, CYAN)}
${mis(rect(262, 1022, 240, 2, INK))}`)}
<div class="pf-blk">
${svg(`${mis(cutBlock(cx(1), 230, cw(1), 112))}${plus(cx(1) + cw(1) / 2, 286, 5, '#FFFFFF')}`)}
</div>
<div class="pf-num"></div>
<div class="pf-bar"><span>{{title}}</span><i></i><b></b></div>
<div class="pf-kick">{{kicker}}</div>
<div class="pf-sub" data-fit><h1>{{subtitle}}</h1></div>
<div class="pf-title" data-fit><h1>{{title}}</h1></div>
<p class="pf-idea" data-fit>{{idea}}</p>
<div class="pf-foot">Leader guide</div>
<div class="pf-code">{{kicker}}</div>
</div>`;

const N = [1, 2, 3, 4, 5];
const dividerCss = [
  `.pfdv { position: relative; width: 8.5in; height: 11in; overflow: hidden; background: #FFFFFF; }`,
  `.pfdv .pf-blk { position: absolute; inset: 0; }`,
  `.pfdv .pf-num { position: absolute; left: 3.3in; top: 4.6in; font-family: ${GROT}; font-weight: 600; font-size: 168pt; line-height: 1; letter-spacing: -0.05em; color: ${INK}; ${rgb} }`,
  `.pfdv .pf-num::before { content: '+00'; }`,
  ...N.map((n) => `.pfdv[class~="${n}"] .pf-num::before { content: '+0${n}'; }`),
  `.pfdv .pf-bar { position: absolute; left: 3.46in; top: 7.0in; width: 1.62in; height: 17px; background: ${INK}; color: #FFFFFF; display: flex; align-items: center; gap: 4pt; padding: 0 6pt; box-sizing: border-box; ${MONO.length ? '' : ''}font-family: ${MONO}; font-weight: 600; font-size: 7pt; letter-spacing: 0.06em; text-transform: uppercase; box-shadow: -1.6px 0 0 rgba(63,214,230,0.85), 1.6px 0.8px 0 rgba(255,95,168,0.85); }`,
  `.pfdv .pf-bar span { flex: 1; }`,
  `.pfdv .pf-bar i, .pfdv .pf-bar b { width: 6px; height: 6px; border: 1.2px solid #FFFFFF; }`,
  `.pfdv .pf-bar b { background: #FFFFFF; }`,
  `.pfdv .pf-kick { position: absolute; left: 3.54in; top: 2.56in; font-family: ${MONO}; font-weight: 600; font-size: 7pt; letter-spacing: 0.04em; color: ${INK}; text-transform: uppercase; width: 1.4in; line-height: 1.5; }`,
  `.pfdv .pf-sub { position: absolute; left: 1.72in; top: 3.62in; width: 3.3in; height: 0.95in; font-size: 30pt; display: flex; align-items: flex-end; }`,
  `.pfdv h1 { margin: 0; font-family: ${GROT}; font-weight: 600; font-size: 1em; line-height: 0.95; letter-spacing: -0.02em; color: ${INK}; }`,
  `.pfdv .pf-idea { position: absolute; left: 1.82in; top: 8.3in; width: 1.42in; height: 0.95in; margin: 0; font-family: ${GROT}; font-weight: 500; font-size: 9.5pt; line-height: 1.35; color: ${INK}; }`,
  `.pfdv .pf-foot { position: absolute; left: 1.55in; top: 10.12in; font-family: ${GROT}; font-weight: 700; font-size: 10pt; color: ${INK}; }`,
  `.pfdv .pf-code { position: absolute; left: 5.6in; top: 10.13in; font-family: ${MONO}; font-weight: 600; font-size: 7pt; color: ${INK}; text-transform: uppercase; }`,
  `.pfdv .pf-a, .pfdv .pf-b, .pfdv .pf-field { transform-box: view-box; transform-origin: 425px 550px; }`,
  // Leader guide divider: the title becomes the headline.
  `.pfdv .pf-title { display: none; position: absolute; left: 1.72in; top: 3.62in; width: 3.3in; height: 0.95in; font-size: 40pt; align-items: flex-end; }`,
  `.pfdv:not(.Week) .pf-title { display: flex; }`,
  `.pfdv:not(.Week) .pf-sub { display: none; }`,
  // Week 2: mirrored grid, number on the left.
  `.pfdv[class~="2"] .pf-field, .pfdv[class~="2"] .pf-a { transform: scale(-1, 1); }`,
  `.pfdv[class~="2"] .pf-blk { transform: translate(3.48in, 0); }`,
  `.pfdv[class~="2"] .pf-num { left: 0.5in; }`,
  `.pfdv[class~="2"] .pf-bar { left: 1.72in; }`,
  `.pfdv[class~="2"] .pf-sub { left: 3.46in; }`,
  `.pfdv[class~="2"] .pf-kick { left: 1.8in; }`,
  // Week 3: everything drops; number high on the right.
  `.pfdv[class~="3"] .pf-field { transform: scale(1, -1); }`,
  `.pfdv[class~="3"] .pf-a { transform: translate(0, 480px); }`,
  `.pfdv[class~="3"] .pf-b { transform: translate(0, -470px); }`,
  `.pfdv[class~="3"] .pf-blk { transform: translate(0, 4.8in); }`,
  `.pfdv[class~="3"] .pf-num { top: 0.7in; left: 3.6in; }`,
  `.pfdv[class~="3"] .pf-bar { top: 3.0in; left: 5.2in; }`,
  `.pfdv[class~="3"] .pf-sub { top: 8.5in; left: 3.46in; }`,
  `.pfdv[class~="3"] .pf-kick { top: 7.3in; }`,
  `.pfdv[class~="3"] .pf-idea { top: 4.0in; left: 5.28in; }`,
  // Week 4: tight, centered column of modules; big number low.
  `.pfdv[class~="4"] .pf-a { transform: translate(174px, 0); }`,
  `.pfdv[class~="4"] .pf-blk { transform: translate(1.74in, 0); }`,
  `.pfdv[class~="4"] .pf-num { top: 7.6in; left: 0.3in; }`,
  `.pfdv[class~="4"] .pf-bar { top: 5.6in; left: 5.2in; }`,
  `.pfdv[class~="4"] .pf-sub { left: 0.2in; top: 3.62in; width: 3.2in; }`,
  `.pfdv[class~="4"] .pf-idea { left: 5.28in; top: 6.0in; }`,
  // Week 5: both flips, the finale.
  `.pfdv[class~="5"] .pf-field, .pfdv[class~="5"] .pf-a, .pfdv[class~="5"] .pf-b { transform: scale(-1, -1); }`,
  `.pfdv[class~="5"] .pf-blk { transform: translate(3.48in, 5.2in); }`,
  `.pfdv[class~="5"] .pf-num { top: 1.1in; left: 0.5in; }`,
  `.pfdv[class~="5"] .pf-bar { top: 3.3in; left: 1.72in; }`,
  `.pfdv[class~="5"] .pf-sub { top: 3.9in; left: 3.46in; }`,
  `.pfdv[class~="5"] .pf-idea { top: 6.4in; left: 5.28in; }`,
].join('\n');

// ---------- Inside pages: calm, same vocabulary ----------
const cropBg = (c = INK, l = 7) => [
  `linear-gradient(${c},${c}) top left / ${l}pt 1pt`, `linear-gradient(${c},${c}) top left / 1pt ${l}pt`,
  `linear-gradient(${c},${c}) top right / ${l}pt 1pt`, `linear-gradient(${c},${c}) top right / 1pt ${l}pt`,
  `linear-gradient(${c},${c}) bottom left / ${l}pt 1pt`, `linear-gradient(${c},${c}) bottom left / 1pt ${l}pt`,
  `linear-gradient(${c},${c}) bottom right / ${l}pt 1pt`, `linear-gradient(${c},${c}) bottom right / 1pt ${l}pt`,
].map((g) => `${g} no-repeat`).join(', ');
const hatch = `repeating-linear-gradient(-45deg, ${INK} 0 1.6pt, transparent 1.6pt 4.2pt)`;
const labelBar = `display: inline-block; background: ${INK}; color: #FFFFFF; font-family: ${MONO}; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.35; border-radius: 0; box-shadow: -1.2px 0 0 rgba(63,214,230,0.8), 1.2px 0.6px 0 rgba(255,95,168,0.8);`;
const css = [
  `.pr-head { border-bottom: 0; position: relative; padding-bottom: 14pt; }`,
  `.pr-head::after { content: ''; position: absolute; left: 0; right: 0; bottom: 2pt; height: 7pt; background: ${hatch}; }`,
  `.pr-head h1, .pr-family-head h1 { font-family: ${GROT}; font-weight: 600; letter-spacing: -0.025em; }`,
  `.pr-eyebrow, .pr-p-kind, .pr-sg-kicker, .pr-label { font-family: ${MONO}; font-weight: 600; letter-spacing: 0.05em; color: ${INK}; }`,
  `.pr-sec-head { border-bottom: 0; position: relative; padding-bottom: 13pt; }`,
  `.pr-sec-head::after { content: ''; position: absolute; left: 0; right: 0; bottom: 2pt; height: 6pt; background: ${hatch}; }`,
  `.pr-sec-head .pr-eyebrow { ${labelBar} font-size: 6.5pt; padding: 2pt 6pt; margin-bottom: 6pt !important; }`,
  `.pr-sec-head h2 { font-family: ${GROT}; font-weight: 600; font-size: 30pt; letter-spacing: -0.03em; color: ${INK}; }`,
  `.pr-p { border-top: 0.75pt solid ${PALE}; }`,
  `.pr-p-head h3, .pr-weeks h3 { font-family: ${GROT}; font-weight: 600; letter-spacing: -0.015em; }`,
  `.pr-p-num { font-family: ${GROT}; font-weight: 600; color: ${INK}; letter-spacing: -0.04em; }`,
  `.pr-p-num::before { content: '+'; }`,
  `.pr-m-label { ${labelBar} font-size: 6pt; padding: 1.5pt 4pt; }`,
  `.pr-cue { display: inline-block; background: transparent; color: ${INK}; border: 1pt solid ${INK}; border-radius: 0; font-family: ${MONO}; font-weight: 600; font-size: 6.5pt; letter-spacing: 0.04em; padding: 1pt 4pt; }`,
  `.pr-say { border-left: 1.5pt solid ${INK}; }`,
  `.pr-reading { background: #FFFFFF; border-radius: 0; background-image: none; padding: 12pt 14pt; box-shadow: none; }`,
  `.pr-reading, .pr-family-card, .pr-sg-close > div, .pr-roles > div { border: 0; border-radius: 0; background: ${cropBg()}; }`,
  `.pr-tag { ${labelBar} }`,
  `.pr-sg-idea > div, .pr-family-strip { background: ${INK}; color: #FFFFFF; border-radius: 0; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 14pt), calc(100% - 14pt) 100%, 0 100%); }`,
  `.pr-sg-idea .pr-serif, .pr-family-strip p { color: #FFFFFF; font-family: ${GROT}; }`,
  `.pr-sg-idea .pr-label { color: ${CYAN}; }`,
  `.pr-sg-questions ol { border-top: 1.5pt solid ${INK}; }`,
  `.pr-sg-questions span, .pr-questions .n { font-family: ${GROT}; font-weight: 600; color: ${INK}; }`,
  `.pr-sg-notes { background: repeating-linear-gradient(-45deg, ${GRAY} 0 6pt, #FFFFFF 6pt 12pt); border-radius: 0; }`,
  `.pr-weeks .n { font-family: ${GROT}; color: ${INK}; }`,
  `.pr-weeks { border-top: 1.5pt solid ${INK}; }`,
  `.pr-list li::marker, .pr-bullets li::marker { content: '+  '; color: ${INK}; font-family: ${MONO}; }`,
  // No stock icons.
  `.pr-role-icon, .pr-ico, .pr-family-card-head span { display: none; }`,
  `.pr-roles { counter-reset: pf-role; }`,
  `.pr-roles > div::before { counter-increment: pf-role; content: '00' counter(pf-role); ${labelBar} font-size: 7pt; padding: 1.5pt 5pt; }`,
  `.pr-label:has(+ .pr-legend), .pr-legend { display: none; }`,
  `.pr-row { display: block; }`,
  `.pr-row-body h4 { font-family: ${MONO}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 8pt; }`,
  `.pr-row.inclusion h4, .pr-row.note h4 { color: ${INK}; }`,
  `.pr-family-card-head b { font-family: ${MONO}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 9pt; }`,
  `.pr-ov-sec { border-right-color: ${INK}; }`,
  `.pr-ov-sec span { color: ${INK}; font-family: ${MONO}; }`,
].join('\n');

const pack = {
  id: 'proof-sheet-v1',
  name: 'Proof Sheet',
  description: 'Technical print-proof look: module grid, diagonal hatching, crop marks, black label bars, a big number per week, slight RGB misregistration.',
  design: {
    palette: { paper: '#FFFFFF', ink: INK, accent: INK, secondary: CYAN, muted: '#6B6870', deep: INK },
    type: { display: 'grotesk', body: 'sans', label: 'mono', headingCase: 'normal' },
    page: { corners: 'square', headerRule: 'heavy', mark: 'none' },
    components: { questions: 'numbers', scripture: 'rule' },
  },
  cover,
  divider,
  css: `${css}\n${dividerCss}`,
};

const out = process.argv[2];
writeFileSync(out, JSON.stringify(pack, null, 2) + '\n');
console.log('wrote', out, 'cover', cover.length, 'divider', divider.length, 'css', pack.css.length);
