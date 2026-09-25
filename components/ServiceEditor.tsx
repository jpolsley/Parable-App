import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, Clock, Copy, Download, FileText, LayoutList, Package, Plus, Printer, Trash2, Users } from 'lucide-react';
import { Part, Section, Service } from '../types';
import { cloneSection, clonePart, cloneService, newSection } from '../lib/factory';
import { buildSchedule, formatDate, formatDuration, serviceMinutes } from '../lib/time';
import { downloadJson, slug } from '../lib/files';
import { navigate } from '../lib/route';
import { useStore } from '../store/StoreContext';
import { restrictToVerticalAxis } from './dndModifiers';
import { SectionActions, SectionCard } from './SectionCard';
import { SidePanel } from './SidePanel';
import { Button, EmptyState, Menu, MenuDivider, MenuItem } from './ui';

export const ServiceEditor: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const { db, updateService, addServices, deleteService, toast, print } = useStore();
  const service = db.services.find((s) => s.id === serviceId);
  const [openPartIds, setOpenPartIds] = useState<Set<string>>(new Set());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const schedule = useMemo(() => (service ? buildSchedule(service) : {}), [service]);

  if (!service) {
    return (
      <div className="max-w-xl mx-auto py-20">
        <EmptyState icon={FileText} title="Service not found">
          It may have been deleted. <button className="underline" onClick={() => navigate('/')}>Back to services</button>
        </EmptyState>
      </div>
    );
  }

  const update = (fn: (s: Service) => Service) => updateService(service.id, fn);
  const mapSections = (fn: (sections: Section[]) => Section[]) => update((s) => ({ ...s, sections: fn(s.sections) }));

  const actions: SectionActions = {
    updateSection: (id, fn) => mapSections((secs) => secs.map((s) => (s.id === id ? fn(s) : s))),
    deleteSection: (id) => {
      const index = service.sections.findIndex((s) => s.id === id);
      const removed = service.sections[index];
      mapSections((secs) => secs.filter((s) => s.id !== id));
      toast(`Deleted section "${removed.title}"`, () =>
        mapSections((secs) => [...secs.slice(0, index), removed, ...secs.slice(index)]),
      );
    },
    duplicateSection: (id) =>
      mapSections((secs) => secs.flatMap((s) => (s.id === id ? [s, { ...cloneSection(s), title: `${s.title} (copy)` }] : [s]))),
    addParts: (sectionId, parts) => {
      setOpenPartIds((ids) => new Set([...ids, ...parts.map((p) => p.id)]));
      mapSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, collapsed: false, parts: [...s.parts, ...parts] } : s)));
    },
    deletePart: (sectionId, partId) => {
      const section = service.sections.find((s) => s.id === sectionId);
      const index = section?.parts.findIndex((p) => p.id === partId) ?? -1;
      const removed = section?.parts[index];
      if (!removed) return;
      mapSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, parts: s.parts.filter((p) => p.id !== partId) } : s)));
      toast(`Deleted "${removed.title}"`, () =>
        mapSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, parts: [...s.parts.slice(0, index), removed, ...s.parts.slice(index)] } : s))),
      );
    },
    duplicatePart: (sectionId, partId) =>
      mapSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, parts: s.parts.flatMap((p) => (p.id === partId ? [p, clonePart(p)] : [p])) } : s))),
    movePart: (fromId, partId, toId) =>
      mapSections((secs) => {
        const part = secs.find((s) => s.id === fromId)?.parts.find((p) => p.id === partId);
        if (!part) return secs;
        return secs.map((s) =>
          s.id === fromId ? { ...s, parts: s.parts.filter((p) => p.id !== partId) } : s.id === toId ? { ...s, collapsed: false, parts: [...s.parts, part] } : s,
        );
      }),
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    mapSections((secs) => {
      const from = secs.findIndex((s) => s.id === active.id);
      const to = secs.findIndex((s) => s.id === over.id);
      return from < 0 || to < 0 ? secs : arrayMove(secs, from, to);
    });
  };

  const addSection = () => mapSections((secs) => [...secs, newSection({ title: 'New section' })]);
  const allCollapsed = service.sections.length > 0 && service.sections.every((s) => s.collapsed);
  const duplicate = () => {
    const copy = cloneService(service, { title: `${service.title} (copy)`, checkedSupplies: [] });
    addServices([copy]);
    navigate(`/s/${copy.id}`);
    toast('Service duplicated');
  };
  const jumpToPart = (partId: string) => {
    const section = service.sections.find((s) => s.parts.some((p: Part) => p.id === partId));
    if (section?.collapsed) actions.updateSection(section.id, (s) => ({ ...s, collapsed: false }));
    requestAnimationFrame(() => document.getElementById(`part-${partId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
      <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
        <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-1 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Services
        </button>
        {service.series && <><span>/</span><span className="truncate">{service.series}</span></>}
      </div>

      <header className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <input
            value={service.title}
            onChange={(e) => update((s) => ({ ...s, title: e.target.value }))}
            aria-label="Service title"
            className="w-full bg-transparent font-serif text-3xl md:text-4xl leading-tight rounded px-1 -mx-1 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
            <span>{formatDate(service.date)}</span>
            {service.week && <span>Week {service.week}</span>}
            <span className="inline-flex items-center gap-1"><Users className="w-4 h-4" />{service.audience} · {service.classSize} kids</span>
            <span className="inline-flex items-center gap-1 font-semibold text-charcoal"><Clock className="w-4 h-4" />{formatDuration(serviceMinutes(service))}</span>
          </div>
          {service.bigIdea && <p className="mt-2 text-gray-700 italic">{service.bigIdea}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Menu trigger={<Button type="button" icon={Printer}>Print</Button>}>
            <MenuItem icon={FileText} onClick={() => print(service.id, { kind: 'guide' })}>Leader guide</MenuItem>
            <MenuItem icon={LayoutList} onClick={() => print(service.id, { kind: 'run-sheet' })}>Run sheet (times only)</MenuItem>
            <MenuItem icon={Package} onClick={() => print(service.id, { kind: 'supplies' })}>Supply list</MenuItem>
          </Menu>
          <Menu label="Service actions">
            <MenuItem icon={Copy} onClick={duplicate}>Duplicate service</MenuItem>
            <MenuItem icon={Download} onClick={() => downloadJson(`${slug(service.title)}.parable.json`, { version: 1, services: [service], library: [] })}>Export file</MenuItem>
            <MenuItem icon={LayoutList} onClick={() => mapSections((secs) => secs.map((s) => ({ ...s, collapsed: !allCollapsed })))}>
              {allCollapsed ? 'Expand all sections' : 'Collapse all sections'}
            </MenuItem>
            <MenuDivider />
            <MenuItem icon={Trash2} danger onClick={() => { deleteService(service.id); navigate('/'); }}>Delete service</MenuItem>
          </Menu>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="space-y-4">
          {service.sections.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 rounded-xl">
              <EmptyState icon={LayoutList} title="This service is empty">Add a section like "Worship" or "Small Groups", then add parts to it.</EmptyState>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={service.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {service.sections.map((section) => (
                <SectionCard key={section.id} service={service} section={section} schedule={schedule} openPartIds={openPartIds} actions={actions} />
              ))}
            </SortableContext>
          </DndContext>
          <Button type="button" variant="outline" icon={Plus} onClick={addSection} className="w-full border-dashed">Add section</Button>
        </div>
        <div>
          <SidePanel service={service} update={update} onJumpToPart={jumpToPart} />
        </div>
      </div>
    </div>
  );
};
