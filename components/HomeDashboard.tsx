import React, { useState } from 'react';
import {
  AlertTriangle, ArrowRight, Bookmark, CalendarDays, CheckCircle2, Clock, FileText, Layers, Package, Plus, Printer, Sparkles, Upload,
} from 'lucide-react';
import { Service } from '../types';
import { todayISO } from '../lib/factory';
import { formatDate, formatDuration, serviceMinutes } from '../lib/time';
import { daysUntil, readiness, relativeDay, supplyProgress, unfinishedParts } from '../lib/readiness';
import { navigate } from '../lib/route';
import { useStore } from '../store/StoreContext';
import { PART_TYPES } from '../lib/partTypes';
import { NewServiceDialog, SeriesDialog } from './NewServiceDialog';
import { Button } from './ui';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const Meter: React.FC<{ value: number; total: number; label: string; dark?: boolean }> = ({ value, total, label, dark }) => {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className={`flex justify-between text-xs mb-1 ${dark ? 'text-white/70' : 'text-gray-600'}`}>
        <span>{label}</span>
        <span className="font-mono">{total ? `${value}/${total}` : '—'}</span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${dark ? 'bg-white/20' : 'bg-gray-200'}`} role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : dark ? 'bg-white' : 'bg-charcoal'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; onClick?: () => void }> = ({ icon: Icon, label, value, onClick }) => (
  <button type="button" onClick={onClick} disabled={!onClick} className="text-left bg-white border-2 border-gray-200 rounded-xl p-4 enabled:hover:border-black transition-colors">
    <Icon className="w-5 h-5 text-gray-400" />
    <div className="text-3xl font-serif mt-2">{value}</div>
    <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mt-0.5">{label}</div>
  </button>
);

const Panel: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, action, children, className = '' }) => (
  <section className={`bg-white border-2 border-gray-200 rounded-xl ${className}`}>
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <h2 className="font-serif text-xl">{title}</h2>
      {action}
    </div>
    <div className="px-5 pb-5">{children}</div>
  </section>
);

export const HomeDashboard: React.FC = () => {
  const { db, print, aiSettings, aiStatus, setSettingsOpen, recheckAi } = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const today = todayISO();

  const byDate = [...db.services].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = byDate.filter((s) => s.date >= today);
  const next = upcoming[0];
  const later = upcoming.slice(1, 7);
  const recent = [...db.services].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const nextTwoWeeks = upcoming.filter((s) => daysUntil(s.date, today) <= 14);
  const unfinished = nextTwoWeeks.flatMap((service) => unfinishedParts(service).map((x) => ({ service, ...x })));
  const attention = unfinished.slice(0, 8);
  const suppliesLeft = nextTwoWeeks.reduce((n, s) => { const p = supplyProgress(s); return n + p.total - p.gathered; }, 0);

  const series = new Map<string, Service[]>();
  for (const s of byDate) if (s.series) series.set(s.series, [...(series.get(s.series) ?? []), s]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
      <section className="py-8 md:py-10 flex flex-col md:flex-row md:items-end gap-6 justify-between">
        <div>
          <p className="text-sm text-gray-500">{formatDate(today)}</p>
          <h1 className="text-4xl md:text-5xl font-serif mt-1">{greeting()}.</h1>
          <p className="text-gray-600 mt-2">
            {next ? <>Your next service is <strong>{next.title}</strong>, {relativeDay(daysUntil(next.date, today)).toLowerCase()}.</> : 'No upcoming services scheduled yet.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={Plus} onClick={() => setNewOpen(true)}>New service</Button>
          {aiSettings.enabled && <Button variant="ai" icon={Sparkles} onClick={() => setSeriesOpen(true)}>Draft a series</Button>}
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={CalendarDays} label="Upcoming services" value={upcoming.length} onClick={() => navigate('/services')} />
        <Stat icon={AlertTriangle} label="Parts to finish (2 wks)" value={unfinished.length} />
        <Stat icon={Package} label="Supplies to gather (2 wks)" value={suppliesLeft} />
        <Stat icon={Bookmark} label="Parts in library" value={db.library.length} onClick={() => navigate('/library')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {next ? <NextUp service={next} today={today} onPrint={(kind) => print(next.id, { kind })} /> : (
            <Panel title="Next up">
              <div className="text-center py-8">
                <Layers className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                <p className="font-medium">Nothing scheduled</p>
                <p className="text-sm text-gray-500 mt-1 mb-4">Create a service from a template to get started.</p>
                <Button size="sm" icon={Plus} onClick={() => setNewOpen(true)}>New service</Button>
              </div>
            </Panel>
          )}

          <Panel title="Needs attention" action={<span className="text-xs text-gray-500">Next 2 weeks</span>}>
            {attention.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-700 py-2"><CheckCircle2 className="w-4 h-4" /> Every part in the next two weeks has content.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {attention.map(({ service, section, part }) => {
                  const Icon = PART_TYPES[part.type].icon;
                  return (
                    <li key={part.id}>
                      <button type="button" onClick={() => navigate(`/s/${service.id}/p/${part.id}`)} className="w-full flex items-center gap-3 py-2.5 text-left group">
                        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="font-medium group-hover:underline">{part.title}</span>
                          <span className="block text-xs text-gray-500 truncate">{service.title} · {section.title} · needs a script or instructions</span>
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{relativeDay(daysUntil(service.date, today))}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {unfinished.length > attention.length && <p className="text-xs text-gray-500 mt-2">+ {unfinished.length - attention.length} more</p>}
          </Panel>

          <Panel title="Coming up" action={<button type="button" className="text-sm text-gray-500 hover:text-black inline-flex items-center gap-1" onClick={() => navigate('/services')}>All services <ArrowRight className="w-4 h-4" /></button>}>
            {later.length === 0 ? <p className="text-sm text-gray-500 py-2">Nothing else scheduled.</p> : (
              <ul className="divide-y divide-gray-100">
                {later.map((s) => {
                  const r = readiness(s);
                  return (
                    <li key={s.id}>
                      <button type="button" onClick={() => navigate(`/s/${s.id}`)} className="w-full grid grid-cols-[88px_1fr_auto] sm:grid-cols-[110px_1fr_140px] items-center gap-3 py-3 text-left group">
                        <span className="text-sm">
                          <span className="block font-semibold">{new Date(`${s.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span className="text-xs text-gray-500">{relativeDay(daysUntil(s.date, today))}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="font-medium group-hover:underline block truncate">{s.title}</span>
                          <span className="text-xs text-gray-500">{[s.series && `${s.series}${s.week ? ` · Wk ${s.week}` : ''}`, s.audience].filter(Boolean).join(' · ')}</span>
                        </span>
                        <span className="hidden sm:block"><Meter value={r.ready} total={r.total} label="Ready" /></span>
                        <span className="sm:hidden text-xs font-mono text-gray-600">{r.pct}%</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="AI assistant">
            {aiStatus === 'off' ? (
              <>
                <p className="text-sm text-gray-600">Off. Everything in Parable works without it. Turn it on to add draft and suggest buttons from your own self-hosted model.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setSettingsOpen(true)}>Set up AI</Button>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm">
                  <span className={`w-2.5 h-2.5 rounded-full ${aiStatus === 'online' ? 'bg-emerald-500' : aiStatus === 'offline' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
                  {aiStatus === 'online' ? `Connected to ${aiSettings.model}` : aiStatus === 'offline' ? "Can't reach your AI server" : 'Checking…'}
                </p>
                {aiStatus === 'offline' && <p className="text-xs text-gray-500 mt-2">You can keep building. AI buttons will work again when the server is back.</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}>Settings</Button>
                  {aiStatus === 'offline' && <Button size="sm" variant="ghost" onClick={recheckAi}>Retry</Button>}
                </div>
              </>
            )}
          </Panel>

          {series.size > 0 && (
            <Panel title="Series">
              <ul className="space-y-4">
                {[...series.entries()].map(([name, items]) => {
                  const done = items.filter((s) => s.date < today).length;
                  return (
                    <li key={name}>
                      <button type="button" className="w-full text-left" onClick={() => navigate(`/s/${(items.find((s) => s.date >= today) ?? items[items.length - 1]).id}`)}>
                        <span className="font-medium hover:underline">{name}</span>
                        <div className="mt-1.5"><Meter value={done} total={items.length} label={`${items.length} weeks`} /></div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}

          <Panel title="Recently edited">
            {recent.length === 0 ? <p className="text-sm text-gray-500">Nothing yet.</p> : (
              <ul className="space-y-1">
                {recent.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => navigate(`/s/${s.id}`)} className="w-full flex items-center gap-2 py-1.5 text-left group">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="flex-1 truncate group-hover:underline text-sm">{s.title}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(s.updatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Your data">
            <p className="text-sm text-gray-600">Saved in this browser. Back up regularly, or move your services to another device.</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" icon={Upload} onClick={() => navigate('/services')}>Import / back up</Button>
            </div>
          </Panel>
        </div>
      </div>

      <NewServiceDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <SeriesDialog open={seriesOpen} onClose={() => setSeriesOpen(false)} />
    </div>
  );
};

const NextUp: React.FC<{ service: Service; today: string; onPrint: (kind: 'guide' | 'supplies' | 'run-sheet') => void }> = ({ service, today, onPrint }) => {
  const r = readiness(service);
  const sp = supplyProgress(service);
  const days = daysUntil(service.date, today);
  return (
    <section className="bg-charcoal text-white rounded-xl p-6 shadow-hard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Next up · {relativeDay(days)}</p>
          <h2 className="font-serif text-3xl mt-1 leading-tight">{service.title}</h2>
          <p className="text-sm text-white/70 mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" />{formatDate(service.date)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />{formatDuration(serviceMinutes(service))}</span>
            <span>{service.audience} · {service.classSize} kids</span>
          </p>
          {service.bigIdea && <p className="mt-3 italic text-white/90">{service.bigIdea}</p>}
        </div>
        <Button variant="outline" className="!bg-white !text-charcoal !border-white hover:!bg-white/90" onClick={() => navigate(`/s/${service.id}`)}>
          Open <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-5 mt-6">
        <Meter dark value={r.ready} total={r.total} label="Parts with content" />
        <Meter dark value={sp.gathered} total={sp.total} label="Supplies gathered" />
      </div>
      <div className="flex flex-wrap gap-2 mt-5">
        {(['guide', 'run-sheet', 'supplies'] as const).map((kind) => (
          <button key={kind} type="button" onClick={() => onPrint(kind)} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20">
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
