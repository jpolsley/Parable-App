import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Plug } from 'lucide-react';
import { AISettings, DEFAULT_SETTINGS } from '../services/aiSettings';
import { testConnection } from '../services/aiService';
import { useStore } from '../store/StoreContext';
import { Button, Label, Modal, Toggle, inputClass } from './ui';

export const SettingsPanel: React.FC = () => {
  const { aiSettings, setAiSettings, settingsOpen, setSettingsOpen } = useStore();
  const [draft, setDraft] = useState<AISettings>(aiSettings);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      setDraft(aiSettings);
      setStatus(null);
    }
  }, [settingsOpen, aiSettings]);

  const update = (field: keyof AISettings) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [field]: e.target.value });
  const cleaned = () => ({ ...draft, baseUrl: draft.baseUrl.trim(), model: draft.model.trim(), apiKey: draft.apiKey.trim() });

  const test = async () => {
    setTesting(true);
    try {
      setStatus({ ok: true, message: await testConnection(cleaned()) });
    } catch (e) {
      setStatus({ ok: false, message: e instanceof Error ? e.message : 'Connection failed.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="AI assistant">
      <form
        onSubmit={(e) => { e.preventDefault(); setAiSettings(cleaned()); setSettingsOpen(false); }}
        className="space-y-5"
      >
        <p className="text-sm text-gray-600">
          Parable works fully without AI. Turn it on to get draft, improve, and suggest buttons from your own self-hosted model.
          It works with any OpenAI-compatible server: Ollama, LM Studio, llama.cpp, vLLM, or LocalAI.
        </p>
        <Toggle checked={draft.enabled} onChange={(enabled) => setDraft({ ...draft, enabled })} label="Show AI helpers" />

        <fieldset disabled={!draft.enabled} className="space-y-4 disabled:opacity-50">
          <div>
            <Label htmlFor="ai-url">Server URL</Label>
            <input id="ai-url" className={inputClass} required value={draft.baseUrl} onChange={update('baseUrl')} placeholder={DEFAULT_SETTINGS.baseUrl} />
            <p className="text-xs text-gray-400 mt-1">Ollama: http://localhost:11434/v1 · LM Studio: http://localhost:1234/v1</p>
          </div>
          <div>
            <Label htmlFor="ai-model">Model</Label>
            <input id="ai-model" className={inputClass} required value={draft.model} onChange={update('model')} placeholder="llama3.1" />
          </div>
          <div>
            <Label htmlFor="ai-key">API key (optional)</Label>
            <input id="ai-key" className={inputClass} type="password" value={draft.apiKey} onChange={update('apiKey')} placeholder="Leave blank if your server doesn't need one" />
            <p className="text-xs text-gray-400 mt-1">Saved only in this browser.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button type="button" size="sm" variant="outline" icon={Plug} loading={testing} onClick={test}>Test connection</Button>
            {status && (
              <span className={`inline-flex items-center gap-1.5 text-sm ${status.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                {status.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {status.message}
              </span>
            )}
          </div>
        </fieldset>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">Save</Button>
          <Button type="button" variant="outline" onClick={() => setDraft(DEFAULT_SETTINGS)}>Reset</Button>
        </div>
      </form>
    </Modal>
  );
};
