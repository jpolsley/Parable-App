import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { newService, todayISO } from '../lib/factory';
import { TEMPLATES, sectionsFromTemplate } from '../lib/templates';
import { navigate } from '../lib/route';
import { draftSeries, draftService } from '../services/aiService';
import { useStore } from '../store/StoreContext';
import { Button, Label, Modal, inputClass } from './ui';

const AUDIENCES = ['Preschool', 'Kids K–5', 'Preteen', 'Middle School', 'High School', 'Family'];

export const NewServiceDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { addServices, aiSettings } = useStore();
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('Kids K–5');
  const [date, setDate] = useState(todayISO());
  const [templateId, setTemplateId] = useState('kids');
  const [useAI, setUseAI] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const template = TEMPLATES.find((t) => t.id === templateId)!;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const skeleton = sectionsFromTemplate(template);
    let service = newService({ title: title.trim() || 'Untitled service', audience, date, sections: skeleton });
    if (useAI && topic.trim()) {
      setLoading(true);
      try {
        const draft = await draftService(aiSettings, { topic: topic.trim(), audience, skeleton });
        service = { ...service, ...draft, title: title.trim() || draft.title };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    addServices([service]);
    onClose();
    navigate(`/s/${service.id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="New service" wide>
      <form onSubmit={create} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_160px] gap-3">
          <div>
            <Label htmlFor="n-title">Title</Label>
            <input id="n-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={useAI ? 'Leave blank to let AI title it' : 'e.g. God Provides in the Desert'} autoFocus />
          </div>
          <div>
            <Label htmlFor="n-aud">Audience</Label>
            <input id="n-aud" className={inputClass} list="audiences" value={audience} onChange={(e) => setAudience(e.target.value)} />
            <datalist id="audiences">{AUDIENCES.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <div>
            <Label htmlFor="n-date">Date</Label>
            <input id="n-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Start from</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                aria-pressed={templateId === t.id}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${templateId === t.id ? 'border-black bg-white' : 'border-gray-200 bg-white/60 hover:border-gray-400'}`}
              >
                <span className="font-semibold block">{t.name}</span>
                <span className="text-sm text-gray-500">{t.description}</span>
                {t.sections.length > 0 && <span className="block text-xs text-gray-400 mt-1">{t.sections.map((s) => s.title).join(' → ')}</span>}
              </button>
            ))}
          </div>
        </div>

        {aiSettings.enabled && (
          <div className={`rounded-lg border-2 p-4 ${useAI ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200'}`}>
            <label className="flex items-center gap-2 font-medium cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-brand-blue" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
              <Sparkles className="w-4 h-4 text-brand-blue" /> Have AI write a first draft
            </label>
            {useAI && (
              <div className="mt-3">
                <Label htmlFor="n-topic">Topic or passage</Label>
                <input id="n-topic" className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Manna in the wilderness (Exodus 16)" />
                <p className="text-xs text-gray-500 mt-2">
                  AI fills in {template.sections.length ? `the ${template.name} layout` : 'a layout of its own'} with scripts and supplies. You can edit everything afterward.
                </p>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={useAI && !topic.trim()}>
            {loading ? 'Drafting…' : 'Create service'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const SeriesDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { addServices, aiSettings, toast } = useStore();
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Kids K–5');
  const [weeks, setWeeks] = useState(4);
  const [startDate, setStartDate] = useState(todayISO());
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const loading = progress !== '';

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProgress('Starting…');
    try {
      const services = await draftSeries(aiSettings, { topic: topic.trim(), audience, weeks, startDate }, setProgress);
      addServices(services);
      toast(`Created ${services.length} services in "${services[0].series}"`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setProgress('');
    }
  };

  return (
    <Modal open={open} onClose={() => !loading && onClose()} title="Draft a series with AI">
      <form onSubmit={run} className="space-y-4">
        <p className="text-sm text-gray-600">AI outlines the series, then writes one service per week. Each one opens in the builder so you can edit it.</p>
        <div>
          <Label htmlFor="s-topic">Topic</Label>
          <input id="s-topic" className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The Parables of Jesus" required autoFocus />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <Label htmlFor="s-aud">Audience</Label>
            <input id="s-aud" className={inputClass} list="audiences-s" value={audience} onChange={(e) => setAudience(e.target.value)} />
            <datalist id="audiences-s">{AUDIENCES.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <div>
            <Label htmlFor="s-weeks">Weeks</Label>
            <input id="s-weeks" type="number" min={1} max={12} className={inputClass} value={weeks} onChange={(e) => setWeeks(Math.min(12, Math.max(1, Number(e.target.value) || 1)))} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor="s-start">First date</Label>
            <input id="s-start" type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>
        {progress && <p className="text-sm text-brand-blue">{progress}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="ai" icon={Sparkles} loading={loading} disabled={!topic.trim()}>Draft series</Button>
        </div>
      </form>
    </Modal>
  );
};
