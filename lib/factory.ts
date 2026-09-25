import { LinkItem, Part, PartType, Section, Series, SeriesColor, Service, Supply, SupplyPer } from '../types';
import { PART_TYPE_KEYS } from './partTypes';

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const todayISO = (): string => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const toPartType = (v: unknown): PartType => {
  const s = str(v).toLowerCase().replace(/[\s_]+/g, '-');
  return (PART_TYPE_KEYS as string[]).includes(s) ? (s as PartType) : 'other';
};

const toPer = (v: unknown): SupplyPer => (v === 'person' || v === 'group' ? v : 'total');

export const newSupply = (s: Partial<Supply> = {}): Supply => ({
  id: s.id || uid(),
  name: str(s.name),
  qty: num(s.qty, 1),
  per: toPer(s.per),
});

export const newLink = (l: Partial<LinkItem> = {}): LinkItem => ({
  id: l.id || uid(),
  label: str(l.label),
  url: str(l.url),
});

// Also used to normalize imported / AI-generated data, so every field is coerced.
export const newPart = (p: Partial<Record<keyof Part, unknown>> = {}): Part => ({
  id: str(p.id) || uid(),
  title: str(p.title, 'New part') || 'New part',
  type: toPartType(p.type),
  minutes: num(p.minutes, 5),
  hidden: p.hidden === true,
  pageBreak: p.pageBreak === true,
  script: str(p.script),
  instructions: str(p.instructions),
  supplies: Array.isArray(p.supplies) ? p.supplies.map((s) => newSupply(s ?? {})) : [],
  media: Array.isArray(p.media) ? p.media.map((l) => newLink(l ?? {})) : [],
  resources: Array.isArray(p.resources) ? p.resources.map((l) => newLink(l ?? {})) : [],
  inclusionTips: str(p.inclusionTips),
  leaderNotes: str(p.leaderNotes),
});

export const newSection = (s: Partial<Record<keyof Section, unknown>> = {}): Section => ({
  id: str(s.id) || uid(),
  title: str(s.title, 'New section') || 'New section',
  hidden: s.hidden === true,
  pageBreak: s.pageBreak === true,
  collapsed: s.collapsed === true,
  parts: Array.isArray(s.parts) ? s.parts.map((p) => newPart(p ?? {})) : [],
});

export const newService = (s: Partial<Record<keyof Service, unknown>> = {}): Service => {
  const now = Date.now();
  return {
    id: str(s.id) || uid(),
    title: str(s.title, 'Untitled service') || 'Untitled service',
    audience: str(s.audience, 'Kids'),
    seriesId: str(s.seriesId) || null,
    week: typeof s.week === 'number' ? s.week : null,
    date: str(s.date) || todayISO(),
    startTime: str(s.startTime, '10:00'),
    classSize: num(s.classSize, 10),
    groupCount: num(s.groupCount, 2),
    bigIdea: str(s.bigIdea),
    keyVerse: str(s.keyVerse),
    scripture: str(s.scripture),
    checkedSupplies: Array.isArray(s.checkedSupplies) ? s.checkedSupplies.filter((x): x is string => typeof x === 'string') : [],
    sections: Array.isArray(s.sections) ? s.sections.map((x) => newSection(x ?? {})) : [],
    createdAt: num(s.createdAt, now),
    updatedAt: num(s.updatedAt, now),
  };
};

export const SERIES_COLORS: SeriesColor[] = ['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet', 'slate'];

export const newSeries = (s: Partial<Record<keyof Series, unknown>> = {}): Series => {
  const now = Date.now();
  return {
    id: str(s.id) || uid(),
    title: str(s.title, 'Untitled series') || 'Untitled series',
    description: str(s.description),
    audience: str(s.audience, 'Kids'),
    color: (SERIES_COLORS as string[]).includes(str(s.color)) ? (s.color as SeriesColor) : 'indigo',
    startDate: str(s.startDate) || todayISO(),
    bigIdea: str(s.bigIdea),
    memoryVerse: str(s.memoryVerse),
    createdAt: num(s.createdAt, now),
    updatedAt: num(s.updatedAt, now),
  };
};

export const clonePart = (p: Part): Part => ({
  ...p,
  id: uid(),
  supplies: p.supplies.map((s) => ({ ...s, id: uid() })),
  media: p.media.map((l) => ({ ...l, id: uid() })),
  resources: p.resources.map((l) => ({ ...l, id: uid() })),
});

export const cloneSection = (s: Section): Section => ({ ...s, id: uid(), parts: s.parts.map(clonePart) });

export const cloneService = (s: Service, overrides: Partial<Service> = {}): Service => {
  const now = Date.now();
  return { ...s, id: uid(), sections: s.sections.map(cloneSection), createdAt: now, updatedAt: now, ...overrides };
};
