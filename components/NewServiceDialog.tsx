import React, { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { SeriesColor } from '../types';
import { SERIES_COLORS, newSeries, newService, todayISO } from '../lib/factory';
import { TEMPLATES, sectionsFromTemplate } from '../lib/templates';
import { COLOR_CLASSES, layoutOf, weeksOf } from '../lib/series';
import { navigate } from '../lib/route';
import { draftSeries, draftService } from '../services/aiService';
import { useStore } from '../store/StoreContext';
import { Button, Label, Modal, TextArea, inputClass } from './ui';

const AUDIENCES = ['Preschool', 'Kids K–5', 'Preteen', 'Middle School', 'High School', 'Family'];

const AudienceInput: React.FC<{ id: string; value: string; onChange: (v: string) => void }> = ({ id, value, onChange }) => (
  <>
    <input id={id} className={inputClass} list={`${id}-list`} value={value} onChange={(e) => onChange(e.target.value)} />
    <datalist id={`${id}-list`}>{AUDIENCES.map((a) => <option key={a} value={a} />)}</datalist>
  </>
);

export const ColorPicker: React.FC<{ value: SeriesColor; onChange: (c: SeriesColor) => void }> = ({ value, onChange }) => (
  <div className="flex gap-2" role="radiogroup" aria-label="Series color">
    {SERIES_COLORS.map((c) => (
      <button
        key={c}
        type="button"
        role="radio"
        aria-checked={value === c}
        aria-label={c}
        onClick={() => onChange(c)}
        className={`w-7 h-7 rounded-full ${COLOR_CLASSES[c].dot} flex items-center justify-center ring-offset-2 ${value === c ? 'ring-2 ring-ink' : 'hover:scale-110'} transition`}
      >
        {value === c && <Check className="w-4 h-4 text-white" />}
      </button>
    ))}
  </div>
);

type LayoutChoice = string; // a template id, or 'last' for the previous week's layout

const LayoutPicker: React.FC<{ value: LayoutChoice; onChange: (v: LayoutChoice) => void; lastWeekTitle?: string }> = ({ value, onChange, lastWeekTitle }) => {
  const options = [
    ...(lastWeekTitle ? [{ id: 'last', name: "Last week's layout", description: `Same sections and parts as "${lastWeekTitle}", with content cleared.`, flow: '' }] : []),
    ...TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, flow: t.sections.map((s) => s.title).join(' → ') })),
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-pressed={value === t.id}
          className={`text-left p-3 rounded-xl border transition-colors ${value === t.id ? 'border-accent bg-accent-soft ring-1 ring-accent' : 'border-line bg-white hover:border-gray-300'}`}
        >
          <span className="font-semibold block text-sm">{t.name}</span>
          <span className="text-xs text-gray-500">{t.description}</span>
          {t.flow && <span className="block text-[11px] text-gray-400 mt-1">{t.flow}</span>}
        </button>
      ))}
    </div>
  );
};

const AIToggle: React.FC<{ on: boolean; setOn: (v: boolean) => void; children: React.ReactNode; label: string }> = ({ on, setOn, children, label }) => {
  const { aiSettings } = useStore();
  if (!aiSettings.enabled) return null;
  return (
    <div className={`rounded-xl border p-4 ${on ? 'border-accent bg-accent-soft/60' : 'border-line'}`}>
      <label className="flex items-center gap-2 font-medium text-sm cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={on} onChange={(e) => setOn(e.target.checked)} />
        <Sparkles className="w-4 h-4 text-accent" /> {label}
      </label>
      {on && <div className="mt-3">{children}</div>}
    </div>
  );
};

// ---------- New series ----------

export const NewSeriesDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { addSeries, aiSettings, toast } = useStore();
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('Kids K–5');
  const [startDate, setStartDate] = useState(todayISO());
  const [weeks, setWeeks] = useState(4);
  const [color, setColor] = useState<SeriesColor>('indigo');
  const [layout, setLayout] = useState('kids');
  const [bigIdea, setBigIdea] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [topic, setTopic] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const loading = progress !== '';

  useEffect(() => {
    if (open) { setError(''); setProgress(''); }
  }, [open]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (useAI) {
      setProgress('Starting…');
      try {
        const { series, weeks: drafted } = await draftSeries(aiSettings, { topic: topic.trim() || title.trim(), title: title.trim() || undefined, audience, weeks, startDate, color }, setProgress);
        addSeries({ ...series, bigIdea: bigIdea.trim() || series.bigIdea }, drafted);
        toast(`Drafted ${drafted.length} weeks of "${series.title}"`);
        onClose();
        navigate(`/series/${series.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setProgress('');
      }
      return;
    }
    const template = TEMPLATES.find((t) => t.id === layout) ?? TEMPLATES[0];
    const series = newSeries({ title: title.trim() || 'Untitled series', audience, startDate, color, bigIdea: bigIdea.trim() });
    const drafts = Array.from({ length: weeks }, (_, i) => newService({ title: `Week ${i + 1}`, audience, sections: sectionsFromTemplate(template) }));
    addSeries(series, drafts);
    onClose();
    navigate(`/series/${series.id}`);
  };

  return (
    <Modal open={open} onClose={() => !loading && onClose()} title="New series" wide>
      <form onSubmit={create} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
          <div>
            <Label htmlFor="ns-title">Series title</Label>
            <input id="ns-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={useAI ? 'Leave blank to let AI name it' : 'e.g. Desert Journeys'} autoFocus />
          </div>
          <div>
            <Label htmlFor="ns-aud">Audience</Label>
            <AudienceInput id="ns-aud" value={audience} onChange={setAudience} />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-[160px_110px_1fr] gap-3 items-end">
          <div>
            <Label htmlFor="ns-start">First week</Label>
            <input id="ns-start" type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ns-weeks">Weeks</Label>
            <input id="ns-weeks" type="number" min={1} max={16} className={inputClass} value={weeks} onChange={(e) => setWeeks(Math.min(16, Math.max(1, Number(e.target.value) || 1)))} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>
        <div>
          <Label htmlFor="ns-big">Series theme (optional)</Label>
          <TextArea id="ns-big" minRows={2} value={bigIdea} onChange={(e) => setBigIdea(e.target.value)} placeholder="The one idea that ties every week together" />
        </div>

        {!useAI && (
          <div>
            <Label>Weekly layout</Label>
            <LayoutPicker value={layout} onChange={setLayout} />
            <p className="text-xs text-gray-500 mt-2">Every week starts with this layout. You can change any week afterward.</p>
          </div>
        )}

        <AIToggle on={useAI} setOn={setUseAI} label="Have AI draft every week">
          <Label htmlFor="ns-topic">Topic or passage</Label>
          <input id="ns-topic" className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The Parables of Jesus" />
          <p className="text-xs text-gray-500 mt-2">AI outlines the series, then writes each week with a hook, teaching, activity, and discussion. You can edit everything.</p>
        </AIToggle>

        {progress && <p className="text-sm text-accent">{progress}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={useAI && !(topic.trim() || title.trim())}>
            {useAI ? 'Draft series' : `Create ${weeks} week${weeks === 1 ? '' : 's'}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ---------- New week (in a series) or stand-alone service ----------

export const NewServiceDialog: React.FC<{ open: boolean; onClose: () => void; seriesId?: string }> = ({ open, onClose, seriesId }) => {
  const { db, addServices, addWeeks, aiSettings } = useStore();
  const series = seriesId ? db.series.find((s) => s.id === seriesId) : undefined;
  const weeks = series ? weeksOf(db, series.id) : [];
  const lastWeek = weeks[weeks.length - 1];
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('Kids K–5');
  const [date, setDate] = useState(todayISO());
  const [layout, setLayout] = useState('kids');
  const [useAI, setUseAI] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setTopic('');
    setError('');
    setLayout(lastWeek ? 'last' : 'kids');
    if (series) setAudience(series.audience);
    // Reset only when the dialog opens, not on every autosave.
  }, [open]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const skeleton = layout === 'last' && lastWeek ? layoutOf(lastWeek) : sectionsFromTemplate(TEMPLATES.find((t) => t.id === layout) ?? TEMPLATES[0]);
    let service = newService({ title: title.trim() || (series ? `Week ${weeks.length + 1}` : 'Untitled service'), audience, date, sections: skeleton });
    if (useAI && topic.trim()) {
      setLoading(true);
      try {
        const draft = await draftService(aiSettings, { topic: topic.trim(), audience, skeleton, series });
        service = { ...service, ...draft, title: title.trim() || draft.title };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (series) addWeeks(series.id, [service]);
    else addServices([service]);
    onClose();
    navigate(`/s/${service.id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title={series ? `Add week ${weeks.length + 1} to ${series.title}` : 'New stand-alone service'} wide>
      <form onSubmit={create} className="space-y-5">
        <div className={`grid grid-cols-1 gap-3 ${series ? 'sm:grid-cols-[1fr_180px]' : 'sm:grid-cols-[1fr_180px_160px]'}`}>
          <div>
            <Label htmlFor="n-title">Title</Label>
            <input id="n-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={series ? `Week ${weeks.length + 1}` : 'e.g. Christmas Family Service'} autoFocus />
          </div>
          <div>
            <Label htmlFor="n-aud">Audience</Label>
            <AudienceInput id="n-aud" value={audience} onChange={setAudience} />
          </div>
          {!series && (
            <div>
              <Label htmlFor="n-date">Date</Label>
              <input id="n-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
        </div>
        {series && <p className="text-xs text-gray-500 -mt-2">This week is scheduled automatically, one week after the last.</p>}

        <div>
          <Label>Start from</Label>
          <LayoutPicker value={layout} onChange={setLayout} lastWeekTitle={lastWeek?.title} />
        </div>

        <AIToggle on={useAI} setOn={setUseAI} label="Have AI write a first draft">
          <Label htmlFor="n-topic">Topic or passage</Label>
          <input id="n-topic" className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Manna in the wilderness (Exodus 16)" />
          {series && <p className="text-xs text-gray-500 mt-2">The draft will follow the "{series.title}" series theme.</p>}
        </AIToggle>

        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={useAI && !topic.trim()}>
            {loading ? 'Drafting…' : series ? 'Add week' : 'Create service'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
