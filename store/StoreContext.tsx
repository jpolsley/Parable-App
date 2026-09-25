import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Database, Part, PrintScope, Series, Service } from '../types';
import { clonePart, newPart, newSeries, newService } from '../lib/factory';
import { migrateLegacySeries, reschedule, weeksOf } from '../lib/series';
import { AISettings, loadSettings, saveSettings } from '../services/aiSettings';
import { testConnection } from '../services/aiService';

const STORAGE_KEY = 'parable.db.v1';

const loadDb = (): Database => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const { services, series } = migrateLegacySeries(
        Array.isArray(data.services) ? data.services : [],
        Array.isArray(data.series) ? data.series.map(newSeries) : [],
      );
      return { version: 1, series, services, library: Array.isArray(data.library) ? data.library.map(newPart) : [] };
    }
  } catch {
    // unreadable storage: start fresh rather than crash
  }
  return { version: 1, series: [], services: [], library: [] };
};

export type SaveState = 'saved' | 'saving' | 'error';
export type AIStatus = 'off' | 'checking' | 'online' | 'offline';

interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}

interface PrintJob {
  serviceId: string;
  scope: PrintScope;
}

interface Store {
  db: Database;
  saveState: SaveState;
  addServices: (services: Service[]) => void;
  updateService: (id: string, fn: (s: Service) => Service) => void;
  deleteService: (id: string) => void;
  addSeries: (series: Series, weeks: Service[]) => void;
  updateSeries: (id: string, fn: (s: Series) => Series) => void;
  deleteSeries: (id: string) => void;
  reorderWeeks: (seriesId: string, orderedIds: string[]) => void;
  addWeeks: (seriesId: string, weeks: Service[]) => void;
  moveToSeries: (serviceId: string, seriesId: string | null) => void;
  saveToLibrary: (part: Part) => void;
  removeFromLibrary: (id: string) => void;
  importDatabase: (data: Partial<Database>) => number;
  toasts: Toast[];
  toast: (message: string, undo?: () => void) => void;
  dismissToast: (id: number) => void;
  aiSettings: AISettings;
  aiStatus: AIStatus;
  recheckAi: () => void;
  setAiSettings: (s: AISettings) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  printJob: PrintJob | null;
  print: (serviceId: string, scope: PrintScope) => void;
}

const StoreContext = createContext<Store | null>(null);

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Database>(loadDb);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [aiSettings, setAiSettingsState] = useState<AISettings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>('off');
  const [aiCheck, setAiCheck] = useState(0);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const firstRender = useRef(true);
  const dbRef = useRef(db);
  dbRef.current = db;

  // Autosave, debounced so typing doesn't write on every keystroke.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState('saving');
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [db]);

  const addServices = useCallback((services: Service[]) => {
    setDb((d) => ({ ...d, services: [...services, ...d.services] }));
  }, []);

  const updateService = useCallback((id: string, fn: (s: Service) => Service) => {
    setDb((d) => ({ ...d, services: d.services.map((s) => (s.id === id ? { ...fn(s), updatedAt: Date.now() } : s)) }));
  }, []);

  const toast = useCallback((message: string, undo?: () => void) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, undo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const deleteService = useCallback((id: string) => {
    const index = dbRef.current.services.findIndex((s) => s.id === id);
    const removed = dbRef.current.services[index];
    if (!removed) return;
    const seriesId = removed.seriesId;
    const order = seriesId ? weeksOf(dbRef.current, seriesId).map((s) => s.id) : [];
    const renumber = (d: Database) => (seriesId ? reschedule(d, seriesId) : d);
    setDb((d) => renumber({ ...d, services: d.services.filter((s) => s.id !== id) }));
    toast(`Deleted "${removed.title}"`, () =>
      setDb((cur) => {
        const services = [...cur.services];
        services.splice(Math.min(index, services.length), 0, removed);
        if (!seriesId) return { ...cur, services };
        // Put the week back in its old slot; weeks added since then go at the end.
        const present = new Set(services.filter((s) => s.seriesId === seriesId).map((s) => s.id));
        const restored = [...order.filter((id) => present.has(id)), ...[...present].filter((id) => !order.includes(id))];
        return reschedule({ ...cur, services }, seriesId, restored);
      }),
    );
  }, [toast]);

  const addSeries = useCallback((series: Series, weeks: Service[]) => {
    setDb((d) => reschedule({ ...d, series: [series, ...d.series], services: [...weeks.map((w) => ({ ...w, seriesId: series.id })), ...d.services] }, series.id, weeks.map((w) => w.id)));
  }, []);

  const updateSeries = useCallback((id: string, fn: (s: Series) => Series) => {
    setDb((d) => {
      const before = d.series.find((s) => s.id === id);
      const next = { ...d, series: d.series.map((s) => (s.id === id ? { ...fn(s), updatedAt: Date.now() } : s)) };
      const after = next.series.find((s) => s.id === id);
      return before && after && before.startDate !== after.startDate ? reschedule(next, id) : next;
    });
  }, []);

  const deleteSeries = useCallback((id: string) => {
    const snapshot = dbRef.current;
    const series = snapshot.series.find((s) => s.id === id);
    if (!series) return;
    setDb((d) => ({ ...d, series: d.series.filter((s) => s.id !== id), services: d.services.filter((s) => s.seriesId !== id) }));
    const removedWeeks = snapshot.services.filter((s) => s.seriesId === id);
    toast(`Deleted "${series.title}" and its ${removedWeeks.length} weeks`, () =>
      setDb((cur) => ({ ...cur, series: [series, ...cur.series], services: [...removedWeeks, ...cur.services] })),
    );
  }, [toast]);

  const reorderWeeks = useCallback((seriesId: string, orderedIds: string[]) => {
    setDb((d) => reschedule(d, seriesId, orderedIds));
  }, []);

  // Move a service into another series (as its last week) or make it stand-alone; renumber both series.
  const moveToSeries = useCallback((serviceId: string, seriesId: string | null) => {
    setDb((d) => {
      const service = d.services.find((s) => s.id === serviceId);
      if (!service || service.seriesId === seriesId) return d;
      const from = service.seriesId;
      const targetOrder = seriesId ? [...weeksOf(d, seriesId).map((s) => s.id), serviceId] : [];
      let next: Database = { ...d, services: d.services.map((s) => (s.id === serviceId ? { ...s, seriesId, week: seriesId ? s.week : null } : s)) };
      if (from) next = reschedule(next, from);
      if (seriesId) next = reschedule(next, seriesId, targetOrder);
      return next;
    });
  }, []);

  const addWeeks = useCallback((seriesId: string, weeks: Service[]) => {
    setDb((d) => {
      const existing = d.services.filter((s) => s.seriesId === seriesId).sort((a, b) => (a.week ?? 0) - (b.week ?? 0)).map((s) => s.id);
      const next = { ...d, services: [...d.services, ...weeks.map((w) => ({ ...w, seriesId }))] };
      return reschedule(next, seriesId, [...existing, ...weeks.map((w) => w.id)]);
    });
  }, []);

  const saveToLibrary = useCallback((part: Part) => {
    setDb((d) => ({ ...d, library: [clonePart(part), ...d.library] }));
    toast(`Saved "${part.title}" to your library`);
  }, [toast]);

  const removeFromLibrary = useCallback((id: string) => {
    setDb((d) => ({ ...d, library: d.library.filter((p) => p.id !== id) }));
  }, []);

  // Merge a backup or a single exported service. Existing ids are replaced.
  const importDatabase = useCallback((data: Partial<Database>) => {
    const { services, series } = migrateLegacySeries(
      (data.services ?? []) as unknown as Record<string, unknown>[],
      (data.series ?? []).map(newSeries),
    );
    const library = (data.library ?? []).map(newPart);
    setDb((d) => {
      const ids = new Set(services.map((s) => s.id));
      const seriesIds = new Set(series.map((s) => s.id));
      const libIds = new Set(library.map((p) => p.id));
      const allSeries = [...series, ...d.series.filter((s) => !seriesIds.has(s.id))];
      const known = new Set(allSeries.map((s) => s.id));
      // A single exported week may point at a series this browser doesn't have: import it as stand-alone.
      const imported = services.map((s) => (s.seriesId && !known.has(s.seriesId) ? { ...s, seriesId: null } : s));
      return {
        ...d,
        series: allSeries,
        services: [...imported, ...d.services.filter((s) => !ids.has(s.id))],
        library: [...library, ...d.library.filter((p) => !libIds.has(p.id))],
      };
    });
    return series.length + services.length + library.length;
  }, []);

  const setAiSettings = useCallback((s: AISettings) => {
    setAiSettingsState(s);
    saveSettings(s);
  }, []);

  // Check the AI server in the background. Informational only: nothing in the builder waits on it.
  useEffect(() => {
    if (!aiSettings.enabled) {
      setAiStatus('off');
      return;
    }
    let cancelled = false;
    setAiStatus('checking');
    testConnection(aiSettings)
      .then(() => !cancelled && setAiStatus('online'))
      .catch(() => !cancelled && setAiStatus('offline'));
    return () => {
      cancelled = true;
    };
  }, [aiSettings, aiCheck]);

  const recheckAi = useCallback(() => setAiCheck((n) => n + 1), []);

  const print = useCallback((serviceId: string, scope: PrintScope) => setPrintJob({ serviceId, scope }), []);

  // Print once the print view has rendered and its fonts have loaded (they're only fetched when first used), then clear it.
  useEffect(() => {
    if (!printJob) return;
    let cancelled = false;
    const done = () => setPrintJob(null);
    window.addEventListener('afterprint', done, { once: true });
    const faces = [
      "400 12pt 'Source Serif 4 Variable'", "italic 400 12pt 'Source Serif 4 Variable'",
      "400 12pt 'Inter Variable'", "700 12pt 'Inter Variable'", "800 12pt 'Plus Jakarta Sans Variable'",
    ];
    const fontsReady = Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready);
    const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
    Promise.race([fontsReady, timeout]).then(() => {
      if (!cancelled) requestAnimationFrame(() => window.print());
    });
    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', done);
    };
  }, [printJob]);

  return (
    <StoreContext.Provider
      value={{
        db, saveState, addServices, updateService, deleteService, addSeries, updateSeries, deleteSeries, reorderWeeks, addWeeks, moveToSeries, saveToLibrary, removeFromLibrary, importDatabase,
        toasts, toast, dismissToast, aiSettings, aiStatus, recheckAi, setAiSettings, settingsOpen, setSettingsOpen, printJob, print,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
