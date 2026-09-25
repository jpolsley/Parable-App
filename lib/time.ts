import { Section, Service } from '../types';

export const visibleParts = (section: Section) => (section.hidden ? [] : section.parts.filter((p) => !p.hidden));

export const sectionMinutes = (section: Section) =>
  visibleParts(section).reduce((total, p) => total + (p.minutes || 0), 0);

export const serviceMinutes = (service: Service) =>
  service.sections.reduce((total, s) => total + sectionMinutes(s), 0);

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const parseClock = (hhmm: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const formatClock = (minutesOfDay: number) => {
  const total = ((Math.round(minutesOfDay) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

// Start time for every visible section and part, keyed by id. Empty when no valid start time is set.
export const buildSchedule = (service: Service): Record<string, string> => {
  let clock = parseClock(service.startTime);
  if (clock === null) return {};
  const times: Record<string, string> = {};
  for (const section of service.sections) {
    if (section.hidden) continue;
    times[section.id] = formatClock(clock);
    for (const part of section.parts) {
      if (part.hidden) continue;
      times[part.id] = formatClock(clock);
      clock += part.minutes || 0;
    }
  }
  return times;
};

export const formatDate = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};
