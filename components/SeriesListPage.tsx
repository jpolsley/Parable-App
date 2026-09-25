import React, { useRef, useState } from 'react';
import { Download, Layers, Plus, Search, Upload } from 'lucide-react';
import { Database } from '../types';
import { cloneService, todayISO } from '../lib/factory';
import { downloadJson, readJsonFile } from '../lib/files';
import { weeksOf } from '../lib/series';
import { useStore } from '../store/StoreContext';
import { SeriesCard, ServiceCard } from './cards';
import { NewSeriesDialog, NewServiceDialog } from './NewServiceDialog';
import { Button, EmptyState, inputClass } from './ui';

export const SeriesListPage: React.FC = () => {
  const { db, addServices, deleteService, importDatabase, toast } = useStore();
  const [query, setQuery] = useState('');
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = todayISO();
  const q = query.trim().toLowerCase();

  const all = db.series
    .map((series) => ({ series, weeks: weeksOf(db, series.id) }))
    .filter(({ series, weeks }) => !q || [series.title, series.audience, series.description, series.bigIdea, ...weeks.map((w) => w.title)].some((f) => f.toLowerCase().includes(q)))
    .sort((a, b) => (a.weeks[0]?.date ?? a.series.startDate).localeCompare(b.weeks[0]?.date ?? b.series.startDate));
  const isPast = (weeks: { date: string }[]) => weeks.length > 0 && weeks[weeks.length - 1].date < today;
  const current = all.filter((x) => !isPast(x.weeks));
  const past = all.filter((x) => isPast(x.weeks)).reverse();
  const standalone = db.services
    .filter((s) => !s.seriesId && (!q || [s.title, s.audience, s.bigIdea].some((f) => f.toLowerCase().includes(q))))
    .sort((a, b) => b.date.localeCompare(a.date));

  const onImport = async (file: File) => {
    try {
      const count = importDatabase((await readJsonFile(file)) as Partial<Database>);
      toast(count ? `Imported ${count} item${count === 1 ? '' : 's'}` : 'Nothing to import in that file');
    } catch {
      toast("That file couldn't be read. Choose a .parable.json export or backup.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
      <section className="py-8 md:py-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display">Series</h1>
          <p className="text-gray-500 mt-1">Plan your teaching in series, week by week.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={Plus} onClick={() => setSeriesOpen(true)}>New series</Button>
          <Button variant="outline" icon={Plus} onClick={() => setServiceOpen(true)}>Stand-alone service</Button>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${inputClass} pl-9`} placeholder="Search series and weeks" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>Import</Button>
          <Button variant="ghost" size="sm" icon={Download} onClick={() => downloadJson(`parable-backup-${today}.json`, db)}>Back up everything</Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
        </div>
      </div>

      {db.series.length === 0 && standalone.length === 0 ? (
        <div className="border-2 border-dashed border-line rounded-2xl bg-white">
          <EmptyState icon={Layers} title="No series yet">
            Create a series, choose how many weeks, and each week starts from a layout like Kids Service or Youth Night.
            <div className="mt-4"><Button icon={Plus} onClick={() => setSeriesOpen(true)}>New series</Button></div>
          </EmptyState>
        </div>
      ) : (
        <>
          {current.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Current & upcoming</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {current.map(({ series, weeks }) => <SeriesCard key={series.id} series={series} weeks={weeks} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className="mb-10">
              <button type="button" onClick={() => setShowPast(!showPast)} className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3 hover:text-ink">
                Past series ({past.length}) {showPast ? '▾' : '▸'}
              </button>
              {(showPast || q) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {past.map(({ series, weeks }) => <SeriesCard key={series.id} series={series} weeks={weeks} />)}
                </div>
              )}
            </section>
          )}
          {standalone.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Stand-alone services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {standalone.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    onDuplicate={() => { addServices([cloneService(s, { title: `${s.title} (copy)`, checkedSupplies: [] })]); toast('Service duplicated'); }}
                    onDelete={() => deleteService(s.id)}
                  />
                ))}
              </div>
            </section>
          )}
          {q && current.length + past.length + standalone.length === 0 && <EmptyState icon={Search} title="Nothing matches your search" />}
        </>
      )}

      <NewSeriesDialog open={seriesOpen} onClose={() => setSeriesOpen(false)} />
      <NewServiceDialog open={serviceOpen} onClose={() => setServiceOpen(false)} />
    </div>
  );
};
