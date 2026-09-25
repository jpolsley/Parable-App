import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowRightLeft, Bookmark, ChevronDown, ChevronRight, Copy, ExternalLink, Eye, EyeOff, GripVertical, Plus, Printer, SeparatorHorizontal, Sparkles, Trash2, X,
} from 'lucide-react';
import { LinkItem, Part, PartType, Section, Service, Supply } from '../types';
import { PART_TYPES, PART_TYPE_KEYS } from '../lib/partTypes';
import { newLink, newSupply } from '../lib/factory';
import { PER_LABELS, supplyTotal } from '../lib/supplies';
import { draftPartText, suggestSupplies, TextField } from '../services/aiService';
import { useStore } from '../store/StoreContext';
import { AIAssist } from './AIAssist';
import { Button, IconButton, Label, Menu, MenuDivider, MenuItem, TextArea, inputClass } from './ui';

type Tab = 'script' | 'instructions' | 'supplies' | 'media' | 'resources' | 'inclusionTips' | 'leaderNotes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'script', label: 'Script' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'supplies', label: 'Supplies' },
  { id: 'media', label: 'Media' },
  { id: 'resources', label: 'Resources' },
  { id: 'inclusionTips', label: 'Inclusion tips' },
  { id: 'leaderNotes', label: 'Leader notes' },
];

const TEXT_PLACEHOLDER: Record<TextField, string> = {
  script: 'What the leader says, word for word. Use [brackets] for actions.',
  instructions: 'Setup, how to lead it, and how to wrap up.',
  inclusionTips: 'How to adapt this part so every kid can take part.',
  leaderNotes: 'Prep notes for leaders. These print in the leader guide.',
};

export const hasContent = (part: Part, tab: Tab) => {
  const v = part[tab];
  return Array.isArray(v) ? v.length > 0 : v.trim().length > 0;
};

export const TypeChip: React.FC<{ type: PartType }> = ({ type }) => {
  const { label, icon: Icon, tone } = PART_TYPES[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tone}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
};

interface PartCardProps {
  service: Service;
  section: Section;
  part: Part;
  startTime?: string;
  defaultOpen: boolean;
  onChange: (fn: (p: Part) => Part) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (sectionId: string) => void;
}

export const PartCard: React.FC<PartCardProps> = ({ service, section, part, startTime, defaultOpen, onChange, onDelete, onDuplicate, onMove }) => {
  const { aiSettings, saveToLibrary, print } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<Tab>('script');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: part.id });

  const set = <K extends keyof Part>(key: K, value: Part[K]) => onChange((p) => ({ ...p, [key]: value }));
  const filled = TABS.filter((t) => hasContent(part, t.id));
  const otherSections = service.sections.filter((s) => s.id !== section.id);

  return (
    <div
      ref={setNodeRef}
      id={`part-${part.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`scroll-mt-4 bg-white border rounded-xl ${isDragging ? 'relative z-20 shadow-lift border-accent' : 'border-line'} ${part.hidden ? 'opacity-55' : ''}`}
    >
      <div className="flex items-start gap-1 p-2 pr-1">
        <button type="button" className="p-1.5 mt-0.5 text-gray-400 hover:text-black cursor-grab active:cursor-grabbing touch-none" aria-label={`Reorder ${part.title}`} {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => setOpen(!open)} className="flex-1 min-w-0 text-left py-1" aria-expanded={open}>
          <div className="flex items-center gap-2 flex-wrap">
            {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
            <span className="font-semibold text-ink">{part.title}</span>
            <TypeChip type={part.type} />
          </div>
          <div className="flex items-center gap-2 mt-1 ml-6 text-xs text-gray-500 flex-wrap">
            {startTime && <span className="font-mono">{startTime}</span>}
            <span>{part.minutes} min</span>
            {filled.length > 0 && <span className="text-gray-300">|</span>}
            {filled.map((t) => (
              <span key={t.id} className="lowercase">{t.label}</span>
            ))}
            {part.hidden && <span className="font-semibold text-gray-600">Hidden</span>}
          </div>
        </button>
        <IconButton icon={part.hidden ? EyeOff : Eye} label={part.hidden ? 'Show part' : 'Hide part'} onClick={() => set('hidden', !part.hidden)} />
        <Menu label="Part actions">
          <MenuItem icon={Copy} onClick={onDuplicate}>Duplicate</MenuItem>
          <MenuItem icon={Bookmark} onClick={() => saveToLibrary(part)}>Save to library</MenuItem>
          <MenuItem icon={Printer} onClick={() => print(service.id, { kind: 'part', sectionId: section.id, partId: part.id })}>Print this part</MenuItem>
          <MenuItem icon={SeparatorHorizontal} onClick={() => set('pageBreak', !part.pageBreak)}>
            {part.pageBreak ? 'Remove page break after' : 'Page break after'}
          </MenuItem>
          {otherSections.length > 0 && <MenuDivider />}
          {otherSections.map((s) => (
            <MenuItem key={s.id} icon={ArrowRightLeft} onClick={() => onMove(s.id)}>Move to {s.title}</MenuItem>
          ))}
          <MenuDivider />
          <MenuItem icon={Trash2} danger onClick={onDelete}>Delete part</MenuItem>
        </Menu>
      </div>

      {part.pageBreak && !open && <div className="mx-3 mb-2 border-t-2 border-dashed border-gray-300 text-[10px] text-gray-400 uppercase tracking-wider pt-0.5">Page break</div>}

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_90px] gap-3">
            <div>
              <Label htmlFor={`title-${part.id}`}>Title</Label>
              <input id={`title-${part.id}`} className={inputClass} value={part.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <Label htmlFor={`type-${part.id}`}>Type</Label>
              <select id={`type-${part.id}`} className={inputClass} value={part.type} onChange={(e) => set('type', e.target.value as PartType)}>
                {PART_TYPE_KEYS.map((k) => <option key={k} value={k}>{PART_TYPES[k].label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor={`min-${part.id}`}>Minutes</Label>
              <input id={`min-${part.id}`} type="number" min={0} className={inputClass} value={part.minutes} onChange={(e) => set('minutes', Math.max(0, Number(e.target.value) || 0))} />
            </div>
          </div>

          <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200 -mx-1 px-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${tab === t.id ? 'border-accent text-accent font-semibold' : 'border-transparent text-gray-500 hover:text-ink'}`}
              >
                {t.label}
                {hasContent(part, t.id) && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent align-middle" />}
              </button>
            ))}
          </div>

          {(tab === 'script' || tab === 'instructions' || tab === 'inclusionTips' || tab === 'leaderNotes') && (
            <div className="space-y-2">
              <TextArea
                aria-label={TABS.find((t) => t.id === tab)!.label}
                value={part[tab]}
                onChange={(e) => set(tab, e.target.value)}
                placeholder={TEXT_PLACEHOLDER[tab]}
                minRows={tab === 'script' ? 6 : 4}
              />
              <AIAssist
                key={tab}
                label={part[tab] ? 'Improve with AI' : 'Draft with AI'}
                hasExisting={!!part[tab].trim()}
                run={(instruction) => draftPartText(aiSettings, service, section, part, tab, instruction)}
                onApply={(text, mode) => onChange((p) => ({ ...p, [tab]: mode === 'append' && p[tab] ? `${p[tab]}\n\n${text}` : text }))}
              />
            </div>
          )}

          {tab === 'supplies' && <SupplyEditor service={service} part={part} onChange={(s) => set('supplies', s)} />}
          {tab === 'media' && <LinkEditor items={part.media} onChange={(l) => set('media', l)} noun="media link" placeholder="Video, slides, or song link" />}
          {tab === 'resources' && <LinkEditor items={part.resources} onChange={(l) => set('resources', l)} noun="resource" placeholder="PDF, handout, or doc link" />}
        </div>
      )}
    </div>
  );
};

const SupplyEditor: React.FC<{ service: Service; part: Part; onChange: (s: Supply[]) => void }> = ({ service, part, onChange }) => {
  const { aiSettings } = useStore();
  const [suggested, setSuggested] = useState<Supply[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = (id: string, patch: Partial<Supply>) => onChange(part.supplies.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const suggest = async () => {
    setLoading(true);
    setError('');
    try {
      setSuggested(await suggestSupplies(aiSettings, service, part));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {part.supplies.length > 0 && (
        <div className="hidden sm:grid grid-cols-[1fr_70px_120px_70px_32px] gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          <span>Item</span><span>Qty</span><span>Scales</span><span className="text-right">Need</span><span />
        </div>
      )}
      {part.supplies.map((s) => (
        <div key={s.id} className="grid grid-cols-[1fr_70px_32px] sm:grid-cols-[1fr_70px_120px_70px_32px] gap-2 items-center">
          <input className={inputClass} value={s.name} placeholder="Item" aria-label="Supply item" onChange={(e) => update(s.id, { name: e.target.value })} />
          <input className={inputClass} type="number" min={0} step="any" value={s.qty} aria-label="Quantity" onChange={(e) => update(s.id, { qty: Math.max(0, Number(e.target.value) || 0) })} />
          <select className={`${inputClass} hidden sm:block`} value={s.per} aria-label="Quantity scales by" onChange={(e) => update(s.id, { per: e.target.value as Supply['per'] })}>
            {Object.entries(PER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span className="hidden sm:block text-right text-sm font-mono text-gray-600">{supplyTotal(s, service)}</span>
          <IconButton icon={X} label="Remove supply" onClick={() => onChange(part.supplies.filter((x) => x.id !== s.id))} />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant="outline" icon={Plus} onClick={() => onChange([...part.supplies, newSupply({ name: '' })])}>Add supply</Button>
        {aiSettings.enabled && (
          <button type="button" onClick={suggest} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline disabled:opacity-50">
            <Sparkles className="w-3.5 h-3.5" /> {loading ? 'Thinking…' : 'Suggest supplies with AI'}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">"Per kid" and "per group" quantities scale with the class size ({service.classSize}) and group count ({service.groupCount}) in Details.</p>
      {error && <p className="text-xs text-red-700">{error}</p>}
      {suggested && (
        <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-2">
          {suggested.length === 0 ? (
            <p className="text-sm text-gray-600">No supplies suggested.</p>
          ) : (
            <ul className="text-sm list-disc pl-5">
              {suggested.map((s) => <li key={s.id}>{s.name} — {s.qty} {PER_LABELS[s.per]}</li>)}
            </ul>
          )}
          <div className="flex gap-2">
            {suggested.length > 0 && <Button type="button" size="sm" onClick={() => { onChange([...part.supplies, ...suggested]); setSuggested(null); }}>Add all</Button>}
            <Button type="button" size="sm" variant="ghost" onClick={() => setSuggested(null)}>Discard</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const LinkEditor: React.FC<{ items: LinkItem[]; onChange: (l: LinkItem[]) => void; noun: string; placeholder: string }> = ({ items, onChange, noun, placeholder }) => {
  const update = (id: string, patch: Partial<LinkItem>) => onChange(items.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-2">
      {items.map((l) => (
        <div key={l.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
          <input className={inputClass} value={l.label} placeholder="Name" aria-label="Link name" onChange={(e) => update(l.id, { label: e.target.value })} />
          <input className={inputClass} value={l.url} placeholder={placeholder} aria-label="URL" type="url" onChange={(e) => update(l.id, { url: e.target.value })} />
          <div className="flex">
            {/^https?:\/\//.test(l.url) && (
              <a href={l.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-md text-gray-500 hover:bg-black/5 hover:text-black" aria-label="Open link" title="Open link">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <IconButton icon={X} label={`Remove ${noun}`} onClick={() => onChange(items.filter((x) => x.id !== l.id))} />
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" icon={Plus} onClick={() => onChange([...items, newLink()])}>Add {noun}</Button>
    </div>
  );
};
