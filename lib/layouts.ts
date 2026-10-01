import { BookDesign, BookDesignPatch, LayoutPack } from '../types';
import { sanitizeCss, sanitizeCustom } from './customPage';
import { applyPatch } from './design';
import { uid } from './factory';

// Layout files (.parable-layout.json) are complete book designs written outside Parable and imported.
// Everything in them is cleaned before it's kept: pages through the HTML/SVG allow-list, CSS through
// the CSS filter, and design settings through the normal design validator when applied.

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

export const readLayout = (raw: unknown): LayoutPack => {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pack: LayoutPack = {
    id: str(o.id, 60) || uid(),
    name: str(o.name, 80).trim() || 'Imported layout',
    description: str(o.description, 300),
    design: (o.design && typeof o.design === 'object' ? o.design : {}) as BookDesignPatch,
    cover: sanitizeCustom(o.cover),
    divider: sanitizeCustom(o.divider),
    css: sanitizeCss(o.css),
  };
  if (!pack.cover && !pack.divider && !pack.css && !Object.keys(pack.design).length) {
    throw new Error("That file doesn't contain a Parable layout.");
  }
  return pack;
};

// Apply a layout on top of a design: its settings, then its pages and CSS (or none, if it has none).
export const applyLayout = (design: BookDesign, pack: LayoutPack): BookDesign =>
  applyPatch(design, {
    ...pack.design,
    custom: { name: pack.name, cover: pack.cover, divider: pack.divider, css: pack.css },
  } as BookDesignPatch);

// Take an imported layout off, keeping the rest of the design.
export const removeLayout = (design: BookDesign): BookDesign =>
  applyPatch(design, { custom: { name: '', cover: '', divider: '', css: '' } } as BookDesignPatch);
