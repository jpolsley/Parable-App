import React, { useState } from 'react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from './dndModifiers';
import { CSS } from '@dnd-kit/utilities';
import {
  Bookmark, Check, ChevronDown, ChevronRight, Copy, Eye, EyeOff, GripVertical, Plus, Printer, SeparatorHorizontal, Sparkles, Trash2,
} from 'lucide-react';
import { Part, PartType, Section, Service } from '../types';
import { newPart } from '../lib/factory';
import { PART_TYPES, PART_TYPE_KEYS } from '../lib/partTypes';
import { formatDuration, sectionMinutes } from '../lib/time';
import { ROLE_LABELS } from '../lib/roles';
import { suggestParts } from '../services/aiService';
import { useStore } from '../store/StoreContext';
import { PartCard, TypeChip } from './PartCard';
import { Button, Menu, MenuDivider, MenuItem, Modal, IconButton, inputClass, EmptyState } from './ui';

export interface SectionActions {
  updateSection: (sectionId: string, fn: (s: Section) => Section) => void;
  deleteSection: (sectionId: string) => void;
  duplicateSection: (sectionId: string) => void;
  addParts: (sectionId: string, parts: Part[]) => void;
  deletePart: (sectionId: string, partId: string) => void;
  duplicatePart: (sectionId: string, partId: string) => void;
  movePart: (fromSectionId: string, partId: string, toSectionId: string) => void;
}

interface SectionCardProps {
  service: Service;
  section: Section;
  schedule: Record<string, string>;
  openPartIds: Set<string>;
  actions: SectionActions;
}

export const SectionCard: React.FC<SectionCardProps> = ({ service, section, schedule, openPartIds, actions }) => {
  const { print } = useStore();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const update = (fn: (s: Section) => Section) => actions.updateSection(section.id, fn);
  const updatePart = (partId: string, fn: (p: Part) => Part) =>
    update((s) => ({ ...s, parts: s.parts.map((p) => (p.id === partId ? fn(p) : p)) }));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update((s) => {
      const from = s.parts.findIndex((p) => p.id === active.id);
      const to = s.parts.findIndex((p) => p.id === over.id);
      return from < 0 || to < 0 ? s : { ...s, parts: arrayMove(s.parts, from, to) };
    });
  };

  const addPart = (type: PartType) => actions.addParts(section.id, [newPart({ type, title: PART_TYPES[type].label })]);
  const minutes = sectionMinutes(section);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border bg-slate-50/80 ${isDragging ? 'relative z-30 border-accent shadow-lift' : 'border-line'} ${section.hidden ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-1 px-2 py-2 border-b border-line bg-white rounded-t-2xl">
        <button type="button" className="p-1.5 text-gray-400 hover:text-black cursor-grab active:cursor-grabbing touch-none" aria-label={`Reorder section ${section.title}`} {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4" />
        </button>
        <IconButton
          icon={section.collapsed ? ChevronRight : ChevronDown}
          label={section.collapsed ? 'Expand section' : 'Collapse section'}
          onClick={() => update((s) => ({ ...s, collapsed: !s.collapsed }))}
        />
        <input
          value={section.title}
          onChange={(e) => update((s) => ({ ...s, title: e.target.value }))}
          aria-label="Section title"
          className="flex-1 min-w-0 bg-transparent font-display text-xl px-1 py-0.5 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <Menu
          trigger={
            <button type="button" title="Who this section is for (sets where it prints)" className={`hidden sm:inline-flex text-[11px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${ROLE_TONE[section.role]}`}>
              {ROLE_LABELS[section.role]}
            </button>
          }
        >
          {(Object.keys(ROLE_LABELS) as Section['role'][]).map((role) => (
            <MenuItem key={role} icon={role === section.role ? Check : undefined} onClick={() => update((s) => ({ ...s, role }))}>
              {ROLE_LABELS[role]}
              <span className="block text-xs text-gray-400">{ROLE_HINT[role]}</span>
            </MenuItem>
          ))}
        </Menu>
        {schedule[section.id] && <span className="hidden sm:inline font-mono text-xs text-gray-500">{schedule[section.id]}</span>}
        <span className="text-xs font-semibold bg-ink text-white rounded-full px-2.5 py-1 whitespace-nowrap">{formatDuration(minutes)}</span>
        <IconButton icon={section.hidden ? EyeOff : Eye} label={section.hidden ? 'Show section' : 'Hide section'} onClick={() => update((s) => ({ ...s, hidden: !s.hidden }))} />
        <Menu label="Section actions">
          <MenuItem icon={Copy} onClick={() => actions.duplicateSection(section.id)}>Duplicate section</MenuItem>
          <MenuItem icon={Printer} onClick={() => print(service.id, { kind: 'section', sectionId: section.id })}>Print this section</MenuItem>
          <MenuItem icon={SeparatorHorizontal} onClick={() => update((s) => ({ ...s, pageBreak: !s.pageBreak }))}>
            {section.pageBreak ? 'Remove page break after' : 'Page break after'}
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={Trash2} danger onClick={() => actions.deleteSection(section.id)}>Delete section</MenuItem>
        </Menu>
      </div>

      {!section.collapsed && (
        <div className="p-3 space-y-2">
          {section.parts.length === 0 && <p className="text-sm text-gray-500 px-2 py-3">No parts yet. Add one below.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={section.parts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {section.parts.map((part) => (
                <PartCard
                  key={part.id}
                  service={service}
                  section={section}
                  part={part}
                  startTime={schedule[part.id]}
                  defaultOpen={openPartIds.has(part.id)}
                  onChange={(fn) => updatePart(part.id, fn)}
                  onDelete={() => actions.deletePart(section.id, part.id)}
                  onDuplicate={() => actions.duplicatePart(section.id, part.id)}
                  onMove={(to) => actions.movePart(section.id, part.id, to)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Menu
              trigger={<Button type="button" size="sm" variant="outline" icon={Plus}>Add part</Button>}
            >
              {PART_TYPE_KEYS.map((type) => {
                const Icon = PART_TYPES[type].icon;
                return <MenuItem key={type} icon={Icon} onClick={() => addPart(type)}>{PART_TYPES[type].label}</MenuItem>;
              })}
            </Menu>
            <Button type="button" size="sm" variant="ghost" icon={Bookmark} onClick={() => setLibraryOpen(true)}>From library</Button>
            <AISuggestButton onClick={() => setAiOpen(true)} />
          </div>
        </div>
      )}

      {section.pageBreak && <div className="mx-4 mb-2 border-t-2 border-dashed border-gray-300 text-[10px] text-gray-400 uppercase tracking-wider pt-0.5">Page break</div>}

      <LibraryPicker open={libraryOpen} onClose={() => setLibraryOpen(false)} onPick={(p) => actions.addParts(section.id, [p])} />
      <SuggestPartsModal open={aiOpen} onClose={() => setAiOpen(false)} service={service} section={section} onAdd={(parts) => actions.addParts(section.id, parts)} />
    </div>
  );
};

const ROLE_TONE: Record<Section['role'], string> = {
  large: 'bg-accent-soft text-accent',
  small: 'bg-emerald-50 text-emerald-700',
  other: 'bg-gray-100 text-gray-600',
};

const ROLE_HINT: Record<Section['role'], string> = {
  large: 'Prints in the large group lesson',
  small: 'Prints on the small group guide',
  other: 'Arrival, games, announcements',
};

const AISuggestButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { aiSettings } = useStore();
  if (!aiSettings.enabled) return null;
  return <Button type="button" size="sm" variant="ghost" icon={Sparkles} className="text-accent" onClick={onClick}>Suggest parts</Button>;
};

export const LibraryPicker: React.FC<{ open: boolean; onClose: () => void; onPick: (p: Part) => void }> = ({ open, onClose, onPick }) => {
  const { db } = useStore();
  const [query, setQuery] = useState('');
  const q = query.toLowerCase();
  const parts = db.library.filter((p) => !q || p.title.toLowerCase().includes(q) || PART_TYPES[p.type].label.toLowerCase().includes(q));
  return (
    <Modal open={open} onClose={onClose} title="Insert from library">
      {db.library.length === 0 ? (
        <EmptyState icon={Bookmark} title="Your library is empty">
          Use <strong>Save to library</strong> in any part's menu to reuse it across services, like a weekly welcome or a favorite game.
        </EmptyState>
      ) : (
        <>
          <input className={`${inputClass} mb-3`} placeholder="Search library" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
            {parts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { onPick(copyForInsert(p)); onClose(); }}
                  className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{p.title}</span>
                    <TypeChip type={p.type} />
                    <span className="text-xs text-gray-500">{p.minutes} min</span>
                  </div>
                  {(p.script || p.instructions) && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.script || p.instructions}</p>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
};

const copyForInsert = (p: Part): Part => newPart({ ...p, id: undefined, supplies: p.supplies.map((s) => ({ ...s, id: undefined })), media: p.media.map((l) => ({ ...l, id: undefined })), resources: p.resources.map((l) => ({ ...l, id: undefined })) });

const SuggestPartsModal: React.FC<{ open: boolean; onClose: () => void; service: Service; section: Section; onAdd: (parts: Part[]) => void }> = ({
  open, onClose, service, section, onAdd,
}) => {
  const { aiSettings } = useStore();
  const [instruction, setInstruction] = useState('');
  const [parts, setParts] = useState<Part[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setParts(null);
    setError('');
    onClose();
  };

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await suggestParts(aiSettings, service, section, instruction.trim());
      setParts(result);
      setPicked(new Set(result.map((p) => p.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title={`Suggest parts for ${section.title}`} wide>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && run()}
            placeholder='Optional, e.g. "a high-energy game with no supplies"'
            autoFocus
          />
          <Button type="button" variant="ai" icon={Sparkles} loading={loading} onClick={run}>{parts ? 'Try again' : 'Suggest'}</Button>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {loading && <p className="text-sm text-gray-500">Local models can take a minute. Hang tight.</p>}
        {parts && (
          <>
            <ul className="space-y-2">
              {parts.map((p) => (
                <li key={p.id}>
                  <label className="flex gap-3 bg-white border border-gray-200 rounded-lg p-3 cursor-pointer has-[:checked]:border-accent">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 accent-indigo-600"
                      checked={picked.has(p.id)}
                      onChange={(e) => {
                        const next = new Set(picked);
                        e.target.checked ? next.add(p.id) : next.delete(p.id);
                        setPicked(next);
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{p.title}</span>
                        <TypeChip type={p.type} />
                        <span className="text-xs text-gray-500">{p.minutes} min</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-line line-clamp-4">{p.script || p.instructions}</p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
              <Button type="button" disabled={picked.size === 0} onClick={() => { onAdd(parts.filter((p) => picked.has(p.id))); close(); }}>
                Add {picked.size} part{picked.size === 1 ? '' : 's'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
