import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Database, Part, PrintScope, Service } from '../types';
import { clonePart, newPart, newService } from '../lib/factory';
import { AISettings, loadSettings, saveSettings } from '../services/aiSettings';

const STORAGE_KEY = 'parable.db.v1';

const loadDb = (): Database => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        version: 1,
        services: Array.isArray(data.services) ? data.services.map(newService) : [],
        library: Array.isArray(data.library) ? data.library.map(newPart) : [],
      };
    }
  } catch {
    // unreadable storage: start fresh rather than crash
  }
  return { version: 1, services: [], library: [] };
};

export type SaveState = 'saved' | 'saving' | 'error';

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
  saveToLibrary: (part: Part) => void;
  removeFromLibrary: (id: string) => void;
  importDatabase: (data: Partial<Database>) => number;
  toasts: Toast[];
  toast: (message: string, undo?: () => void) => void;
  dismissToast: (id: number) => void;
  aiSettings: AISettings;
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
    setDb((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) }));
    toast(`Deleted "${removed.title}"`, () =>
      setDb((cur) => {
        const services = [...cur.services];
        services.splice(Math.min(index, services.length), 0, removed);
        return { ...cur, services };
      }),
    );
  }, [toast]);

  const saveToLibrary = useCallback((part: Part) => {
    setDb((d) => ({ ...d, library: [clonePart(part), ...d.library] }));
    toast(`Saved "${part.title}" to your library`);
  }, [toast]);

  const removeFromLibrary = useCallback((id: string) => {
    setDb((d) => ({ ...d, library: d.library.filter((p) => p.id !== id) }));
  }, []);

  // Merge a backup or a single exported service. Existing ids are replaced.
  const importDatabase = useCallback((data: Partial<Database>) => {
    const services = (data.services ?? []).map(newService);
    const library = (data.library ?? []).map(newPart);
    setDb((d) => {
      const ids = new Set(services.map((s) => s.id));
      const libIds = new Set(library.map((p) => p.id));
      return {
        ...d,
        services: [...services, ...d.services.filter((s) => !ids.has(s.id))],
        library: [...library, ...d.library.filter((p) => !libIds.has(p.id))],
      };
    });
    return services.length + library.length;
  }, []);

  const setAiSettings = useCallback((s: AISettings) => {
    setAiSettingsState(s);
    saveSettings(s);
  }, []);

  const print = useCallback((serviceId: string, scope: PrintScope) => setPrintJob({ serviceId, scope }), []);

  // Print once the print view has rendered, then clear it.
  useEffect(() => {
    if (!printJob) return;
    const done = () => setPrintJob(null);
    window.addEventListener('afterprint', done, { once: true });
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', done);
    };
  }, [printJob]);

  return (
    <StoreContext.Provider
      value={{
        db, saveState, addServices, updateService, deleteService, saveToLibrary, removeFromLibrary, importDatabase,
        toasts, toast, dismissToast, aiSettings, setAiSettings, settingsOpen, setSettingsOpen, printJob, print,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
