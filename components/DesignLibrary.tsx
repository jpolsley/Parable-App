import React, { useRef } from 'react';
import { Download, LayoutTemplate, Trash2, Upload } from 'lucide-react';
import { Database, LayoutPack, Series } from '../types';
import { readLayout } from '../lib/layouts';
import { downloadJson, readJsonFile, slug } from '../lib/files';
import { newSeries } from '../lib/factory';
import { weeksOf } from '../lib/series';
import { useStore } from '../store/StoreContext';
import { LayoutThumb } from './print/PrintView';
import { Button, IconButton } from './ui';

// Thumbnails show a real series' cover text when there is one, so designs are judged on real words.
export const sampleFor = (db: Database, series?: Series) => {
  const s = series ?? db.series.find((x) => weeksOf(db, x.id).length) ?? newSeries({ id: 'sample', title: 'Series Title', audience: 'Students', bigIdea: 'One big idea that ties the whole series together.' });
  return { series: s, weeks: weeksOf(db, s.id) };
};

// Read a layout file and keep it in the design library. Returns the saved design, or throws with a reason.
export const useImportDesign = () => {
  const { addLayout, toast } = useStore();
  return async (file: File, quiet = false): Promise<LayoutPack> => {
    let pack: LayoutPack;
    try {
      pack = readLayout(await readJsonFile(file));
    } catch (e) {
      throw new Error(e instanceof SyntaxError ? "That file isn't valid JSON." : e instanceof Error ? e.message : "That file couldn't be read as a design.");
    }
    addLayout(pack);
    if (!quiet) toast(`Added "${pack.name}" to your design library`);
    return pack;
  };
};

// The design library on the Library page: every saved book design, ready for any series.
export const DesignLibrary: React.FC = () => {
  const { db, deleteLayout, addLayout, toast } = useStore();
  const importDesign = useImportDesign();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState('');
  const layouts = db.layouts ?? [];
  const sample = sampleFor(db);
  const usedBy = (l: LayoutPack) => db.series.filter((s) => s.design?.custom.name === l.name).length;

  const remove = (l: LayoutPack) => {
    deleteLayout(l.id);
    toast(`Removed "${l.name}" from your design library`, () => addLayout(l));
  };

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-2xl font-display">Book designs</h2>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Complete looks for a printed book: cover, divider pages and page styles. Import a design file you made with Claude, then pick it in any series' <b>Design</b> screen.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>Import design file</Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) { setError(''); importDesign(f).catch((err: Error) => setError(err.message)); }
          }}
        />
      </div>
      {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
      {layouts.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white/50 p-8 text-center text-sm text-gray-500">
          <LayoutTemplate className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          No saved designs yet. Import a <code>.parable-layout.json</code> file.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {layouts.map((l) => {
            const n = usedBy(l);
            return (
              <li key={l.id} className="bg-white border border-line rounded-xl p-3 flex flex-col gap-2">
                <div className="flex justify-center"><LayoutThumb pack={l} series={sample.series} weeks={sample.weeks} width={150} /></div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{l.name}</p>
                  {l.description && <p className="text-xs text-gray-500 line-clamp-2" title={l.description}>{l.description}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{n ? `Used by ${n} series` : 'Not used yet'}</p>
                </div>
                <div className="flex justify-end gap-1 mt-auto">
                  <IconButton icon={Download} label={`Download ${l.name}`} onClick={() => downloadJson(`${slug(l.name)}.parable-layout.json`, l)} />
                  <IconButton icon={Trash2} label={`Remove ${l.name} from the library`} onClick={() => remove(l)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
