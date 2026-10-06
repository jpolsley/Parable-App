import { Database, Section, Series, SeriesColor, Service, TeachingRun } from '../types';
import { addDays, newPart, newRun, newSection, newSeries, newService } from './factory';
import { formatDate } from './time';

// Full class strings so Tailwind picks them up.
export const COLOR_CLASSES: Record<SeriesColor, { bar: string; soft: string; text: string; dot: string }> = {
  indigo: { bar: 'bg-indigo-500', soft: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  sky: { bar: 'bg-sky-500', soft: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  emerald: { bar: 'bg-emerald-500', soft: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  amber: { bar: 'bg-amber-500', soft: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  rose: { bar: 'bg-rose-500', soft: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  violet: { bar: 'bg-violet-500', soft: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  slate: { bar: 'bg-slate-500', soft: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
};

// A series' lessons in order. Lessons have numbers, not dates: dates belong to runs (below).
export const weeksOf = (db: Database, seriesId: string) =>
  db.services.filter((s) => s.seriesId === seriesId).sort((a, b) => (a.week ?? 0) - (b.week ?? 0) || a.createdAt - b.createdAt);

// Number lessons in the given order.
export const reschedule = (db: Database, seriesId: string, orderedIds?: string[]): Database => {
  const series = db.series.find((s) => s.id === seriesId);
  if (!series) return db;
  const order = orderedIds ?? weeksOf(db, seriesId).map((s) => s.id);
  const position = new Map(order.map((id, i) => [id, i]));
  return {
    ...db,
    services: db.services.map((s) => {
      const i = position.get(s.id);
      return i === undefined ? s : { ...s, week: i + 1, audience: s.audience || series.audience };
    }),
  };
};

// Same sections and parts (titles, types, minutes) with the content cleared: next week's starting point.
export const layoutOf = (service: Service): Section[] =>
  service.sections.map((s) => newSection({ title: s.title, parts: s.parts.map((p) => newPart({ title: p.title, type: p.type, minutes: p.minutes })) }));

// Older saves grouped services by a free-text series name; turn those into real series.
export const migrateLegacySeries = (rawServices: Record<string, unknown>[], series: Series[]) => {
  const byTitle = new Map(series.map((s) => [s.title, s]));
  const created: Series[] = [];
  const services = rawServices.map((raw) => {
    const legacy = typeof raw.series === 'string' ? raw.series.trim() : '';
    if (raw.seriesId || !legacy) return newService(raw);
    let target = byTitle.get(legacy);
    if (!target) {
      target = newSeries({ title: legacy, audience: raw.audience, startDate: raw.date });
      byTitle.set(legacy, target);
      created.push(target);
    }
    return newService({ ...raw, seriesId: target.id });
  });
  return { services, series: [...series, ...created] };
};

// ---------- Runs: each time a series is taught ----------

export type RunPace = 'weekly' | 'daily' | 'custom';

// Dates for a new run: every week or every day from the first date, or left blank to fill in.
export const planDates = (lessons: Service[], first: string, pace: RunPace): Record<string, string> =>
  Object.fromEntries(lessons.map((l, i) => [l.id, pace === 'custom' || !first ? '' : addDays(first, pace === 'weekly' ? 7 * i : i)]));

const ISO = /^\d{4}-\d{2}-\d{2}$/;
// A run's entry for a lesson: a real date reads as one; anything else ("Sat morning") shows as typed.
export const formatWhen = (value: string) => (ISO.test(value) ? formatDate(value) : value);
export const shortWhen = (value: string) =>
  ISO.test(value) ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : value;

export const printRunOf = (series?: Series): TeachingRun | undefined =>
  series?.printRun ? series.runs.find((r) => r.id === series.printRun) : undefined;

// Lessons as they print: dates and start time come from the chosen run, or none at all.
export const forPrint = (series: Series | undefined, lessons: Service[]): Service[] => {
  const run = printRunOf(series);
  return lessons.map((l) => ({ ...l, date: run?.dates[l.id] ?? '', startTime: run?.time ?? '' }));
};

// Saves from before runs existed: the dates the lessons were scheduled on become the series' first run.
export const migrateRuns = (series: Series[], services: Service[], raw: unknown[]): Series[] =>
  series.map((s, i) => {
    const r = raw[i] as Record<string, unknown> | undefined;
    if (!r || Array.isArray(r.runs)) return s;
    const lessons = services.filter((x) => x.seriesId === s.id).sort((a, b) => (a.week ?? 0) - (b.week ?? 0));
    if (!lessons.length) return s;
    const run = newRun({ name: 'First schedule', time: lessons[0].startTime, dates: Object.fromEntries(lessons.map((l) => [l.id, l.date])) });
    return { ...s, runs: [run], printRun: run.id };
  });
