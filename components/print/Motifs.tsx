import React from 'react';
import { Motif } from '../../types';
import { Palette, toneColor } from '../../lib/design';

// Shapes for covers and dividers, drawn on an 850 × 1100 canvas (a letter page at 100 units per inch).
// Positions arrive as page fractions, so one design reads the same on every full-bleed page.
const W = 850;
const H = 1100;

const Shape: React.FC<{ m: Motif; p: Palette; bg: string; id: string }> = ({ m, p, bg, id }) => {
  const color = toneColor(p, m.tone);
  const cx = m.x * W;
  const cy = m.y * H;
  const s = m.size * W;
  const outline = m.style === 'outline';
  const stroke = Math.max(1.5, s * 0.02);
  const paint = outline ? { fill: 'none', stroke: color, strokeWidth: stroke } : { fill: color };
  const rot = `rotate(${m.rotation} ${cx} ${cy})`;
  const w = m.type === 'band' || m.type === 'track' || m.type === 'frame' || m.type === 'grid' || m.type === 'stripes' || m.type === 'barcode' ? s : s;
  const h = w / Math.max(0.05, m.aspect);

  switch (m.type) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={s / 2} {...paint} />;
    case 'ring': {
      const n = Math.max(1, m.count);
      return (
        <g fill="none" stroke={color} strokeWidth={stroke}>
          {Array.from({ length: n }, (_, i) => <circle key={i} cx={cx} cy={cy} r={(s / 2) * (1 - i / (n + 0.5))} />)}
        </g>
      );
    }
    case 'x': {
      // Two rounded bars; the outline version draws the bars wide in color, then narrower in the background color.
      const half = s / 2;
      const t = s * 0.24;
      const bars = (width: number, c: string) => (
        <g stroke={c} strokeWidth={width} strokeLinecap="round">
          <line x1={cx - half + t / 2} y1={cy - half + t / 2} x2={cx + half - t / 2} y2={cy + half - t / 2} />
          <line x1={cx + half - t / 2} y1={cy - half + t / 2} x2={cx - half + t / 2} y2={cy + half - t / 2} />
        </g>
      );
      return <g transform={rot}>{bars(t, color)}{outline && bars(t * 0.62, bg)}</g>;
    }
    case 'band': {
      // A long strip through (x, y); size is its thickness, and it runs past the page edges.
      const thick = s;
      return <rect x={cx - 1600} y={cy - thick / 2} width={3200} height={thick} transform={rot} {...paint} />;
    }
    case 'track': {
      // A pill / racetrack shape with a slot down the middle, like a rounded rail.
      const tw = s;
      const th = Math.min(tw, tw / Math.max(1, m.aspect));
      return (
        <g transform={rot}>
          <rect x={cx - tw / 2} y={cy - th / 2} width={tw} height={th} rx={th / 2} {...paint} />
          <rect x={cx - tw / 2 + th * 0.55} y={cy - th * 0.04} width={tw - th * 1.1} height={th * 0.08} rx={th * 0.04} fill={outline ? color : bg} />
        </g>
      );
    }
    case 'frame':
      return <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} transform={rot} fill="none" stroke={color} strokeWidth={stroke * 0.8} />;
    case 'line':
      return <line x1={cx - s / 2} y1={cy} x2={cx + s / 2} y2={cy} transform={rot} stroke={color} strokeWidth={Math.max(1.5, s * 0.012)} />;
    case 'arrow': {
      const a = s / 2;
      return (
        <g transform={rot} stroke={color} strokeWidth={Math.max(2, s * 0.09)} fill="none" strokeLinecap="square">
          <line x1={cx - a} y1={cy + a} x2={cx + a} y2={cy - a} />
          <polyline points={`${cx - a * 0.1},${cy - a} ${cx + a},${cy - a} ${cx + a},${cy + a * 0.1}`} />
        </g>
      );
    }
    case 'crosshair':
      return (
        <g stroke={color} strokeWidth={Math.max(1.5, s * 0.06)} transform={rot}>
          <line x1={cx - s / 2} y1={cy} x2={cx + s / 2} y2={cy} />
          <line x1={cx} y1={cy - s / 2} x2={cx} y2={cy + s / 2} />
        </g>
      );
    case 'grid': {
      const n = Math.max(2, m.count + 1);
      return (
        <g stroke={color} strokeWidth={1.2} transform={rot}>
          {Array.from({ length: n + 1 }, (_, i) => <line key={`v${i}`} x1={cx - w / 2 + (w * i) / n} y1={cy - h / 2} x2={cx - w / 2 + (w * i) / n} y2={cy + h / 2} />)}
          {Array.from({ length: n + 1 }, (_, i) => <line key={`h${i}`} x1={cx - w / 2} y1={cy - h / 2 + (h * i) / n} x2={cx + w / 2} y2={cy - h / 2 + (h * i) / n} />)}
        </g>
      );
    }
    case 'barcode': {
      const n = Math.max(4, m.count);
      const widths = Array.from({ length: n }, (_, i) => [1, 3, 1, 2, 4, 1, 2, 1, 3, 1][(i * 7 + 3) % 10]);
      const unit = w / widths.reduce((a, b) => a + b + 1.2, 0);
      let x = cx - w / 2;
      return (
        <g fill={color} transform={rot}>
          {widths.map((bw, i) => {
            const r = <rect key={i} x={x} y={cy - h / 2} width={bw * unit} height={h} />;
            x += (bw + 1.2) * unit;
            return r;
          })}
        </g>
      );
    }
    case 'stripes': {
      // A field of thin diagonal lines, clipped to a box.
      const lines = Math.round((w + h) / 9);
      return (
        <g transform={rot}>
          <clipPath id={`${id}-clip`}><rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} /></clipPath>
          <g clipPath={`url(#${id}-clip)`} stroke={color} strokeWidth={2.2}>
            {Array.from({ length: lines }, (_, i) => {
              const x0 = cx - w / 2 - h + i * 9;
              return <line key={i} x1={x0} y1={cy + h / 2} x2={x0 + h} y2={cy - h / 2} />;
            })}
          </g>
        </g>
      );
    }
    case 'label':
      return (
        <text x={cx} y={cy} transform={rot} fill={color} fontFamily="'IBM Plex Mono', ui-monospace, monospace" fontSize={Math.max(9, s * 0.35)} letterSpacing="0.5">
          {m.text || '09'}
        </text>
      );
    default:
      return null;
  }
};

// Shapes behind the page's text. Inside the text zone they fade to a whisper so words stay readable.
export const MotifLayer: React.FC<{
  motifs: Motif[];
  palette: Palette;
  bg: string;
  textZones: { x: number; y: number; w: number; h: number }[];
  uid: string;
}> = ({ motifs, palette, bg, textZones, uid }) => {
  if (!motifs.length) return null;
  const zones = textZones.map((t) => ({ x: t.x * W, y: t.y * H, w: t.w * W, h: t.h * H }));
  const shapes = (prefix: string) => motifs.map((m, i) => (
    <g key={i} opacity={m.opacity}>
      <Shape m={m} p={palette} bg={bg} id={`${uid}-${prefix}-${i}`} />
    </g>
  ));
  return (
    <svg className="pr-motifs" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        {/* Feathered edges, so the quiet zone behind the title doesn't read as a box. */}
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28" /></filter>
        <mask id={`${uid}-outside`}>
          <rect width={W} height={H} fill="white" />
          {zones.map((z, i) => <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} fill="black" filter={`url(#${uid}-soft)`} />)}
        </mask>
        <mask id={`${uid}-inside`}>
          {zones.map((z, i) => <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} fill="white" filter={`url(#${uid}-soft)`} />)}
        </mask>
      </defs>
      <g mask={`url(#${uid}-outside)`}>{shapes('o')}</g>
      <g mask={`url(#${uid}-inside)`} opacity={0.18}>{shapes('i')}</g>
    </svg>
  );
};

// A small mark for page headers (inside pages stay calm: one tiny accent shape, if any).
export const PageMark: React.FC<{ kind: string }> = ({ kind }) => {
  if (kind === 'none') return null;
  return (
    <svg className="pr-mark" viewBox="0 0 24 24" aria-hidden="true">
      {kind === 'x' && <g stroke="var(--c-raw)" strokeWidth="4.5" strokeLinecap="round"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></g>}
      {kind === 'ring' && <g fill="none" stroke="var(--c-raw)" strokeWidth="1.6"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="3" /></g>}
      {kind === 'arrow' && <g stroke="var(--c-raw)" strokeWidth="2.6" fill="none"><line x1="5" y1="19" x2="19" y2="5" /><polyline points="9,5 19,5 19,15" /></g>}
      {kind === 'crosshair' && <g stroke="var(--c-raw)" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></g>}
      {kind === 'barcode' && <g fill="var(--c-raw)">{[2, 5, 7, 11, 13, 16, 20].map((x, i) => <rect key={x} x={x} y="3" width={i % 3 === 0 ? 2.4 : 1.2} height="18" />)}</g>}
      {kind === 'dot' && <circle cx="12" cy="12" r="6" fill="var(--c-raw)" />}
    </svg>
  );
};
