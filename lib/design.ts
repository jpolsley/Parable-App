import type React from 'react';
import { Series, SeriesColor, SeriesDesign } from '../types';

// ---------- Built-in looks ----------
// A look is a small set of choices (fonts, corners, heading case, accent color) that the print
// layout reads as CSS variables. Choices stay inside this set so any combination prints well,
// which is also what lets a small local model pick them reliably.

export type FontSet = SeriesDesign['fonts'];

const FONTS: Record<FontSet, { label: string; display: string; text: string; ui: string; poster: string; weight: number }> = {
  modern: { label: 'Modern', display: "'Plus Jakarta Sans Variable'", text: "'Source Serif 4 Variable'", ui: "'Inter Variable'", poster: "'Oswald Variable'", weight: 800 },
  classic: { label: 'Classic', display: "'Fraunces Variable'", text: "'Source Serif 4 Variable'", ui: "'Inter Variable'", poster: "'Fraunces Variable'", weight: 600 },
  editorial: { label: 'Editorial', display: "'DM Serif Display'", text: "'Source Serif 4 Variable'", ui: "'Inter Variable'", poster: "'DM Serif Display'", weight: 400 },
  camp: { label: 'Camp', display: "'Oswald Variable'", text: "'Source Serif 4 Variable'", ui: "'Inter Variable'", poster: "'Oswald Variable'", weight: 600 },
  friendly: { label: 'Friendly', display: "'Nunito Variable'", text: "'Nunito Variable'", ui: "'Nunito Variable'", poster: "'Nunito Variable'", weight: 800 },
  bold: { label: 'Bold', display: "'Space Grotesk Variable'", text: "'Inter Variable'", ui: "'Inter Variable'", poster: "'Space Grotesk Variable'", weight: 700 },
};

export const FONT_SETS = Object.keys(FONTS) as FontSet[];
export const fontLabel = (f: FontSet) => FONTS[f].label;

// Every face the print view can use, so printing can wait until they have loaded.
export const PRINT_FACES = [
  "400 12pt 'Source Serif 4 Variable'", "italic 400 12pt 'Source Serif 4 Variable'",
  "400 12pt 'Inter Variable'", "700 12pt 'Inter Variable'", "800 12pt 'Plus Jakarta Sans Variable'",
  "600 12pt 'Oswald Variable'", "600 12pt 'Fraunces Variable'", "400 12pt 'DM Serif Display'",
  "400 12pt 'Nunito Variable'", "800 12pt 'Nunito Variable'", "700 12pt 'Space Grotesk Variable'",
];

export interface Look {
  id: string;
  name: string;
  blurb: string;
  design: SeriesDesign;
}

export const LOOKS: Look[] = [
  { id: 'modern', name: 'Modern', blurb: 'Clean sans headings, serif scripts, soft rounded cards.', design: { fonts: 'modern', corners: 'round', headings: 'normal', accent: '' } },
  { id: 'classic', name: 'Classic', blurb: 'Traditional serif headings, square edges, navy.', design: { fonts: 'classic', corners: 'square', headings: 'normal', accent: '#1E3A5F' } },
  { id: 'editorial', name: 'Editorial', blurb: 'Magazine-style display serif, deep red, refined.', design: { fonts: 'editorial', corners: 'soft', headings: 'normal', accent: '#9F1239' } },
  { id: 'camp', name: 'Camp', blurb: 'Tall all-caps headings, earthy olive, outdoorsy.', design: { fonts: 'camp', corners: 'soft', headings: 'caps', accent: '#4D6B1F' } },
  { id: 'friendly', name: 'Friendly', blurb: 'Rounded, warm, easy to read. Great for kids.', design: { fonts: 'friendly', corners: 'round', headings: 'normal', accent: '#EA580C' } },
  { id: 'bold', name: 'Bold', blurb: 'Geometric caps and punchy color. Great for youth.', design: { fonts: 'bold', corners: 'square', headings: 'caps', accent: '#7C3AED' } },
];

export const DEFAULT_DESIGN: SeriesDesign = LOOKS[0].design;

const CORNERS: Record<SeriesDesign['corners'], number> = { round: 1, soft: 0.5, square: 0.12 };

// ---------- Color ----------

const PALETTE: Record<SeriesColor, [string, string, string, string]> = {
  // base, deep, soft, line
  indigo: ['#4F46E5', '#1E1B4B', '#EEF2FF', '#C7D2FE'],
  sky: ['#0284C7', '#082F49', '#E0F2FE', '#BAE6FD'],
  emerald: ['#059669', '#022C22', '#D1FAE5', '#A7F3D0'],
  amber: ['#D97706', '#451A03', '#FEF3C7', '#FDE68A'],
  rose: ['#E11D48', '#4C0519', '#FFE4E6', '#FECDD3'],
  violet: ['#7C3AED', '#2E1065', '#EDE9FE', '#DDD6FE'],
  slate: ['#475569', '#0F172A', '#F1F5F9', '#CBD5E1'],
};

export const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim());

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrastOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

// Any accent works: it's darkened until small colored text stays readable on white paper.
export const paletteFrom = (accent: string): [string, string, string, string] => {
  let c = accent.toUpperCase();
  for (let i = 0; i < 12 && contrastOnWhite(c) < 4.5; i++) c = mix(c, '#000000', 0.12);
  return [c, mix(c, '#0B0F1A', 0.62), mix(c, '#FFFFFF', 0.9), mix(c, '#FFFFFF', 0.68)];
};

// ---------- Applying a design ----------

export const designOf = (series?: Series): SeriesDesign => series?.design ?? DEFAULT_DESIGN;

export const designVars = (series?: Series): React.CSSProperties => {
  const d = designOf(series);
  const [c, deep, soft, line] = isHex(d.accent) ? paletteFrom(d.accent) : PALETTE[series?.color ?? 'indigo'];
  const f = FONTS[d.fonts] ?? FONTS.modern;
  const caps = d.headings === 'caps';
  return {
    '--c': c, '--c-deep': deep, '--c-soft': soft, '--c-line': line,
    '--f-display': `${f.display}, 'Plus Jakarta Sans Variable', sans-serif`,
    '--f-text': `${f.text}, Georgia, serif`,
    '--f-ui': `${f.ui}, ui-sans-serif, system-ui, sans-serif`,
    '--f-poster': `${f.poster}, 'Oswald Variable', sans-serif`,
    '--head-weight': String(f.weight),
    '--head-case': caps ? 'uppercase' : 'none',
    '--head-track': caps ? '0.02em' : '-0.02em',
    '--r': String(CORNERS[d.corners] ?? 1),
  } as React.CSSProperties;
};

// Cleans up a design from storage, an import, or the AI.
export const normalizeDesign = (v: unknown): SeriesDesign | undefined => {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  const fonts = FONT_SETS.includes(o.fonts as FontSet) ? (o.fonts as FontSet) : 'modern';
  const corners = o.corners === 'soft' || o.corners === 'square' ? o.corners : 'round';
  const headings = o.headings === 'caps' ? 'caps' : 'normal';
  const accent = isHex(o.accent) ? o.accent.trim().toUpperCase() : '';
  return { fonts, corners, headings, accent };
};
