import React from 'react';
import { CalendarDays, Clock, Copy, Download, FileText, Trash2 } from 'lucide-react';
import { Series, Service } from '../types';
import { todayISO } from '../lib/factory';
import { downloadJson, slug } from '../lib/files';
import { COLOR_CLASSES, seriesRange } from '../lib/series';
import { daysUntil, readiness, relativeDay } from '../lib/readiness';
import { formatDate, formatDuration, serviceMinutes } from '../lib/time';
import { navigate } from '../lib/route';
import { Menu, MenuDivider, MenuItem, Meter } from './ui';

export const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const SeriesCard: React.FC<{ series: Series; weeks: Service[] }> = ({ series, weeks }) => {
  const today = todayISO();
  const range = seriesRange(weeks);
  const next = weeks.find((w) => w.date >= today);
  const totals = weeks.reduce((t, w) => { const r = readiness(w); return { ready: t.ready + r.ready, total: t.total + r.total }; }, { ready: 0, total: 0 });
  const c = COLOR_CLASSES[series.color];
  return (
    <button type="button" onClick={() => navigate(`/series/${series.id}`)} className="group text-left bg-white border border-line rounded-2xl overflow-hidden hover:shadow-card hover:border-gray-300 transition-all flex flex-col">
      <div className={`h-1.5 w-full ${c.bar}`} />
      <div className="p-5 flex-1 flex flex-col w-full">
        <p className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>{series.audience}</p>
        <h3 className="font-display text-xl mt-1 leading-snug group-hover:text-accent">{series.title}</h3>
        {(series.bigIdea || series.description) && <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{series.bigIdea || series.description}</p>}
        <p className="text-xs text-gray-500 mt-3 inline-flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {weeks.length} week{weeks.length === 1 ? '' : 's'}{range && ` · ${shortDate(range.first)} – ${shortDate(range.last)}`}
        </p>
        <div className="mt-auto pt-4 space-y-3">
          <Meter value={totals.ready} total={totals.total} label="Parts with content" />
          {next && (
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Next:</span> Wk {next.week} · {next.title} <span className="text-gray-400">({relativeDay(daysUntil(next.date, today)).toLowerCase()})</span>
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export const ServiceCard: React.FC<{ service: Service; onDuplicate: () => void; onDelete: () => void }> = ({ service, onDuplicate, onDelete }) => {
  const parts = service.sections.reduce((n, s) => n + s.parts.length, 0);
  return (
    <div className="relative bg-white border border-line rounded-2xl p-5 hover:shadow-card hover:border-gray-300 transition-all">
      <button type="button" onClick={() => navigate(`/s/${service.id}`)} className="text-left w-full group">
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{service.audience}</p>
        <h3 className="font-display text-lg mt-1 pr-8 leading-snug group-hover:text-accent">{service.title}</h3>
        {service.bigIdea && <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{service.bigIdea}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-4">
          <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(service.date)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(serviceMinutes(service))}</span>
          <span className="inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{parts} parts</span>
        </div>
      </button>
      <div className="absolute top-3 right-3">
        <Menu label="Service actions">
          <MenuItem icon={Copy} onClick={onDuplicate}>Duplicate</MenuItem>
          <MenuItem icon={Download} onClick={() => downloadJson(`${slug(service.title)}.parable.json`, { version: 1, series: [], services: [service], library: [] })}>Export file</MenuItem>
          <MenuDivider />
          <MenuItem icon={Trash2} danger onClick={onDelete}>Delete</MenuItem>
        </Menu>
      </div>
    </div>
  );
};
