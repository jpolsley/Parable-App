import React, { useEffect, useState } from 'react';
import { Check, Palette, Sparkles, X } from 'lucide-react';
import { Series, SeriesDesign, Service } from '../types';
import { DEFAULT_DESIGN, FONT_SETS, LOOKS, designOf, designVars, fontLabel, isHex, paletteFrom } from '../lib/design';
import { designFromDescription } from '../services/aiService';
import { useStore } from '../store/StoreContext';
import { DesignPreview } from './print/PrintView';
import { Button, IconButton, Label, inputClass } from './ui';

const same = (a: SeriesDesign, b: SeriesDesign) => a.fonts === b.fonts && a.corners === b.corners && a.headings === b.headings && a.accent === b.accent;

const Segmented = <T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) => (
  <div>
    <Label>{label}</Label>
    <div role="radiogroup" aria-label={label} className="inline-flex bg-canvas border border-line rounded-lg p-0.5 w-full">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`flex-1 px-2 py-1.5 text-sm rounded-md ${value === v ? 'bg-white shadow-sm font-semibold text-ink' : 'text-gray-500 hover:text-ink'}`}
        >
          {text}
        </button>
      ))}
    </div>
  </div>
);

// Pick a built-in look, adjust it, or describe one and let the AI choose. Changes preview live and save on "Use this design".
export const DesignDialog: React.FC<{ open: boolean; onClose: () => void; series: Series; weeks: Service[] }> = ({ open, onClose, series, weeks }) => {
  const { updateSeries, aiSettings, toast } = useStore();
  const [draft, setDraft] = useState<SeriesDesign>(designOf(series));
  const [describe, setDescribe] = useState('');
  const [thinking, setThinking] = useState(false);
  const [aiNote, setAiNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(designOf(series));
    setAiNote(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const set = (patch: Partial<SeriesDesign>) => setDraft((d) => ({ ...d, ...patch }));
  const previewSeries: Series = { ...series, design: draft };
  const swatch = isHex(draft.accent) ? paletteFrom(draft.accent)[0] : (designVars(previewSeries) as Record<string, string>)['--c'];

  const askAi = async () => {
    if (!describe.trim()) return;
    setThinking(true);
    setAiNote(null);
    try {
      const { design, why } = await designFromDescription(aiSettings, describe.trim(), series);
      setDraft(design);
      setAiNote({ ok: true, text: why || 'Here is a design for that. Adjust anything below.' });
    } catch (e) {
      setAiNote({ ok: false, text: e instanceof Error ? e.message : 'The AI could not design that.' });
    } finally {
      setThinking(false);
    }
  };

  const save = () => {
    updateSeries(series.id, (s) => ({ ...s, design: draft }));
    toast('Design updated');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-stretch justify-center p-2 md:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Design"
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white border border-line shadow-lift w-full max-w-6xl rounded-2xl flex flex-col md:flex-row overflow-hidden"
      >
        <div className="md:w-[360px] shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-line max-h-[50vh] md:max-h-none">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="text-xl font-display inline-flex items-center gap-2"><Palette className="w-5 h-5 text-accent" /> Design</h2>
            <IconButton icon={X} label="Close" onClick={onClose} />
          </div>
          <div className="px-5 pb-5 overflow-y-auto space-y-5">
            <p className="text-sm text-gray-500">How <b className="text-ink">{series.title}</b> looks when printed. Every page of the book uses it.</p>

            {aiSettings.enabled && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
                <Label htmlFor="design-describe">Describe a look</Label>
                <textarea
                  id="design-describe"
                  className={`${inputClass} min-h-[64px]`}
                  value={describe}
                  onChange={(e) => setDescribe(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!thinking) askAi(); } }}
                  placeholder='e.g. "vintage summer camp, earthy greens" or "clean and modern for middle schoolers"'
                />
                <Button type="button" size="sm" variant="ai" icon={Sparkles} loading={thinking} disabled={!describe.trim()} onClick={askAi}>Design it</Button>
                {aiNote && <p className={`text-xs ${aiNote.ok ? 'text-gray-600' : 'text-red-700'}`}>{aiNote.text}</p>}
              </div>
            )}

            <div>
              <Label>Looks</Label>
              <div className="grid grid-cols-2 gap-2">
                {LOOKS.map((look) => {
                  const active = same(draft, look.design);
                  const color = look.design.accent ? paletteFrom(look.design.accent)[0] : (designVars({ ...series, design: look.design }) as Record<string, string>)['--c'];
                  return (
                    <button
                      key={look.id}
                      type="button"
                      onClick={() => setDraft(look.design)}
                      className={`text-left rounded-xl border p-2.5 transition-colors ${active ? 'border-accent ring-2 ring-accent/20' : 'border-line hover:border-gray-400'}`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="pr text-base leading-none" style={{ ...designVars({ ...series, design: look.design }), fontFamily: 'var(--f-display)', fontWeight: 700, textTransform: look.design.headings === 'caps' ? 'uppercase' : 'none' }}>{look.name}</span>
                        {active ? <Check className="w-4 h-4 text-accent" /> : <span className="w-3.5 h-3.5 rounded-full" style={{ background: color }} />}
                      </span>
                      <span className="block text-[11px] leading-snug text-gray-500 mt-1">{look.blurb}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="design-fonts">Fonts</Label>
              <select id="design-fonts" className={inputClass} value={draft.fonts} onChange={(e) => set({ fonts: e.target.value as SeriesDesign['fonts'] })}>
                {FONT_SETS.map((f) => <option key={f} value={f}>{fontLabel(f)}</option>)}
              </select>
            </div>

            <div>
              <Label htmlFor="design-accent">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="design-accent"
                  type="color"
                  value={swatch}
                  onChange={(e) => set({ accent: e.target.value.toUpperCase() })}
                  className="w-10 h-10 rounded-lg border border-line cursor-pointer bg-white p-0.5"
                  aria-label="Accent color"
                />
                <input
                  className={`${inputClass} font-mono`}
                  value={draft.accent}
                  onChange={(e) => set({ accent: e.target.value.trim() })}
                  placeholder="Series color"
                  aria-label="Accent color hex"
                />
                {draft.accent && <Button type="button" size="sm" variant="ghost" onClick={() => set({ accent: '' })}>Reset</Button>}
              </div>
              <p className="text-xs text-gray-400 mt-1">Light colors are darkened a little so text stays readable.</p>
            </div>

            <Segmented label="Corners" value={draft.corners} options={[['round', 'Round'], ['soft', 'Soft'], ['square', 'Square']]} onChange={(corners) => set({ corners })} />
            <Segmented label="Headings" value={draft.headings} options={[['normal', 'Normal'], ['caps', 'ALL CAPS']]} onChange={(headings) => set({ headings })} />

            <div className="flex gap-2 pt-1">
              <Button type="button" className="flex-1" onClick={save}>Use this design</Button>
              <Button type="button" variant="outline" onClick={() => setDraft(DEFAULT_DESIGN)}>Default</Button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto bg-[#E9EDF3]">
          <DesignPreview series={previewSeries} weeks={weeks} />
        </div>
      </div>
    </div>
  );
};
