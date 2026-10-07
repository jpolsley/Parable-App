import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const icons = JSON.parse(fs.readFileSync(new URL('./icons.json', import.meta.url)));
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p = await b.newPage();
const hulls = await p.evaluate((icons) => {
  const out = {};
  // seeded jitter so the cuts look hand-made
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const [k, markup] of Object.entries(icons)) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200'); svg.innerHTML = markup; document.body.appendChild(svg);
    const pts = [];
    const M = 15;
    for (const el of svg.querySelectorAll('path,rect,polygon,circle')) {
      if (el.getAttribute('stroke') && el.getAttribute('fill') == null && el.tagName === 'path' && !el.getAttribute('d').includes('Z')) continue;
      const L = el.getTotalLength();
      for (let i = 0; i <= 120; i++) {
        const q = el.getPointAtLength((L * i) / 120);
        for (let a = 0; a < 16; a++) pts.push([q.x + Math.cos(a * Math.PI / 8) * M, q.y + Math.sin(a * Math.PI / 8) * M]);
      }
    }
    // convex hull (monotone chain)
    pts.sort((a, c) => a[0] - c[0] || a[1] - c[1]);
    const cross = (o, a, c) => (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]);
    const lower = [], upper = [];
    for (const q of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (const q of [...pts].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    let hull = lower.slice(0, -1).concat(upper.slice(0, -1));
    // simplify to scissor cuts: keep points at least ~26 units apart, then nudge each a little
    const simple = [];
    for (const q of hull) { const last = simple[simple.length - 1]; if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) > 26) simple.push(q); }
    out[k] = simple.map(([x, y]) => `${Math.round(x + (rnd() - 0.5) * 6)},${Math.round(y + (rnd() - 0.5) * 6)}`).join(' ');
    svg.remove();
  }
  return out;
}, icons);
fs.writeFileSync(new URL('./hulls.json', import.meta.url), JSON.stringify(hulls, null, 1));
console.log(Object.fromEntries(Object.entries(hulls).map(([k, v]) => [k, v.split(' ').length])));
await b.close();
