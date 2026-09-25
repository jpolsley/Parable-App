import React from 'react';
import { AlertTriangle, Bookmark, Check, Cloud, Layers, Loader2, Sparkles, Undo2, X } from 'lucide-react';
import { StoreProvider, useStore } from './store/StoreContext';
import { navigate, useRoute } from './lib/route';
import { Dashboard } from './components/Dashboard';
import { ServiceEditor } from './components/ServiceEditor';
import { LibraryPage } from './components/LibraryPage';
import { SettingsPanel } from './components/SettingsPanel';
import { PrintRoot } from './components/PrintView';

const SaveIndicator: React.FC = () => {
  const { saveState } = useStore();
  if (saveState === 'saving') return <span className="inline-flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />Saving…</span>;
  if (saveState === 'error') return <span className="inline-flex items-center gap-1.5 text-red-700"><AlertTriangle className="w-4 h-4" />Storage full. Export a backup.</span>;
  return <span className="inline-flex items-center gap-1.5"><Cloud className="w-4 h-4" /><Check className="w-3 h-3 -ml-2.5 mt-1" />Saved in this browser</span>;
};

const Shell: React.FC = () => {
  const route = useRoute();
  const { setSettingsOpen, aiSettings, toasts, dismissToast } = useStore();
  const nav = (active: boolean) => `px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${active ? 'bg-black/5 text-black' : 'text-gray-500 hover:text-black'}`;

  return (
    <>
      <div className="min-h-screen bg-cream font-sans text-charcoal print:hidden">
        <nav className="border-b border-black/10 bg-cream/90 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
            <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 font-bold text-lg tracking-tight font-serif mr-4">
              <Layers className="w-6 h-6" /> PARABLE
            </button>
            <button type="button" className={nav(route.name !== 'library')} onClick={() => navigate('/')}>Services</button>
            <button type="button" className={nav(route.name === 'library')} onClick={() => navigate('/library')}>
              <Bookmark className="w-4 h-4 inline -mt-0.5 mr-1" />Library
            </button>
            <div className="flex-1" />
            <span className="hidden md:inline text-xs text-gray-500 mr-3"><SaveIndicator /></span>
            <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black px-2 py-1.5 rounded-md hover:bg-black/5">
              <Sparkles className={`w-4 h-4 ${aiSettings.enabled ? 'text-brand-blue' : ''}`} />
              <span className="hidden sm:inline">AI {aiSettings.enabled ? 'on' : 'off'}</span>
            </button>
          </div>
        </nav>

        <main>
          {route.name === 'service' && <ServiceEditor key={route.id} serviceId={route.id} />}
          {route.name === 'library' && <LibraryPage />}
          {route.name === 'home' && <Dashboard />}
        </main>

        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2 w-[calc(100%-2rem)] max-w-md" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="flex items-center gap-3 bg-charcoal text-white rounded-lg px-4 py-3 shadow-lg text-sm">
              <span className="flex-1">{t.message}</span>
              {t.undo && (
                <button type="button" className="inline-flex items-center gap-1 font-semibold underline" onClick={() => { t.undo!(); dismissToast(t.id); }}>
                  <Undo2 className="w-4 h-4" />Undo
                </button>
              )}
              <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <SettingsPanel />
      </div>
      <PrintRoot />
    </>
  );
};

const App: React.FC = () => (
  <StoreProvider>
    <Shell />
  </StoreProvider>
);

export default App;
