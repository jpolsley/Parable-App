import { Database, Section, Series, SeriesColor, Service } from '../types';
import { addDays, newPart, newSection, newSeries, newService } from './factory';

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

export const weeksOf = (db: Database, seriesId: string) =>
  db.services.filter((s) => s.seriesId === seriesId).sort((a, b) => (a.week ?? 0) - (b.week ?? 0) || a.date.localeCompare(b.date));

export const seriesRange = (weeks: Service[]) => (weeks.length ? { first: weeks[0].date, last: weeks[weeks.length - 1].date } : null);

// Number weeks in the given order and put them on the series' weekly schedule.
export const reschedule = (db: Database, seriesId: string, orderedIds?: string[]): Database => {
  const series = db.series.find((s) => s.id === seriesId);
  if (!series) return db;
  const order = orderedIds ?? weeksOf(db, seriesId).map((s) => s.id);
  const position = new Map(order.map((id, i) => [id, i]));
  return {
    ...db,
    services: db.services.map((s) => {
      const i = position.get(s.id);
      return i === undefined ? s : { ...s, week: i + 1, date: addDays(series.startDate, 7 * i), audience: s.audience || series.audience };
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
