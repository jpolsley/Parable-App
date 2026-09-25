import React, { useState } from 'react';
import { ExternalLink, Link as LinkIcon, Package, Printer, ScrollText, Sparkles } from 'lucide-react';
import { FamilyCues, Service } from '../types';
import { aggregateSupplies } from '../lib/supplies';
import { visibleParts } from '../lib/time';
import { askAboutService, draftFamilyCue, draftObjectives, ServiceWithSeries } from '../services/aiService';
import { FAMILY_LABELS, familyCues } from '../lib/roles';
import { newFamily } from '../lib/factory';
import { AIAssist } from './AIAssist';
import { useStore } from '../store/StoreContext';
import { Button, EmptyState, Label, TextArea, inputClass } from './ui';

type Tab = 'details' | 'family' | 'supplies' | 'media' | 'script' | 'ai';

interface SidePanelProps {
  service: Service;
  update: (fn: (s: Service) => Service) => void;
  onJumpToPart: (partId: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ service, update, onJumpToPart }) => {
  const { aiSettings } = useStore();
  const [tab, setTab] = useState<Tab>('details');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'family', label: 'Family' },
    { id: 'supplies', label: 'Supplies' },
    { id: 'media', label: 'Media' },
    { id: 'script', label: 'Script' },
    ...(aiSettings.enabled ? [{ id: 'ai' as Tab, label: 'Ask AI' }] : []),
  ];

  return (
    <aside className="bg-white border border-line rounded-xl flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200 px-2 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-3 text-sm whitespace-nowrap border-b-2 -mb-px ${tab === t.id ? 'border-accent text-accent font-semibold' : 'border-transparent text-gray-500 hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4 overflow-y-auto">
        {tab === 'details' && <Details service={service} update={update} />}
        {tab === 'family' && <Family service={service} update={update} />}
        {tab === 'supplies' && <Supplies service={service} update={update} />}
        {tab === 'media' && <Media service={service} />}
        {tab === 'script' && <Script service={service} onJumpToPart={onJumpToPart} />}
        {tab === 'ai' && <AskAI service={service} />}
      </div>
    </aside>
  );
};

const Details: React.FC<{ service: Service; update: (fn: (s: Service) => Service) => void }> = ({ service, update }) => {
  const { db, moveToSeries, aiSettings } = useStore();
  const set = <K extends keyof Service>(key: K, value: Service[K]) => update((s) => ({ ...s, [key]: value }));
  const inSeries = !!service.seriesId;
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="d-series">Series</Label>
        <select id="d-series" className={inputClass} value={service.seriesId ?? ''} onChange={(e) => moveToSeries(service.id, e.target.value || null)}>
          <option value="">None (stand-alone)</option>
          {db.series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        {inSeries && <p className="text-xs text-gray-500 mt-1">Week {service.week}. The date follows the series schedule; change it on the series page.</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="d-date">Date</Label>
          <input id="d-date" type="date" className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500`} value={service.date} disabled={inSeries} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="d-start">Start time</Label>
          <input id="d-start" type="time" className={inputClass} value={service.startTime} onChange={(e) => set('startTime', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="d-size">Class size</Label>
          <input id="d-size" type="number" min={0} className={inputClass} value={service.classSize} onChange={(e) => set('classSize', Math.max(0, Number(e.target.value) || 0))} />
        </div>
        <div>
          <Label htmlFor="d-groups">Small groups</Label>
          <input id="d-groups" type="number" min={0} className={inputClass} value={service.groupCount} onChange={(e) => set('groupCount', Math.max(0, Number(e.target.value) || 0))} />
        </div>
      </div>
      <div>
        <Label htmlFor="d-aud">Audience</Label>
        <input id="d-aud" className={inputClass} value={service.audience} onChange={(e) => set('audience', e.target.value)} placeholder="e.g. Kids K–5, Preschool, Middle School" />
      </div>
      <div>
        <Label htmlFor="d-big">Big idea</Label>
        <TextArea id="d-big" minRows={2} value={service.bigIdea} onChange={(e) => set('bigIdea', e.target.value)} placeholder="The one thing every kid should walk away with" />
      </div>
      <div>
        <Label htmlFor="d-obj">Objectives</Label>
        <TextArea id="d-obj" minRows={3} value={service.objectives} onChange={(e) => set('objectives', e.target.value)} placeholder={'One per line, e.g.\nKnow that God made a way through the sea\nName one place they need to trust God'} />
        <div className="mt-1.5">
          <AIAssist
            label={service.objectives ? 'Improve with AI' : 'Draft with AI'}
            hasExisting={!!service.objectives.trim()}
            run={(instruction) => draftObjectives(aiSettings, service, instruction)}
            onApply={(text, mode) => update((s) => ({ ...s, objectives: mode === 'append' && s.objectives ? `${s.objectives}\n${text}` : text }))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="d-scr">Scripture</Label>
        <input id="d-scr" className={inputClass} value={service.scripture} onChange={(e) => set('scripture', e.target.value)} placeholder="e.g. Exodus 16" />
      </div>
      <div>
        <Label htmlFor="d-kv">Key verse</Label>
        <TextArea id="d-kv" minRows={2} value={service.keyVerse} onChange={(e) => set('keyVerse', e.target.value)} />
      </div>
    </div>
  );
};

const Family: React.FC<{ service: Service; update: (fn: (s: Service) => Service) => void }> = ({ service, update }) => {
  const { aiSettings } = useStore();
  const fallback = familyCues({ ...service, family: newFamily() }, (service as ServiceWithSeries).seriesInfo);
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Four everyday moments for parents, printed on the family page. Leave one blank to use the suggestion shown.</p>
      {(Object.keys(FAMILY_LABELS) as (keyof FamilyCues)[]).map((key) => (
        <div key={key}>
          <Label htmlFor={`fam-${key}`}>{FAMILY_LABELS[key].title}</Label>
          <TextArea
            id={`fam-${key}`}
            minRows={2}
            value={service.family[key]}
            placeholder={fallback[key] || FAMILY_LABELS[key].hint}
            onChange={(e) => update((s) => ({ ...s, family: { ...s.family, [key]: e.target.value } }))}
          />
          <div className="mt-1.5">
            <AIAssist
              label={service.family[key] ? 'Improve with AI' : 'Draft with AI'}
              hasExisting={!!service.family[key].trim()}
              run={(instruction) => draftFamilyCue(aiSettings, service, key, instruction)}
              onApply={(text, mode) => update((s) => ({ ...s, family: { ...s.family, [key]: mode === 'append' && s.family[key] ? `${s.family[key]}\n\n${text}` : text } }))}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const Supplies: React.FC<{ service: Service; update: (fn: (s: Service) => Service) => void }> = ({ service, update }) => {
  const { print } = useStore();
  const lines = aggregateSupplies(service);
  const checked = new Set(service.checkedSupplies);
  const toggle = (key: string) =>
    update((s) => ({ ...s, checkedSupplies: checked.has(key) ? s.checkedSupplies.filter((k) => k !== key) : [...s.checkedSupplies, key] }));

  if (!lines.length) {
    return <EmptyState icon={Package} title="No supplies yet">Add supplies to any part and they're totaled here for {service.classSize} kids.</EmptyState>;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{checked.size} of {lines.length} gathered · for {service.classSize} kids</p>
        <Button type="button" size="sm" variant="ghost" icon={Printer} onClick={() => print(service.id, { kind: 'supplies' })}>Print</Button>
      </div>
      <ul className="space-y-1">
        {lines.map((l) => (
          <li key={l.key}>
            <label className="flex gap-3 items-start p-2 rounded-md hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-indigo-600" checked={checked.has(l.key)} onChange={() => toggle(l.key)} />
              <span className={`flex-1 ${checked.has(l.key) ? 'line-through text-gray-400' : ''}`}>
                <span className="font-medium">{l.name}</span>
                <span className="block text-xs text-gray-500">{l.sources.join(', ')}</span>
              </span>
              <span className="font-mono text-sm">{Number.isInteger(l.total) ? l.total : l.total.toFixed(1)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Media: React.FC<{ service: Service }> = ({ service }) => {
  const groups = service.sections
    .map((s) => ({ section: s, links: visibleParts(s).flatMap((p) => [...p.media, ...p.resources].filter((l) => l.url).map((l) => ({ ...l, part: p.title }))) }))
    .filter((g) => g.links.length);
  if (!groups.length) return <EmptyState icon={LinkIcon} title="No media or resources yet">Links you add to parts show up here in running order.</EmptyState>;
  return (
    <div className="space-y-5">
      {groups.map(({ section, links }) => (
        <div key={section.id}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{section.title}</h3>
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.id}>
                <a href={l.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50">
                  <ExternalLink className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <span className="min-w-0">
                    <span className="font-medium block truncate">{l.label || l.url}</span>
                    <span className="text-xs text-gray-500">{l.part}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const Script: React.FC<{ service: Service; onJumpToPart: (id: string) => void }> = ({ service, onJumpToPart }) => {
  const parts = service.sections.flatMap((s) => visibleParts(s).filter((p) => p.script.trim()).map((p) => ({ section: s.title, part: p })));
  if (!parts.length) return <EmptyState icon={ScrollText} title="No scripts yet">Every part's script shows here as one read-through.</EmptyState>;
  return (
    <div className="space-y-5">
      {parts.map(({ section, part }) => (
        <div key={part.id}>
          <button type="button" onClick={() => onJumpToPart(part.id)} className="text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{section}</span>
            <h3 className="font-semibold hover:underline">{part.title}</h3>
          </button>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mt-1">{part.script}</p>
        </div>
      ))}
    </div>
  );
};

const AskAI: React.FC<{ service: Service }> = ({ service }) => {
  const { aiSettings } = useStore();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    try {
      setAnswer(await askAboutService(aiSettings, service, question.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Ask anything about this service. The AI sees your run of service, but it doesn't change anything.</p>
      <TextArea minRows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Give me 3 transition ideas between worship and the Bible story" />
      <Button type="button" size="sm" variant="ai" icon={Sparkles} loading={loading} onClick={ask} disabled={!question.trim()}>Ask</Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {answer && (
        <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm whitespace-pre-line leading-relaxed">
          {answer}
          <div className="mt-2">
            <button type="button" className="text-xs text-gray-500 hover:text-black" onClick={() => navigator.clipboard?.writeText(answer)}>Copy</button>
          </div>
        </div>
      )}
    </div>
  );
};
