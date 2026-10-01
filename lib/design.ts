import type React from 'react';
import { BookDesign, BookDesignPatch, DesignSurface, DesignTone, Motif, MotifType, Series, SeriesColor } from '../types';

// ---------- The design language ----------
// A BookDesign is data the print renderer reads. Every field has a default, Diana changes only what
// was asked (a patch), and normalizeDesign() clamps everything so any answer still prints cleanly.

const DISPLAY = {
  jakarta: { label: 'Modern sans', css: "'Plus Jakarta Sans Variable'" },
  fraunces: { label: 'Classic serif', css: "'Fraunces Variable'" },
  dmserif: { label: 'Editorial serif', css: "'DM Serif Display'" },
  oswald: { label: 'Tall condensed', css: "'Oswald Variable'" },
  nunito: { label: 'Rounded', css: "'Nunito Variable'" },
  grotesk: { label: 'Geometric grotesk', css: "'Space Grotesk Variable'" },
  inter: { label: 'Neutral sans', css: "'Inter Variable'" },
  mono: { label: 'Technical mono', css: "'IBM Plex Mono'" },
} as const;
const BODY = {
  serif: { label: 'Serif (classic reading)', css: "'Source Serif 4 Variable'" },
  sans: { label: 'Sans (clean)', css: "'Inter Variable'" },
  rounded: { label: 'Rounded (friendly)', css: "'Nunito Variable'" },
} as const;
const LABEL = {
  sans: { label: 'Sans', css: "'Inter Variable'" },
  mono: { label: 'Mono (technical)', css: "'IBM Plex Mono'" },
} as const;

export const DISPLAY_FONTS = Object.keys(DISPLAY) as BookDesign['type']['display'][];
export const BODY_FONTS = Object.keys(BODY) as BookDesign['type']['body'][];
export const LABEL_FONTS = Object.keys(LABEL) as BookDesign['type']['label'][];
export const fontName = (kind: 'display' | 'body' | 'label', id: string) =>
  ((kind === 'display' ? DISPLAY : kind === 'body' ? BODY : LABEL) as Record<string, { label: string }>)[id]?.label ?? id;

// Every face the print view can use, so printing can wait until they have loaded.
export const PRINT_FACES = [
  "400 12pt 'Source Serif 4 Variable'", "italic 400 12pt 'Source Serif 4 Variable'",
  "400 12pt 'Inter Variable'", "700 12pt 'Inter Variable'", "800 12pt 'Plus Jakarta Sans Variable'",
  "600 12pt 'Oswald Variable'", "600 12pt 'Fraunces Variable'", "400 12pt 'DM Serif Display'",
  "400 12pt 'Nunito Variable'", "800 12pt 'Nunito Variable'", "700 12pt 'Space Grotesk Variable'",
  "400 12pt 'IBM Plex Mono'", "600 12pt 'IBM Plex Mono'",
];

export const MOTIF_TYPES: MotifType[] = ['band', 'circle', 'ring', 'x', 'track', 'line', 'frame', 'arrow', 'grid', 'barcode', 'stripes', 'crosshair', 'label'];
export const TONES: DesignTone[] = ['paper', 'ink', 'accent', 'secondary', 'muted', 'deep'];
const MAX_MOTIFS = 18;

// ---------- Color ----------

export const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim());
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
export const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
export const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Move `color` toward `target` until it reaches `ratio` contrast against `against`.
const ensure = (color: string, against: string, ratio: number, target: string) => {
  let c = color;
  for (let i = 0; i < 20 && contrast(c, against) < ratio; i++) c = mix(c, target, 0.12);
  return c;
};

const SERIES_ACCENT: Record<SeriesColor, string> = {
  indigo: '#4F46E5', sky: '#0284C7', emerald: '#059669', amber: '#D97706', rose: '#E11D48', violet: '#7C3AED', slate: '#475569',
};

// The colors the renderer actually uses: readable on the paper, and a deep tone for full-bleed pages.
export const resolvePalette = (d: BookDesign) => {
  // Lesson pages must stay light enough to read and write on.
  const paper = luminance(d.palette.paper) < 0.6 ? ensure(d.palette.paper, '#000000', 13, '#FFFFFF') : d.palette.paper;
  const ink = ensure(d.palette.ink, paper, 9, '#000000');
  const accent = d.palette.accent;
  const accentText = ensure(accent, paper, 4.5, '#000000');
  return {
    paper,
    ink,
    accent,
    accentText,
    secondary: d.palette.secondary,
    muted: d.palette.muted,
    // The dark color for full-bleed pages and dark panels; a design can set it, otherwise it's a deep accent.
    deep: isHex(d.palette.deep) ? d.palette.deep : mix(accentText, '#0B0F1A', 0.62),
    soft: mix(accent, paper, 0.88),
    line: mix(accent, paper, 0.62),
  };
};
export type Palette = ReturnType<typeof resolvePalette>;
export const toneColor = (p: Palette, tone: DesignTone) =>
  tone === 'paper' ? p.paper : tone === 'ink' ? p.ink : tone === 'accent' ? p.accent : tone === 'secondary' ? p.secondary : tone === 'muted' ? p.muted : p.deep;
// Text on a full-bleed surface: light on dark backgrounds, ink on light ones.
export const surfaceText = (p: Palette, bg: DesignTone) => (luminance(toneColor(p, bg)) < 0.3 ? '#FFFFFF' : p.ink);

// ---------- Defaults ----------

export const motif = (m: Partial<Motif> & { type: MotifType }): Motif => ({
  x: 0.5, y: 0.5, size: 0.2, aspect: 1, rotation: 0, tone: 'accent', style: 'solid', opacity: 1, count: 1, text: '', ...m,
});

const ORB_COVER: Motif[] = [
  motif({ type: 'circle', x: 0.86, y: 0.08, size: 0.9, tone: 'accent' }),
  motif({ type: 'ring', x: 0.88, y: 0.34, size: 0.64, tone: 'paper', style: 'outline', opacity: 0.28 }),
  motif({ type: 'circle', x: 0.56, y: 0.43, size: 0.11, tone: 'paper', opacity: 0.14 }),
];
const ORB_DIVIDER: Motif[] = [
  motif({ type: 'circle', x: 0.5, y: 0.5, size: 0.78, tone: 'accent', opacity: 0.32 }),
  motif({ type: 'ring', x: 0.5, y: 0.5, size: 1.01, tone: 'paper', style: 'outline', opacity: 0.14 }),
  motif({ type: 'circle', x: 0.82, y: 0.15, size: 0.09, tone: 'paper', opacity: 0.08 }),
];

const surface = (s: Partial<DesignSurface>): DesignSurface => ({
  background: 'deep', layout: 'bottom', align: 'left', titleScale: 1, titleDirection: 'across', titleBox: 'none', showCount: true, motifs: [], ...s,
});

export const DEFAULT_DESIGN: BookDesign = {
  palette: { paper: '#FFFFFF', ink: '#0F172A', accent: '#4F46E5', secondary: '#64748B', muted: '#F1F5F9', deep: '' },
  type: { display: 'jakarta', body: 'serif', label: 'sans', headingCase: 'normal' },
  page: { corners: 'round', headerRule: 'ink', mark: 'none' },
  components: { questions: 'numbers', scripture: 'panel' },
  cover: surface({ motifs: ORB_COVER }),
  divider: surface({ layout: 'center', align: 'center', showCount: false, motifs: ORB_DIVIDER }),
};

// ---------- Normalizing (the safety layer) ----------

const num = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};
const pick = <T extends string>(v: unknown, options: readonly T[], fallback: T): T => (options.includes(v as T) ? (v as T) : fallback);
const hex = (v: unknown, fallback: string) => (isHex(v) ? v.trim().toUpperCase() : fallback);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

// A few friendly synonyms small models tend to use.
const MOTIF_ALIASES: Record<string, MotifType> = {
  cross: 'x', xmark: 'x', 'x-mark': 'x', stripe: 'band', diagonal: 'band', rectangle: 'frame', box: 'frame', square: 'frame',
  pill: 'track', 'u-shape': 'track', ushape: 'track', capsule: 'track', target: 'ring', rings: 'ring', gauge: 'ring',
  hatch: 'stripes', herringbone: 'stripes', lines: 'stripes', plus: 'crosshair', text: 'label', dot: 'circle', circles: 'circle',
};

const normalizeMotif = (v: unknown, base?: Motif): Motif | null => {
  const o = obj(v);
  const rawType = String(o.type ?? base?.type ?? '').toLowerCase().trim();
  const type = (MOTIF_TYPES as string[]).includes(rawType) ? (rawType as MotifType) : MOTIF_ALIASES[rawType];
  if (!type) return null;
  const b = base ?? motif({ type });
  return {
    type,
    x: num(o.x, -0.4, 1.4, b.x),
    y: num(o.y, -0.4, 1.4, b.y),
    size: num(o.size, 0.01, 1.6, b.size),
    aspect: num(o.aspect, 0.05, 30, b.aspect),
    rotation: num(o.rotation, -360, 360, b.rotation),
    tone: pick(o.tone, TONES, b.tone),
    style: pick(o.style, ['solid', 'outline'] as const, b.style),
    opacity: num(o.opacity, 0.05, 1, b.opacity),
    count: Math.round(num(o.count, 1, type === 'barcode' ? 40 : 12, b.count)),
    text: String(o.text ?? b.text ?? '').slice(0, 32),
  };
};

const normalizeSurface = (v: unknown, base: DesignSurface): DesignSurface => {
  const o = obj(v);
  const motifs = Array.isArray(o.motifs)
    ? o.motifs.map((m, i) => normalizeMotif(m, base.motifs[i]?.type === obj(m).type ? base.motifs[i] : undefined)).filter((m): m is Motif => !!m).slice(0, MAX_MOTIFS)
    : base.motifs;
  return {
    background: pick(o.background, TONES, base.background),
    layout: pick(o.layout, ['bottom', 'center', 'top'] as const, base.layout),
    align: pick(o.align, ['left', 'center', 'right'] as const, base.align),
    titleScale: num(o.titleScale, 0.7, 1.4, base.titleScale),
    titleDirection: pick(o.titleDirection, ['across', 'up'] as const, base.titleDirection ?? 'across'),
    titleBox: pick(o.titleBox, ['none', 'outline', 'solid'] as const, base.titleBox ?? 'none'),
    showCount: typeof o.showCount === 'boolean' ? o.showCount : base.showCount,
    motifs,
  };
};

// Missing or invalid fields fall back to `base`, so a patch only changes what it names.
export const normalizeDesign = (v: unknown, base: BookDesign = DEFAULT_DESIGN): BookDesign => {
  const o = obj(v);
  if ('fonts' in o && !('type' in o)) return migrateOld(o, base);
  const pal = obj(o.palette);
  const ty = obj(o.type);
  const pg = obj(o.page);
  const co = obj(o.components);
  return {
    palette: {
      paper: hex(pal.paper, base.palette.paper),
      ink: hex(pal.ink, base.palette.ink),
      accent: hex(pal.accent, base.palette.accent),
      secondary: hex(pal.secondary, base.palette.secondary),
      muted: hex(pal.muted, base.palette.muted),
      deep: pal.deep === '' ? '' : hex(pal.deep, base.palette.deep),
    },
    type: {
      display: pick(ty.display, DISPLAY_FONTS, base.type.display),
      body: pick(ty.body, BODY_FONTS, base.type.body),
      label: pick(ty.label, LABEL_FONTS, base.type.label),
      headingCase: pick(ty.headingCase, ['normal', 'caps'] as const, base.type.headingCase),
    },
    page: {
      corners: pick(pg.corners, ['round', 'soft', 'square'] as const, base.page.corners),
      headerRule: pick(pg.headerRule, ['ink', 'accent', 'heavy'] as const, base.page.headerRule),
      mark: pick(pg.mark, ['none', 'x', 'ring', 'arrow', 'crosshair', 'barcode', 'dot'] as const, base.page.mark),
    },
    components: {
      questions: pick(co.questions, ['numbers', 'boxed'] as const, base.components.questions),
      scripture: pick(co.scripture, ['panel', 'rule'] as const, base.components.scripture),
    },
    cover: normalizeSurface(o.cover, base.cover),
    divider: normalizeSurface(o.divider, base.divider),
  };
};

// Designs saved before the design language existed: { fonts, corners, headings, accent }.
const OLD_FONTS: Record<string, Partial<BookDesign['type']>> = {
  modern: { display: 'jakarta', body: 'serif' },
  classic: { display: 'fraunces', body: 'serif' },
  editorial: { display: 'dmserif', body: 'serif' },
  camp: { display: 'oswald', body: 'serif' },
  friendly: { display: 'nunito', body: 'rounded' },
  bold: { display: 'grotesk', body: 'sans' },
};
const migrateOld = (o: Record<string, unknown>, base: BookDesign): BookDesign =>
  normalizeDesign({
    palette: isHex(o.accent) ? { accent: o.accent } : {},
    type: { ...OLD_FONTS[String(o.fonts)], headingCase: o.headings === 'caps' ? 'caps' : 'normal' },
    page: { corners: o.corners },
  }, base);

// Apply a small patch from Diana (or a control). Lists of motifs replace the whole list.
export const applyPatch = (design: BookDesign, patch: BookDesignPatch | Record<string, unknown>) => normalizeDesign(patch, design);

// ---------- Looks (starting points) ----------

const look = (patch: BookDesignPatch): BookDesign => applyPatch(DEFAULT_DESIGN, patch);

export interface Look { id: string; name: string; blurb: string; design: BookDesign }

export const LOOKS: Look[] = [
  { id: 'modern', name: 'Modern', blurb: 'Clean sans headings, serif scripts, soft rounded cards.', design: DEFAULT_DESIGN },
  {
    id: 'classic', name: 'Classic', blurb: 'Traditional serif headings, square edges, navy.',
    design: look({ palette: { accent: '#1E3A5F' }, type: { display: 'fraunces' }, page: { corners: 'square' } }),
  },
  {
    id: 'editorial', name: 'Editorial', blurb: 'Magazine-style display serif, deep red, refined.',
    design: look({ palette: { accent: '#9F1239' }, type: { display: 'dmserif' }, page: { corners: 'soft' } }),
  },
  {
    id: 'camp', name: 'Camp', blurb: 'Tall all-caps headings, earthy olive, outdoorsy.',
    design: look({ palette: { accent: '#4D6B1F' }, type: { display: 'oswald', headingCase: 'caps' }, page: { corners: 'soft' } }),
  },
  {
    id: 'friendly', name: 'Friendly', blurb: 'Rounded, warm, easy to read. Great for kids.',
    design: look({ palette: { accent: '#EA580C' }, type: { display: 'nunito', body: 'rounded' }, page: { corners: 'round' } }),
  },
  {
    id: 'bold', name: 'Bold', blurb: 'Geometric caps and punchy color. Great for youth.',
    design: look({ palette: { accent: '#7C3AED' }, type: { display: 'grotesk', body: 'sans', headingCase: 'caps' }, page: { corners: 'square' } }),
  },
];

// ---------- Applying a design ----------

// A series without its own design uses the default look in the series color.
export const designOf = (series?: Series): BookDesign =>
  series?.design ?? applyPatch(DEFAULT_DESIGN, { palette: { accent: SERIES_ACCENT[series?.color ?? 'indigo'] } });

const CORNERS = { round: 1, soft: 0.5, square: 0.12 };

export const designVars = (d: BookDesign): React.CSSProperties => {
  const p = resolvePalette(d);
  return {
    '--c': p.accentText, '--c-deep': p.deep, '--c-soft': p.soft, '--c-line': p.line,
    '--c-raw': p.accent, '--c2': p.secondary, '--paper-bg': p.paper, '--ink': p.ink, '--paper': mix(p.paper, p.ink, 0.035),
    '--rule': mix(p.paper, p.ink, 0.12), '--muted': mix(p.ink, p.paper, 0.45), '--faint': mix(p.ink, p.paper, 0.6),
    '--f-display': `${DISPLAY[d.type.display].css}, 'Plus Jakarta Sans Variable', sans-serif`,
    '--f-poster': `${d.type.display === 'jakarta' ? "'Oswald Variable'" : DISPLAY[d.type.display].css}, sans-serif`,
    '--f-text': `${BODY[d.type.body].css}, Georgia, serif`,
    '--f-ui': `${d.type.body === 'rounded' ? BODY.rounded.css : "'Inter Variable'"}, ui-sans-serif, system-ui, sans-serif`,
    '--f-label': `${LABEL[d.type.label].css}, ui-monospace, monospace`,
    '--head-rule': d.page.headerRule === 'accent' ? p.accentText : p.ink,
    '--head-rule-w': d.page.headerRule === 'heavy' ? '4pt' : '1.5pt',
    '--r': String(CORNERS[d.page.corners]),
  } as React.CSSProperties;
};

// Attributes for the print root: switches the CSS reads for case and component styles.
export const designAttrs = (d: BookDesign) => ({
  'data-caps': d.type.headingCase === 'caps' ? '' : undefined,
  'data-label': d.type.label,
  'data-questions': d.components.questions,
  'data-scripture': d.components.scripture,
});

// The design as compact text for the model: what exists now and what each field can be.
export const describeDesign = (d: BookDesign) => JSON.stringify(d);
