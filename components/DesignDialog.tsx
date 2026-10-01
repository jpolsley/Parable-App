import React, { useEffect, useRef, useState } from 'react';
import { Check, History, ImagePlus, Palette, RotateCcw, Sparkles, X } from 'lucide-react';
import { BookDesign, DesignRevision, DesignSurface, DesignTone, Series, Service } from '../types';
import { BODY_FONTS, DISPLAY_FONTS, LABEL_FONTS, LOOKS, TONES, applyPatch, designOf, fontName, resolvePalette, toneColor } from '../lib/design';
import { uid } from '../lib/factory';
import { ImageReference, readReference } from '../lib/imageRef';
import { designPatch } from '../services/aiService';
import { useStore } from '../store/StoreContext';
import { DesignPreview } from './print/PrintView';
import { Button, IconButton, Label, inputClass } from './ui';

const same = (a: BookDesign, b: BookDesign) => JSON.stringify(a) === JSON.stringify(b);

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
          className={`flex-1 px-2 py-1.5 text-xs rounded-md ${value === v ? 'bg-white shadow-sm font-semibold text-ink' : 'text-gray-500 hover:text-ink'}`}
        >
          {text}
        </button>
      ))}
    </div>
  </div>
);

const Select = <T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
    </select>
  </div>
);

const TONE_NAMES: Record<DesignTone, string> = { paper: 'Paper', ink: 'Ink', accent: 'Accent', secondary: 'Secondary', muted: 'Muted', deep: 'Deep accent' };
const PALETTE_FIELDS: [keyof BookDesign['palette'], string][] = [['paper', 'Paper'], ['ink', 'Ink'], ['accent', 'Accent'], ['secondary', 'Second'], ['muted', 'Muted'], ['deep', 'Dark']];

const when = (t: number) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// Design a series' printed book: ask Diana (with an optional reference picture), start from a look,
// or adjust anything by hand. Changes preview live and save with history on "Apply".
export const DesignDialog: React.FC<{ open: boolean; onClose: () => void; series: Series; weeks: Service[] }> = ({ open, onClose, series, weeks }) => {
  const { updateSeries, aiSettings, toast } = useStore();
  const saved = designOf(series);
  const [draft, setDraft] = useState<BookDesign>(saved);
  const [pending, setPending] = useState<Omit<DesignRevision, 'id' | 'createdAt' | 'design'>>({ source: 'manual' });
  const [ask, setAsk] = useState('');
  const [reference, setReference] = useState<ImageReference | null>(null);
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(designOf(series));
    setPending({ source: 'manual' });
    setNote(null);
    setShowCurrent(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const changed = !same(draft, saved);
  const edit = (patch: Parameters<typeof applyPatch>[1]) => {
    setDraft((d) => applyPatch(d, patch));
    setPending((p) => (p.source === 'manual' ? p : { ...p, note: `${p.note ?? ''} (adjusted by hand)`.trim() }));
  };
  const editSurface = (kind: 'cover' | 'divider', patch: Partial<DesignSurface>) => edit({ [kind]: patch });
  const pal = resolvePalette(draft);

  const attach = async (file: File) => {
    try {
      setReference(await readReference(file));
      setNote(null);
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "That picture couldn't be read." });
    }
  };

  const askDiana = async () => {
    if (!ask.trim() && !reference) return;
    setThinking(true);
    setNote(null);
    try {
      const result = await designPatch(aiSettings, draft, ask.trim(), reference ? { image: reference.image, colors: reference.colors } : undefined, setProgress);
      setDraft(result.design);
      setPending({ source: reference ? 'reference-image' : 'diana', prompt: ask.trim() || 'Match the reference picture', note: result.note });
      setNote({ ok: true, text: result.note });
      setShowCurrent(false);
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : 'Diana could not make that change.' });
    } finally {
      setThinking(false);
    }
  };

  const apply = () => {
    const now = Date.now();
    updateSeries(series.id, (s) => {
      const history = s.designHistory ?? [];
      // Keep where we started, so the first change can always be undone.
      const start: DesignRevision[] = history.length ? [] : [{ id: uid(), createdAt: now - 1, source: 'manual', note: 'Before redesigning', design: saved }];
      const rev: DesignRevision = { id: uid(), createdAt: now, ...pending, design: draft };
      return { ...s, design: draft, designHistory: [rev, ...history, ...start].slice(0, 20) };
    });
    toast('Design applied');
    setPending({ source: 'manual' });
    setAsk('');
    setReference(null);
  };

  const restore = (rev: DesignRevision) => {
    setDraft(rev.design);
    setPending({ source: 'manual', note: `Restored the version from ${when(rev.createdAt)}` });
    setNote(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-stretch justify-center p-2 md:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Design"
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white border border-line shadow-lift w-full max-w-7xl rounded-2xl flex flex-col md:flex-row overflow-hidden"
      >
        <div className="md:w-[390px] shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-line max-h-[55vh] md:max-h-none">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="text-xl font-display inline-flex items-center gap-2"><Palette className="w-5 h-5 text-accent" /> Design</h2>
            <IconButton icon={X} label="Close" onClick={onClose} />
          </div>

          <div className="px-5 pb-5 overflow-y-auto space-y-5 flex-1">
            <p className="text-sm text-gray-500">How <b className="text-ink">{series.title}</b> looks in print, on every page of the book.</p>

            {aiSettings.enabled ? (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
                <Label htmlFor="design-ask">Ask Diana</Label>
                <textarea
                  id="design-ask"
                  className={`${inputClass} min-h-[72px]`}
                  value={ask}
                  onChange={(e) => setAsk(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!thinking) askDiana(); } }}
                  placeholder='e.g. "Make it feel like this picture but keep lessons readable" or "fewer Xs, more coral"'
                />
                {reference && (
                  <div className="flex items-center gap-2">
                    <img src={reference.preview} alt="Reference" className="w-12 h-12 object-cover rounded-md border border-line" />
                    <div className="flex flex-wrap gap-1">
                      {reference.colors.map((c) => <span key={c} title={c} className="w-4 h-4 rounded border border-black/10" style={{ background: c }} />)}
                    </div>
                    <button type="button" className="ml-auto text-xs text-gray-500 hover:text-ink" onClick={() => setReference(null)}>Remove</button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="ai" icon={Sparkles} loading={thinking} disabled={!ask.trim() && !reference} onClick={askDiana}>Ask Diana</Button>
                  <Button type="button" size="sm" variant="ghost" icon={ImagePlus} onClick={() => fileRef.current?.click()}>{reference ? 'Change picture' : 'Add picture'}</Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) attach(f); e.target.value = ''; }} />
                </div>
                {thinking && <p className="text-xs text-gray-500">{progress || 'Diana is working on it…'} {reference ? 'With a picture this takes about a minute.' : ''}</p>}
                {note && <p className={`text-xs ${note.ok ? 'text-gray-700' : 'text-red-700'}`}>{note.text}</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-500 rounded-lg bg-canvas p-3">Turn on AI (top of the page) to ask Diana for a design. With a model that can see, like Qwen3-VL, you can also give her a reference picture.</p>
            )}

            <div>
              <Label>Start from a look</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {LOOKS.map((l) => {
                  const active = same(draft, l.design);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => { setDraft(l.design); setPending({ source: 'look', note: `${l.name} look` }); setNote(null); }}
                      className={`text-left rounded-lg border px-2 py-1.5 text-xs ${active ? 'border-accent ring-2 ring-accent/20 font-semibold' : 'border-line hover:border-gray-400'}`}
                      title={l.blurb}
                    >
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ background: l.design.palette.accent }} />{l.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <details open className="group">
              <summary className="text-sm font-semibold cursor-pointer select-none">Colors and type</summary>
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-6 gap-1.5">
                  {PALETTE_FIELDS.map(([key, text]) => (
                    <label key={key} className="text-[11px] text-gray-500 flex flex-col items-center gap-1">
                      <input type="color" value={(key === 'deep' ? pal.deep : draft.palette[key]).toLowerCase()} onChange={(e) => edit({ palette: { [key]: e.target.value } })} className="w-10 h-10 rounded-lg border border-line cursor-pointer bg-white p-0.5" aria-label={`${text} color`} />
                      {text}
                    </label>
                  ))}
                </div>
                {draft.palette.paper !== pal.paper && <p className="text-xs text-gray-400">Paper is lightened a little so lessons stay readable.</p>}
                <Select id="d-display" label="Headings" value={draft.type.display} options={DISPLAY_FONTS.map((f) => [f, fontName('display', f)])} onChange={(display) => edit({ type: { display } })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select id="d-body" label="Reading text" value={draft.type.body} options={BODY_FONTS.map((f) => [f, fontName('body', f)])} onChange={(body) => edit({ type: { body } })} />
                  <Select id="d-label" label="Small labels" value={draft.type.label} options={LABEL_FONTS.map((f) => [f, fontName('label', f)])} onChange={(label) => edit({ type: { label } })} />
                </div>
                <Segmented label="Heading case" value={draft.type.headingCase} options={[['normal', 'Normal'], ['caps', 'ALL CAPS']]} onChange={(headingCase) => edit({ type: { headingCase } })} />
              </div>
            </details>

            <details className="group">
              <summary className="text-sm font-semibold cursor-pointer select-none">Pages</summary>
              <div className="space-y-3 mt-3">
                <Segmented label="Corners" value={draft.page.corners} options={[['round', 'Round'], ['soft', 'Soft'], ['square', 'Square']]} onChange={(corners) => edit({ page: { corners } })} />
                <Segmented label="Line under titles" value={draft.page.headerRule} options={[['ink', 'Thin ink'], ['accent', 'Accent'], ['heavy', 'Heavy']]} onChange={(headerRule) => edit({ page: { headerRule } })} />
                <Select id="d-mark" label="Small page mark" value={draft.page.mark} options={[['none', 'None'], ['x', 'X'], ['ring', 'Rings'], ['arrow', 'Arrow'], ['crosshair', 'Crosshair'], ['barcode', 'Barcode'], ['dot', 'Dot']]} onChange={(mark) => edit({ page: { mark } })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select id="d-q" label="Questions" value={draft.components.questions} options={[['numbers', 'Numbered'], ['boxed', 'Boxed']]} onChange={(questions) => edit({ components: { questions } })} />
                  <Select id="d-s" label="Scripture" value={draft.components.scripture} options={[['panel', 'Tinted panel'], ['rule', 'Side rule']]} onChange={(scripture) => edit({ components: { scripture } })} />
                </div>
              </div>
            </details>

            {(['cover', 'divider'] as const).map((kind) => (
              <details key={kind} className="group">
                <summary className="text-sm font-semibold cursor-pointer select-none">{kind === 'cover' ? 'Cover' : 'Divider pages'} <span className="font-normal text-gray-400">· {draft.custom[kind] ? 'written by Diana' : `${draft[kind].motifs.length} shapes`}</span></summary>
                {draft.custom[kind] && (
                  <div className="mt-3 rounded-lg bg-accent/5 border border-accent/20 p-3 text-xs space-y-2">
                    <p>Diana wrote this page from scratch. Ask her for changes (e.g. "make the title bigger on the cover"), or switch back to the built-in design below.</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => edit({ custom: { [kind]: '' } })}>Use the built-in design</Button>
                  </div>
                )}
                <div className={`space-y-3 mt-3 ${draft.custom[kind] ? 'hidden' : ''}`}>
                  <div>
                    <Label>Background</Label>
                    <div className="flex gap-1.5">
                      {TONES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          title={TONE_NAMES[t]}
                          aria-label={TONE_NAMES[t]}
                          onClick={() => editSurface(kind, { background: t })}
                          className={`w-8 h-8 rounded-lg border ${draft[kind].background === t ? 'ring-2 ring-accent ring-offset-1' : 'border-line'}`}
                          style={{ background: toneColor(pal, t) }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select id={`d-${kind}-layout`} label="Title position" value={draft[kind].layout} options={[['top', 'Top'], ['center', 'Middle'], ['bottom', 'Bottom']]} onChange={(layout) => editSurface(kind, { layout })} />
                    <Select id={`d-${kind}-align`} label="Alignment" value={draft[kind].align} options={[['left', 'Left'], ['center', 'Center'], ['right', 'Right']]} onChange={(align) => editSurface(kind, { align })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select id={`d-${kind}-dir`} label="Title direction" value={draft[kind].titleDirection} options={[['across', 'Across'], ['up', 'Vertical (spine)']]} onChange={(titleDirection) => editSurface(kind, { titleDirection })} />
                    <Select id={`d-${kind}-box`} label="Label box" value={draft[kind].titleBox} options={[['none', 'None'], ['outline', 'Outline'], ['solid', 'Filled']]} onChange={(titleBox) => editSurface(kind, { titleBox })} />
                  </div>
                  <div>
                    <Label htmlFor={`d-${kind}-scale`}>Title size</Label>
                    <input id={`d-${kind}-scale`} type="range" min={0.7} max={1.4} step={0.05} value={draft[kind].titleScale} onChange={(e) => editSurface(kind, { titleScale: Number(e.target.value) })} className="w-full" />
                  </div>
                  {draft[kind].motifs.length > 0 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => editSurface(kind, { motifs: [] })}>Remove all shapes</Button>
                  )}
                </div>
              </details>
            ))}

            {(series.designHistory?.length ?? 0) > 0 && (
              <details className="group">
                <summary className="text-sm font-semibold cursor-pointer select-none inline-flex items-center gap-1.5"><History className="w-4 h-4" /> History</summary>
                <ol className="mt-2 space-y-1.5">
                  {series.designHistory!.map((rev, i) => (
                    <li key={rev.id} className="flex items-start gap-2 text-xs">
                      <span className="flex-1 min-w-0">
                        <b className="block truncate">{i === 0 ? 'Current · ' : ''}{rev.prompt ? `"${rev.prompt}"` : rev.note ?? 'Manual changes'}</b>
                        <span className="text-gray-400">{when(rev.createdAt)} · {rev.source === 'diana' || rev.source === 'reference-image' ? 'Diana' : rev.source === 'look' ? 'Look' : 'By hand'}</span>
                      </span>
                      {i > 0 && <button type="button" className="text-accent hover:underline inline-flex items-center gap-1" onClick={() => restore(rev)}><RotateCcw className="w-3 h-3" /> Restore</button>}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>

          <div className="border-t border-line p-4 flex items-center gap-2">
            <Button type="button" className="flex-1" icon={Check} disabled={!changed} onClick={apply}>{changed ? 'Apply design' : 'Applied'}</Button>
            <Button type="button" variant="outline" disabled={!changed} onClick={() => { setDraft(saved); setPending({ source: 'manual' }); setNote(null); }}>Discard</Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-[#E9EDF3]">
          <div className="flex items-center gap-2 px-4 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{showCurrent ? 'Current design' : changed ? 'Proposed design (not applied yet)' : 'Preview'}</span>
            {changed && (
              <button type="button" className="ml-auto text-xs font-semibold text-accent hover:underline" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? 'Show proposed' : 'Compare with current'}
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <DesignPreview series={{ ...series, design: showCurrent ? saved : draft }} weeks={weeks} />
          </div>
        </div>
      </div>
    </div>
  );
};
