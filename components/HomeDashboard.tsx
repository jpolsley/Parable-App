import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock, FileText, Layers, Package, Plus, Printer } from 'lucide-react';
import { Series, Service } from '../types';
import { todayISO } from '../lib/factory';
import { formatDate, formatDuration, serviceMinutes } from '../lib/time';
import { daysUntil, readiness, relativeDay, supplyProgress, unfinishedParts } from '../lib/readiness';
import { COLOR_CLASSES, weeksOf } from '../lib/series';
import { navigate } from '../lib/route';
import { useStore } from '../store/StoreContext';
import { PART_TYPES } from '../lib/partTypes';
import { SeriesCard, shortDate } from './cards';
import { NewSeriesDialog } from './NewServiceDialog';
import { Button, Meter } from './ui';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const Stat: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; tone: string; onClick?: () => void }> = ({ icon: Icon, label, value, tone, onClick }) => (
  <button type="button" onClick={onClick} disabled={!onClick} className="text-left bg-white border border-line rounded-2xl p-4 enabled:hover:shadow-card enabled:hover:border-gray-300 transition-all flex items-center gap-4">
    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-5 h-5" /></span>
    <span>
      <span className="block text-2xl font-display leading-none">{value}</span>
      <span className="block text-xs text-gray-500 mt-1">{label}</span>
    </span>
  </button>
);

const Panel: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <section className="bg-white border border-line rounded-2xl">
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <h2 className="font-display text-lg">{title}</h2>
      {action}
    </div>
    <div className="px-5 pb-5">{children}</div>
  </section>
);

export const HomeDashboard: React.FC = () => {
  const { db, print, aiSettings, aiStatus, setSettingsOpen, recheckAi } = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const today = todayISO();
  const seriesById = new Map<string, Series>(db.series.map((s) => [s.id, s]));

  const upcoming = [...db.services].filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];
  const later = upcoming.slice(1, 7);
  const recent = [...db.services].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const soon = upcoming.filter((s) => daysUntil(s.date, today) <= 14);
  const unfinished = soon.flatMap((service) => unfinishedParts(service).map((x) => ({ service, ...x })));
  const attention = unfinished.slice(0, 6);
  const suppliesLeft = soon.reduce((n, s) => { const p = supplyProgress(s); return n + p.total - p.gathered; }, 0);

  const active = db.series
    .map((series) => ({ series, weeks: weeksOf(db, series.id) }))
    .filter(({ weeks }) => weeks.length === 0 || weeks[weeks.length - 1].date >= today)
    .sort((a, b) => (a.weeks.find((w) => w.date >= today)?.date ?? '9999').localeCompare(b.weeks.find((w) => w.date >= today)?.date ?? '9999'));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
      <section className="py-8 md:py-10 flex flex-col md:flex-row md:items-end gap-6 justify-between">
        <div>
          <p className="text-sm text-gray-500">{formatDate(today)}</p>
          <h1 className="text-3xl md:text-4xl font-display mt-1">{greeting()}</h1>
          <p className="text-gray-500 mt-1">
            {active.length ? `${active.length} active series${next ? ` · next up ${relativeDay(daysUntil(next.date, today)).toLowerCase()}` : ''}.` : 'Start by creating your first series.'}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setNewOpen(true)}>New series</Button>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={Layers} tone="bg-indigo-50 text-indigo-600" label="Active series" value={active.length} onClick={() => navigate('/series')} />
        <Stat icon={CalendarDays} tone="bg-sky-50 text-sky-600" label="Upcoming weeks" value={upcoming.length} />
        <Stat icon={AlertTriangle} tone="bg-amber-50 text-amber-600" label="Parts to finish · 2 wks" value={unfinished.length} />
        <Stat icon={Package} tone="bg-emerald-50 text-emerald-600" label="Supplies to gather · 2 wks" value={suppliesLeft} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {next && <NextUp service={next} series={next.seriesId ? seriesById.get(next.seriesId) : undefined} today={today} onPrint={(kind) => print(next.id, { kind })} />}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg">Active series</h2>
              <button type="button" className="text-sm text-gray-500 hover:text-ink inline-flex items-center gap-1" onClick={() => navigate('/series')}>All series <ArrowRight className="w-4 h-4" /></button>
            </div>
            {active.length === 0 ? (
              <div className="border-2 border-dashed border-line rounded-2xl bg-white text-center py-10 px-4">
                <Layers className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                <p className="font-medium">No active series</p>
                <p className="text-sm text-gray-500 mt-1 mb-4">Pick a title, a number of weeks, and a weekly layout. Every week is ready to fill in.</p>
                <Button size="sm" icon={Plus} onClick={() => setNewOpen(true)}>New series</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {active.slice(0, 4).map(({ series, weeks }) => <SeriesCard key={series.id} series={series} weeks={weeks} />)}
              </div>
            )}
          </section>

          <Panel title="Needs attention" action={<span className="text-xs text-gray-400">Next 2 weeks</span>}>
            {attention.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-700 py-2"><CheckCircle2 className="w-4 h-4" /> Every part in the next two weeks has content.</p>
            ) : (
              <ul className="divide-y divide-line">
                {attention.map(({ service, section, part }) => {
                  const Icon = PART_TYPES[part.type].icon;
                  const series = service.seriesId ? seriesById.get(service.seriesId) : undefined;
                  return (
                    <li key={part.id}>
                      <button type="button" onClick={() => navigate(`/s/${service.id}/p/${part.id}`)} className="w-full flex items-center gap-3 py-2.5 text-left group">
                        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="font-medium text-sm group-hover:text-accent">{part.title}</span>
                          <span className="block text-xs text-gray-500 truncate">
                            {series ? `${series.title} · Wk ${service.week}` : service.title} · {section.title}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{relativeDay(daysUntil(service.date, today))}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {unfinished.length > attention.length && <p className="text-xs text-gray-400 mt-2">+ {unfinished.length - attention.length} more</p>}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Coming up">
            {later.length === 0 ? <p className="text-sm text-gray-500">Nothing else scheduled.</p> : (
              <ul className="space-y-1">
                {later.map((s) => {
                  const series = s.seriesId ? seriesById.get(s.seriesId) : undefined;
                  return (
                    <li key={s.id}>
                      <button type="button" onClick={() => navigate(`/s/${s.id}`)} className="w-full flex items-center gap-3 py-2 text-left group">
                        <span className="w-12 text-center shrink-0">
                          <span className="block text-[10px] uppercase font-semibold text-gray-400">{new Date(`${s.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span>
                          <span className="block font-display text-lg leading-none">{new Date(`${s.date}T12:00:00`).getDate()}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium truncate group-hover:text-accent">{s.title}</span>
                          <span className="text-xs text-gray-500 inline-flex items-center gap-1.5 truncate">
                            {series && <span className={`w-1.5 h-1.5 rounded-full ${COLOR_CLASSES[series.color].dot}`} />}
                            {series ? `${series.title} · Wk ${s.week}` : 'Stand-alone'}
                          </span>
                        </span>
                        <span className="text-xs tabular-nums text-gray-400">{readiness(s).pct}%</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="AI assistant">
            {aiStatus === 'off' ? (
              <>
                <p className="text-sm text-gray-500">Off. Everything works without it. Turn it on to add draft and suggest buttons from your own self-hosted model.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setSettingsOpen(true)}>Set up AI</Button>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm">
                  <span className={`w-2.5 h-2.5 rounded-full ${aiStatus === 'online' ? 'bg-emerald-500' : aiStatus === 'offline' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
                  {aiStatus === 'online' ? `Connected to ${aiSettings.model}` : aiStatus === 'offline' ? "Can't reach your AI server" : 'Checking…'}
                </p>
                {aiStatus === 'offline' && <p className="text-xs text-gray-500 mt-2">Keep building. AI buttons work again when the server is back.</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}>Settings</Button>
                  {aiStatus === 'offline' && <Button size="sm" variant="ghost" onClick={recheckAi}>Retry</Button>}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Recently edited">
            {recent.length === 0 ? <p className="text-sm text-gray-500">Nothing yet.</p> : (
              <ul className="space-y-0.5">
                {recent.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => navigate(`/s/${s.id}`)} className="w-full flex items-center gap-2 py-1.5 text-left group">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="flex-1 truncate group-hover:text-accent text-sm">{s.title}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(s.updatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <NewSeriesDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
};

const NextUp: React.FC<{ service: Service; series?: Series; today: string; onPrint: (kind: 'guide' | 'supplies' | 'run-sheet') => void }> = ({ service, series, today, onPrint }) => {
  const r = readiness(service);
  const sp = supplyProgress(service);
  return (
    <section className="rounded-2xl p-6 text-white bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 shadow-lift">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">
            Next up · {relativeDay(daysUntil(service.date, today))}{series && ` · ${series.title}, week ${service.week}`}
          </p>
          <h2 className="font-display text-2xl md:text-3xl mt-1 leading-tight">{service.title}</h2>
          <p className="text-sm text-white/80 mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" />{shortDate(service.date)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />{formatDuration(serviceMinutes(service))}</span>
            <span>{service.audience} · {service.classSize} kids</span>
          </p>
          {service.bigIdea && <p className="mt-3 text-white/90">{service.bigIdea}</p>}
        </div>
        <button type="button" onClick={() => navigate(`/s/${service.id}`)} className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-indigo-50">
          Open <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-5 mt-6">
        <Meter dark value={r.ready} total={r.total} label="Parts with content" />
        <Meter dark value={sp.gathered} total={sp.total} label="Supplies gathered" />
      </div>
      <div className="flex flex-wrap gap-2 mt-5">
        {(['guide', 'run-sheet', 'supplies'] as const).map((kind) => (
          <button key={kind} type="button" onClick={() => onPrint(kind)} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25">
            <Printer className="w-4 h-4" /> {kind === 'guide' ? 'Leader guide' : kind === 'run-sheet' ? 'Run sheet' : 'Supply list'}
          </button>
        ))}
      </div>
    </section>
  );
};

const timeAgo = (ts: number) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};
