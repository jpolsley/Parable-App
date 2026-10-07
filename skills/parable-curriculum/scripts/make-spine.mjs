import { writeFileSync } from 'fs';
const BOARD = '#1D1C19', CREAM = '#ECE6D8', BLUE = '#2F5BD3', SAND = '#C9C2AE';
const board = `
  <svg viewBox="0 0 850 1100" style="position:absolute;left:0;top:0;width:8.5in;height:11in">
    <defs>
      <pattern id="spine-board" width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="${BOARD}"/>
        <line x1="0" y1="5" x2="5" y2="0" stroke="#24231F" stroke-width="1"/>
      </pattern>
      <linearGradient id="spine-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="850" height="1100" fill="url(#spine-board)"/>
    <rect x="0" y="0" width="30" height="1100" fill="${BLUE}"/>
    <rect x="30" y="0" width="26" height="1100" fill="url(#spine-shade)"/>
  </svg>`;

const cover = `
<div style="position:relative;width:8.5in;height:11in;overflow:hidden;background:${BOARD};color:${CREAM};font-family:'Oswald Variable',sans-serif;">
  ${board}
  <div data-fit style="position:absolute;right:0.5in;top:0.55in;width:2.7in;height:9.75in;font-size:200pt;display:flex;justify-content:flex-end;align-items:flex-end;">
    <h1 style="margin:0;writing-mode:vertical-rl;transform:rotate(180deg);font-size:1em;font-weight:700;line-height:0.84;letter-spacing:0.01em;text-transform:uppercase;color:${CREAM};">{{title}}</h1>
  </div>
  <div style="position:absolute;left:0.95in;top:0.6in;font-family:'IBM Plex Mono',monospace;font-size:7.5pt;letter-spacing:0.06em;color:${SAND};text-transform:uppercase;">Leader guide / No. {{weeks}}</div>
  <div style="position:absolute;left:0.95in;top:3.1in;width:4.1in;border:1.6pt solid ${CREAM};border-radius:16pt;padding:16pt 18pt 14pt;">
    <p style="margin:0;font-size:10pt;letter-spacing:0.08em;text-transform:uppercase;line-height:1.35;">{{eyebrow}} / Street-level faith / Read it, live it</p>
    <div style="height:1.2pt;background:${CREAM};margin:12pt 0;opacity:0.9;"></div>
    <p data-fit style="margin:0;height:1.25in;font-size:19pt;font-weight:600;text-transform:uppercase;line-height:1.12;">{{subtitle}}</p>
    <div style="display:flex;align-items:center;gap:10pt;margin-top:12pt;">
      <svg viewBox="0 0 60 26" style="width:0.62in;height:0.27in">
        <circle cx="13" cy="13" r="10.5" fill="none" stroke="${CREAM}" stroke-width="1.6"/>
        <path d="M8 13 a5 5 0 1 1 5 5" fill="none" stroke="${CREAM}" stroke-width="1.6"/>
        <circle cx="45" cy="13" r="10.5" fill="none" stroke="${CREAM}" stroke-width="1.6"/>
        <text x="45" y="17" text-anchor="middle" font-family="Oswald Variable" font-size="11" fill="${CREAM}">{{weeks}}</text>
      </svg>
      <span style="font-size:9pt;letter-spacing:0.1em;text-transform:uppercase;">{{weeks}} weeks</span>
    </div>
  </div>
  <div style="position:absolute;left:0.95in;bottom:0.75in;width:4.2in;font-size:9.5pt;letter-spacing:0.12em;text-transform:uppercase;line-height:1.5;">
    <div style="color:${SAND};">{{dates}}</div>
    <div style="font-weight:600;">Parable · {{audience}}</div>
  </div>
</div>`;

const divider = `
<div style="position:relative;width:8.5in;height:11in;overflow:hidden;background:${BOARD};color:${CREAM};font-family:'Oswald Variable',sans-serif;">
  ${board}
  <div style="position:absolute;left:0.95in;top:0.6in;font-family:'IBM Plex Mono',monospace;font-size:7.5pt;letter-spacing:0.06em;color:${SAND};text-transform:uppercase;">{{kicker}}</div>
  <div data-fit style="position:absolute;left:0.95in;bottom:3.35in;width:6.8in;height:2.4in;font-size:150pt;display:flex;align-items:flex-end;">
    <h1 style="margin:0;font-size:1em;font-weight:700;line-height:0.86;text-transform:uppercase;color:${CREAM};">{{title}}</h1>
  </div>
  <div style="position:absolute;left:0.95in;bottom:0.85in;width:5.6in;border:1.6pt solid ${CREAM};border-radius:16pt;padding:14pt 18pt;">
    <p data-fit style="margin:0;height:0.62in;font-size:22pt;font-weight:600;text-transform:uppercase;line-height:1.1;">{{subtitle}}</p>
    <div style="height:1.2pt;background:${CREAM};margin:10pt 0;opacity:0.9;"></div>
    <p data-fit style="margin:0;height:0.9in;font-family:'Inter Variable',sans-serif;font-size:12pt;line-height:1.4;color:${CREAM};">{{idea}}</p>
  </div>
</div>`;

const css = `
.pr-head { border-bottom: 4pt solid #1A1A18; }
.pr-head h1, .pr-sec-head h2, .pr-family-head h1 { font-family: 'Oswald Variable', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; }
.pr-p-head h3, .pr-weeks h3 { font-family: 'Oswald Variable', sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 0.01em; }
.pr-sec-head { border-left: 9pt solid ${BLUE}; padding-left: 12pt; border-bottom: 4pt solid #1A1A18; }
.pr-eyebrow, .pr-p-kind, .pr-sg-kicker { color: ${BLUE}; }
.pr-say { border-left-color: ${BLUE}; }
.pr-sg-idea > div, .pr-family-strip { background: ${BOARD}; color: ${CREAM}; border-radius: 0; }
.pr-sg-idea .pr-serif { color: ${CREAM}; }
.pr-sg-idea .pr-label { color: ${SAND}; }
.pr-family-card, .pr-sg-close > div, .pr-roles > div { border: 1.5pt solid #1A1A18; border-radius: 12pt; }
.pr-tag { background: ${BLUE}; border-radius: 3pt; }
.pr-weeks { border-top: 4pt solid #1A1A18; }
.pr-weeks .n { font-family: 'Oswald Variable', sans-serif; color: ${BLUE}; }
`;

const pack = {
  id: 'spine-v1',
  name: 'Spine',
  description: 'Raw board black, a blue spine, a huge vertical title and outlined label boxes. Condensed caps throughout.',
  design: {
    palette: { paper: '#F2EFE7', ink: '#1A1A18', accent: BLUE, secondary: SAND, muted: '#3A3934', deep: BOARD },
    type: { display: 'oswald', body: 'sans', label: 'sans', headingCase: 'caps' },
    page: { corners: 'soft', headerRule: 'heavy', mark: 'none' },
    components: { questions: 'boxed', scripture: 'rule' },
  },
  cover: cover.trim(),
  divider: divider.trim(),
  css: css.trim(),
};
writeFileSync(process.argv[2], JSON.stringify(pack, null, 2) + '\n');
console.log('ok', JSON.stringify(pack).length);
