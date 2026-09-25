import React, { useRef, useState } from 'react';
import { CalendarDays, Clock, Copy, Download, FileText, Layers, MoreVertical, Plus, Search, Sparkles, Trash2, Upload } from 'lucide-react';
import { Service } from '../types';
import { cloneService } from '../lib/factory';
import { downloadJson, readJsonFile, slug } from '../lib/files';
import { formatDate, formatDuration, serviceMinutes } from '../lib/time';
import { navigate } from '../lib/route';
import { useStore } from '../store/StoreContext';
import { NewServiceDialog, SeriesDialog } from './NewServiceDialog';
import { Button, EmptyState, Menu, MenuDivider, MenuItem, inputClass } from './ui';

export const ServicesPage: React.FC = () => {
  const { db, addServices, deleteService, importDatabase, toast, aiSettings } = useStore();
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const services = [...db.services]
    .filter((s) => !q || [s.title, s.series, s.audience, s.bigIdea].some((f) => f.toLowerCase().includes(q)))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.week ?? 0) - (b.week ?? 0));

  // Group by series; services without one go under "Services".
  const groups = new Map<string, Service[]>();
  for (const s of services) {
    const key = s.series || '';
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const groupList = [...groups.entries()].sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));

  const onImport = async (file: File) => {
    try {
      const data = (await readJsonFile(file)) as { services?: unknown[]; library?: unknown[] };
      const count = importDatabase({ services: (data.services ?? []) as Service[], library: (data.library ?? []) as never[] });
      toast(count ? `Imported ${count} item${count === 1 ? '' : 's'}` : 'Nothing to import in that file');
    } catch {
      toast("That file couldn't be read. Choose a .parable.json export or backup.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
      <section className="py-8 md:py-10">
        <h1 className="text-4xl md:text-5xl font-serif">Services</h1>
        <p className="text-gray-600 mt-2">Every service you've built, grouped by series.</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Button icon={Plus} onClick={() => setNewOpen(true)}>New service</Button>
          {aiSettings.enabled && <Button variant="ai" icon={Sparkles} onClick={() => setSeriesOpen(true)}>Draft a series with AI</Button>}
          <Button variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>Import</Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
        </div>
      </section>

      {db.services.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white/50">
          <EmptyState icon={Layers} title="No services yet">
            Start with a template like Kids Service or Youth Night, or build one from scratch.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={`${inputClass} pl-9`} placeholder="Search services" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" icon={Download} onClick={() => downloadJson(`parable-backup-${new Date().toISOString().slice(0, 10)}.json`, db)}>
              Back up everything
            </Button>
          </div>
          {groupList.map(([series, items]) => (
            <section key={series || '_'} className="mb-10">
              <h2 className="font-serif text-2xl mb-3">{series || 'Services'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    onDuplicate={() => { const copy = cloneService(s, { title: `${s.title} (copy)`, checkedSupplies: [] }); addServices([copy]); toast('Service duplicated'); }}
                    onDelete={() => deleteService(s.id)}
                  />
                ))}
              </div>
            </section>
          ))}
          {services.length === 0 && <EmptyState icon={Search} title="No services match your search" />}
        </>
      )}

      <NewServiceDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <SeriesDialog open={seriesOpen} onClose={() => setSeriesOpen(false)} />
    </div>
  );
};

const ServiceCard: React.FC<{ service: Service; onDuplicate: () => void; onDelete: () => void }> = ({ service, onDuplicate, onDelete }) => {
  const parts = service.sections.reduce((n, s) => n + s.parts.length, 0);
  return (
    <div className="group relative bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-black hover:shadow-hard-sm transition-all">
      <button type="button" onClick={() => navigate(`/s/${service.id}`)} className="text-left w-full">
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
          {service.week ? `Week ${service.week} · ` : ''}{service.audience}
        </p>
        <h3 className="font-serif text-xl mt-1 pr-8 leading-snug">{service.title}</h3>
        {service.bigIdea && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.bigIdea}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-4">
          <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(service.date)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(serviceMinutes(service))}</span>
          <span className="inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{service.sections.length} sections · {parts} parts</span>
        </div>
      </button>
      <div className="absolute top-3 right-3">
        <Menu icon={MoreVertical} label="Service actions">
          <MenuItem icon={Copy} onClick={onDuplicate}>Duplicate</MenuItem>
          <MenuItem icon={Download} onClick={() => downloadJson(`${slug(service.title)}.parable.json`, { version: 1, services: [service], library: [] })}>Export file</MenuItem>
          <MenuDivider />
          <MenuItem icon={Trash2} danger onClick={onDelete}>Delete</MenuItem>
        </Menu>
      </div>
    </div>
  );
};
