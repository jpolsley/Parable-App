import React, { useState } from 'react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, BookOpen, CalendarDays, Copy, Download, FileText, GripVertical, Layers, Plus, Printer, Scissors, Trash2 } from 'lucide-react';
import { Service } from '../types';
import { cloneService, newSeries, todayISO } from '../lib/factory';
import { downloadJson, slug } from '../lib/files';
import { COLOR_CLASSES, seriesRange, weeksOf } from '../lib/series';
import { daysUntil, readiness, relativeDay, supplyProgress } from '../lib/readiness';
import { formatDuration, serviceMinutes } from '../lib/time';
import { navigate } from '../lib/route';
import { useStore } from '../store/StoreContext';
import { shortDate } from './cards';
import { restrictToVerticalAxis } from './dndModifiers';
import { ColorPicker, NewServiceDialog } from './NewServiceDialog';
import { Button, EmptyState, Label, Menu, MenuDivider, MenuItem, Meter, TextArea, inputClass } from './ui';

export const SeriesPage: React.FC<{ seriesId: string }> = ({ seriesId }) => {
  const { db, updateSeries, deleteSeries, reorderWeeks, addWeeks, addSeries, deleteService, print, toast } = useStore();
  const series = db.series.find((s) => s.id === seriesId);
  const [addOpen, setAddOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!series) {
    return (
      <div className="max-w-xl mx-auto py-20">
        <EmptyState icon={Layers} title="Series not found">
          It may have been deleted. <button className="underline" onClick={() => navigate('/series')}>Back to series</button>
        </EmptyState>
      </div>
    );
  }

  const weeks = weeksOf(db, series.id);
  const range = seriesRange(weeks);
  const today = todayISO();
  const c = COLOR_CLASSES[series.color];
  const set = <K extends keyof typeof series>(key: K, value: (typeof series)[K]) => updateSeries(series.id, (s) => ({ ...s, [key]: value }));
  const totals = weeks.reduce((t, w) => { const r = readiness(w); return { ready: t.ready + r.ready, total: t.total + r.total }; }, { ready: 0, total: 0 });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = weeks.map((w) => w.id);
    reorderWeeks(series.id, arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  const duplicateSeries = () => {
    const copy = newSeries({ ...series, id: undefined, title: `${series.title} (copy)`, createdAt: undefined, updatedAt: undefined });
    addSeries(copy, weeks.map((w) => cloneService(w, { checkedSupplies: [] })));
    toast('Series duplicated');
    navigate(`/series/${copy.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
      <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
        <button type="button" onClick={() => navigate('/series')} className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Series
        </button>
      </div>

      <header className="bg-white border border-line rounded-2xl overflow-hidden mb-6">
        <div className={`h-2 ${c.bar}`} />
        <div className="p-5 md:p-6 flex flex-col md:flex-row gap-4 md:items-start">
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>{series.audience} series</p>
            <input
              value={series.title}
              onChange={(e) => set('title', e.target.value)}
              aria-label="Series title"
              className="w-full bg-transparent font-display text-3xl md:text-4xl leading-tight rounded-lg px-1 -mx-1 mt-1 focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="text-sm text-gray-500 mt-2 inline-flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {weeks.length} week{weeks.length === 1 ? '' : 's'}{range && ` · ${shortDate(range.first)} – ${shortDate(range.last)}`}
            </p>
            {series.bigIdea && <p className="mt-2 text-gray-700">{series.bigIdea}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button icon={Plus} onClick={() => setAddOpen(true)}>Add week</Button>
            <Menu trigger={<Button variant="outline" icon={Printer}>Print</Button>}>
              <MenuItem icon={BookOpen} onClick={() => print('', { kind: 'series-book', seriesId: series.id })}>Series book (everything)</MenuItem>
              <MenuItem icon={FileText} onClick={() => print('', { kind: 'series', seriesId: series.id })}>Cover + overview</MenuItem>
              <MenuItem icon={Scissors} onClick={() => print('', { kind: 'series-takehome', seriesId: series.id })}>All take-home cards</MenuItem>
            </Menu>
            <Menu label="Series actions">
              <MenuItem icon={Copy} onClick={duplicateSeries}>Duplicate series</MenuItem>
              <MenuItem icon={Download} onClick={() => downloadJson(`${slug(series.title)}.parable.json`, { version: 1, series: [series], services: weeks, library: [] })}>Export series</MenuItem>
              <MenuDivider />
              <MenuItem icon={Trash2} danger onClick={() => { deleteSeries(series.id); navigate('/series'); }}>Delete series</MenuItem>
            </Menu>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Weeks</h2>
            {weeks.length > 1 && <span className="text-xs text-gray-400">Drag to reorder. Dates follow the schedule.</span>}
          </div>
          {weeks.length === 0 ? (
            <div className="border-2 border-dashed border-line rounded-2xl bg-white">
              <EmptyState icon={FileText} title="No weeks yet">
                <div className="mt-3"><Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add the first week</Button></div>
              </EmptyState>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
              <SortableContext items={weeks.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                <ol className="space-y-3">
                  {weeks.map((w) => (
                    <WeekRow
                      key={w.id}
                      week={w}
                      today={today}
                      onDuplicate={() => { addWeeks(series.id, [cloneService(w, { title: `${w.title} (copy)`, checkedSupplies: [] })]); toast('Week duplicated'); }}
                      onDelete={() => deleteService(w.id)}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
          {weeks.length > 0 && (
            <Button variant="outline" icon={Plus} className="w-full mt-3 border-dashed" onClick={() => setAddOpen(true)}>Add week {weeks.length + 1}</Button>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="bg-white border border-line rounded-2xl p-5 space-y-4">
            <h2 className="font-display text-lg">Progress</h2>
            <Meter value={weeks.filter((w) => w.date < today).length} total={weeks.length} label="Weeks taught" />
            <Meter value={totals.ready} total={totals.total} label="Parts with content" />
          </div>
          <div className="bg-white border border-line rounded-2xl p-5 space-y-4">
            <h2 className="font-display text-lg">Series details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sd-start">First week</Label>
                <input id="sd-start" type="date" className={inputClass} value={series.startDate} onChange={(e) => e.target.value && set('startDate', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sd-aud">Audience</Label>
                <input id="sd-aud" className={inputClass} value={series.audience} onChange={(e) => set('audience', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <ColorPicker value={series.color} onChange={(color) => set('color', color)} />
            </div>
            <div>
              <Label htmlFor="sd-big">Series theme</Label>
              <TextArea id="sd-big" minRows={2} value={series.bigIdea} onChange={(e) => set('bigIdea', e.target.value)} placeholder="The one idea that ties every week together" />
            </div>
            <div>
              <Label htmlFor="sd-mv">Memory verse</Label>
              <TextArea id="sd-mv" minRows={2} value={series.memoryVerse} onChange={(e) => set('memoryVerse', e.target.value)} placeholder="Verse text (reference)" />
            </div>
            <div>
              <Label htmlFor="sd-desc">Description</Label>
              <TextArea id="sd-desc" minRows={3} value={series.description} onChange={(e) => set('description', e.target.value)} placeholder="An overview for leaders and parents" />
            </div>
          </div>
        </aside>
      </div>

      <NewServiceDialog open={addOpen} onClose={() => setAddOpen(false)} seriesId={series.id} />
    </div>
  );
};

const WeekRow: React.FC<{ week: Service; today: string; onDuplicate: () => void; onDelete: () => void }> = ({ week, today, onDuplicate, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: week.id });
  const r = readiness(week);
  const sp = supplyProgress(week);
  const days = daysUntil(week.date, today);
  const past = days < 0;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white border rounded-2xl flex items-stretch ${isDragging ? 'relative z-20 shadow-lift border-accent' : 'border-line hover:border-gray-300'} ${past ? 'opacity-70' : ''}`}
    >
      <button type="button" className="px-2 text-gray-400 hover:text-ink cursor-grab active:cursor-grabbing touch-none" aria-label={`Reorder ${week.title}`} {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => navigate(`/s/${week.id}`)} className="flex-1 min-w-0 grid grid-cols-[56px_1fr] sm:grid-cols-[64px_1fr_180px] gap-4 items-center py-4 pr-2 text-left group">
        <span className="text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Week</span>
          <span className="block font-display text-2xl leading-none">{week.week}</span>
        </span>
        <span className="min-w-0">
          <span className="font-semibold block truncate group-hover:text-accent">{week.title}</span>
          <span className="text-xs text-gray-500 block">
            {shortDate(week.date)} · {past ? 'Taught' : relativeDay(days)} · {formatDuration(serviceMinutes(week))}
          </span>
          {week.bigIdea && <span className="text-sm text-gray-500 block truncate mt-0.5">{week.bigIdea}</span>}
        </span>
        <span className="hidden sm:block space-y-2">
          <Meter value={r.ready} total={r.total} label="Content" />
          {sp.total > 0 && <Meter value={sp.gathered} total={sp.total} label="Supplies" />}
        </span>
      </button>
      <div className="p-2">
        <Menu label="Week actions">
          <MenuItem icon={FileText} onClick={() => navigate(`/s/${week.id}`)}>Open</MenuItem>
          <MenuItem icon={Copy} onClick={onDuplicate}>Duplicate as new week</MenuItem>
          <MenuDivider />
          <MenuItem icon={Trash2} danger onClick={onDelete}>Delete week</MenuItem>
        </Menu>
      </div>
    </li>
  );
};
