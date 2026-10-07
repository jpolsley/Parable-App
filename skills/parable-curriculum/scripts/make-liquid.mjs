// "Liquid Frame" cover: a strict, symmetric frame of small bold caps, rules, crop marks and a tiny emblem,
// around one wild element: the series title, melting into ink ribbons and drips in a sea of white.
import { writeFileSync } from 'node:fs';

const INK = '#141214';
const SANS = "'Inter Variable', sans-serif";
const DISPLAY = "'Plus Jakarta Sans Variable', sans-serif";

const cap = (size, weight = 700) => `font-family:${SANS};font-weight:${weight};font-size:${size}pt;line-height:1.1;letter-spacing:-0.01em;text-transform:uppercase;color:${INK};`;
const box = (left, top, width, style, html, align = 'left') =>
  `<div style="position:absolute;left:${left}in;top:${top}in;width:${width}in;text-align:${align};${style}">${html}</div>`;

// An outlined ink ribbon: a thick black stroke with a thinner white stroke inside it.
const ribbon = (d, w = 22, inner = 15) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${inner}" stroke-linecap="round" stroke-linejoin="round"/>`;
// A drip hanging from (x, y), length h.
const drip = (x, y, h, w = 8) =>
  `<path d="M${x - w} ${y} C${x - w} ${y + h * 0.45} ${x - w * 0.55} ${y + h * 0.7} ${x - w * 0.55} ${y + h * 0.82} A${w * 0.62} ${w * 0.62} 0 1 0 ${x + w * 0.55} ${y + h * 0.82} C${x + w * 0.55} ${y + h * 0.7} ${x + w} ${y + h * 0.45} ${x + w} ${y} Z" fill="${INK}"/>`;
const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
const ring = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/>`;
// The small pill with a cross inside, used either side of the center rule.
const pill = (cx, cy) =>
  `<rect x="${cx - 34}" y="${cy - 17}" width="68" height="34" rx="17" fill="none" stroke="${INK}" stroke-width="2"/><path d="M${cx} ${cy - 10} V${cy + 10} M${cx - 7} ${cy - 3} H${cx + 7}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
const crop = (x, y, dx, dy, l = 18) => `<path d="M${x + dx * l} ${y} H${x} V${y + dy * l}" fill="none" stroke="${INK}" stroke-width="2"/>`;
// Bottom-center emblem: a circle with a cross and four petals.
const emblem = (cx, cy) =>
  `<circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="${INK}" stroke-width="2"/>` +
  `<path d="M${cx} ${cy - 15} Q${cx + 2.5} ${cy - 2.5} ${cx + 15} ${cy} Q${cx + 2.5} ${cy + 2.5} ${cx} ${cy + 15} Q${cx - 2.5} ${cy + 2.5} ${cx - 15} ${cy} Q${cx - 2.5} ${cy - 2.5} ${cx} ${cy - 15} Z" fill="${INK}"/>`;

// Glossy ink: a thick black stroke with a thin white highlight riding along part of it.
const ink = (d, w, hl = true) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
  (hl ? `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${Math.max(2, w * 0.14)}" stroke-linecap="round" stroke-dasharray="${w * 2.2} ${w * 5}" stroke-dashoffset="${w}" transform="translate(${-w * 0.18} ${-w * 0.2})"/>` : '');
const gloss = (x, y, r) => dot(x, y, r) + `<circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#FFFFFF"/>`;

// Behind the title: an ink stream rising out of the first letter, arcing over the word and spilling off
// the last one, a clear "glass" loop at the left, and splashes.
const behind = [
  ink('M160 500 C150 452 196 420 248 438 C296 456 322 418 372 416 C424 414 446 456 498 450 C548 444 566 404 618 408 C668 412 692 452 724 470', 19),
  ink('M724 470 C752 486 764 520 748 552 C736 576 714 572 712 556', 14),
  ribbon('M168 560 C120 556 92 520 106 488 C118 462 152 466 156 488 C158 500 148 506 140 500', 15, 10),
  ink('M560 410 C572 386 600 380 612 396', 8, false),
  gloss(300, 398, 9), gloss(330, 384, 4.5), gloss(590, 376, 7), dot(454, 404, 4), gloss(690, 432, 5),
].join('');
// In front: a molten puddle along the baseline, drips of different lengths hanging from it, droplets.
const front = [
  `<path d="M150 612 C190 606 220 622 262 616 C310 609 340 626 392 618 C444 610 470 628 520 620 C566 613 600 626 650 617 C690 610 716 620 744 614 C734 632 700 634 668 630 C620 624 590 640 540 636 C492 632 462 644 410 638 C360 632 330 644 282 636 C238 629 206 640 166 632 Z" fill="${INK}"/>`,
  drip(206, 628, 62, 10), drip(318, 632, 34, 7), drip(452, 634, 80, 11), drip(566, 632, 44, 8), drip(676, 628, 56, 9),
  gloss(452, 738, 7), gloss(206, 712, 5), dot(612, 668, 3.5), dot(262, 664, 3), gloss(724, 696, 5.5), dot(372, 676, 2.6),
  `<path d="M262 618 C270 600 290 600 298 616" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`,
  `<path d="M496 622 C506 606 528 606 536 620" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`,
].join('');

const svg = (inner, z = 0) => `<svg viewBox="0 0 850 1100" style="position:absolute;left:0;top:0;width:8.5in;height:11in;z-index:${z}">${inner}</svg>`;

const cover = `<div style="position:relative;width:8.5in;height:11in;overflow:hidden;background:#FFFFFF;">
${svg(`
${pill(102, 222)}${pill(748, 222)}
<rect x="152" y="221" width="104" height="2" fill="${INK}"/><rect x="594" y="221" width="104" height="2" fill="${INK}"/>
${crop(68, 318, 1, 1)}${crop(782, 318, -1, 1)}${crop(68, 862, 1, -1)}${crop(782, 862, -1, -1)}
${dot(80, 910, 9)}${dot(770, 910, 9)}
<rect x="250" y="985" width="132" height="2" fill="${INK}"/><rect x="468" y="985" width="132" height="2" fill="${INK}"/>
${emblem(425, 986)}
${behind}`)}
${box(0.68, 0.48, 1.6, `${cap(46, 800)}letter-spacing:-0.03em;line-height:1;`, '01')}
${box(6.22, 0.48, 1.6, `${cap(46, 800)}letter-spacing:-0.03em;line-height:1;`, '{{weeks}}', 'right')}
${box(2.55, 0.5, 3.4, `${cap(10.5, 800)}`, '{{title}}', 'center')}
<p data-fit style="position:absolute;left:2.55in;top:0.68in;width:3.4in;height:0.62in;margin:0;text-align:center;${cap(8.5, 600)}line-height:1.2;">{{subtitle}}</p>
${box(2.55, 2.04, 3.4, `${cap(25, 800)}letter-spacing:-0.025em;line-height:1;white-space:nowrap;`, 'Leader guide', 'center')}
${box(0.68, 2.62, 2.2, `${cap(9, 600)}`, 'For {{audience}}')}
${box(3.25, 2.62, 2.0, `${cap(9, 600)}`, '{{weeks}} weeks<br>start here', 'center')}
${box(5.12, 2.62, 2.7, `${cap(8.5, 600)}white-space:nowrap;`, '{{dates}}', 'right')}
<div data-fit style="position:absolute;left:1.05in;top:4.4in;width:6.4in;height:1.78in;font-size:136pt;display:flex;align-items:flex-end;justify-content:center;">
  <h1 style="margin:0;font-family:${DISPLAY};font-weight:800;font-size:1em;line-height:0.86;letter-spacing:-0.03em;text-transform:uppercase;color:${INK};white-space:nowrap;-webkit-text-stroke:2.5pt ${INK};">{{title}}</h1>
</div>
${svg(front, 1)}
${box(0.68, 9.5, 2.0, `${cap(17, 700)}letter-spacing:-0.02em;line-height:1.05;`, 'Read it.<br>Sit in it.')}
${box(5.82, 9.5, 2.0, `${cap(17, 700)}letter-spacing:-0.02em;line-height:1.05;`, 'Live it.<br>Share it.', 'right')}
${box(0.68, 10.35, 2.4, `${cap(8.5, 800)}`, 'Parable')}
${box(3.25, 10.35, 2.0, `${cap(8.5, 800)}`, 'No. 001', 'center')}
${box(5.62, 10.35, 2.2, `${cap(8.5, 800)}`, '{{audience}} edition', 'right')}
</div>`;

const pack = {
  id: 'liquid-frame-v1',
  name: 'Liquid Frame',
  description: 'A strict symmetric frame of bold caps, rules and crop marks around one liquid, melting title.',
  design: {
    palette: { paper: '#FFFFFF', ink: INK, accent: INK, secondary: '#6B6870', muted: '#6B6870', deep: INK },
    type: { display: 'jakarta', body: 'sans', label: 'sans', headingCase: 'caps' },
    page: { corners: 'square', headerRule: 'heavy', mark: 'none' },
    components: { questions: 'numbers', scripture: 'rule' },
  },
  cover,
};
writeFileSync(process.argv[2], JSON.stringify(pack, null, 2) + '\n');
console.log('cover', cover.length);
