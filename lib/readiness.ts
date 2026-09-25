import { Part, Section, Service } from '../types';
import { aggregateSupplies } from './supplies';
import { visibleParts } from './time';

// Songs and videos are ready once they have a link; everything else needs a script or instructions.
export const partReady = (p: Part) =>
  !!(p.script.trim() || p.instructions.trim()) || ((p.type === 'worship' || p.type === 'video') && p.media.some((m) => m.url));

export const readiness = (service: Service) => {
  const parts = service.sections.flatMap(visibleParts);
  const ready = parts.filter(partReady).length;
  return { ready, total: parts.length, pct: parts.length ? Math.round((ready / parts.length) * 100) : 0 };
};

export const supplyProgress = (service: Service) => {
  const lines = aggregateSupplies(service);
  const checked = new Set(service.checkedSupplies);
  return { gathered: lines.filter((l) => checked.has(l.key)).length, total: lines.length };
};

export const unfinishedParts = (service: Service): { section: Section; part: Part }[] =>
  service.sections.flatMap((section) => visibleParts(section).filter((p) => !partReady(p)).map((part) => ({ section, part })));

export const daysUntil = (iso: string, today: string) =>
  Math.round((new Date(`${iso}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000);

export const relativeDay = (days: number) =>
  days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days < 0 ? `${-days} day${days === -1 ? '' : 's'} ago` : `In ${days} days`;
