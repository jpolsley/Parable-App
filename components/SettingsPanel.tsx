import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Plug } from 'lucide-react';
import { AIServer, AISettings, DEFAULT_SETTINGS, cleanBaseUrl, serverKind } from '../services/aiSettings';
import { testConnection } from '../services/aiService';
import { useStore } from '../store/StoreContext';
import { Button, Label, Modal, Toggle, inputClass } from './ui';

const PRESETS: { name: string; hint: string; settings: Pick<AISettings, 'baseUrl' | 'model' | 'server'> & Partial<AISettings> }[] = [
  {
    name: 'Steward on this laptop',
    hint: 'Recommended. Goes through your Steward server, which handles the browser rules for you. Paste your Steward key below.',
    settings: { baseUrl: 'http://localhost:8787/v1', model: 'qwen3:8b', server: 'steward' },
  },
  {
    name: 'Ollama directly',
    hint: 'Qwen3-VL 8B Instruct on this computer: writes and can see reference pictures. Ollama must allow this site (OLLAMA_ORIGINS).',
    settings: { baseUrl: 'http://localhost:11434/v1', model: 'qwen3-vl:8b-instruct', server: 'ollama', apiKey: '' },
  },
];

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

  const update = (field: 'baseUrl' | 'model' | 'apiKey') => (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [field]: e.target.value });
  const cleaned = () => ({ ...draft, baseUrl: cleanBaseUrl(draft.baseUrl), model: draft.model.trim(), apiKey: draft.apiKey.trim() });

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
        <div className="grid sm:grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => { setDraft({ ...draft, enabled: true, ...p.settings }); setStatus(null); }}
              className={`text-left rounded-xl border p-3 transition-colors hover:border-accent hover:bg-accent-soft/50 ${draft.enabled && serverKind(draft) === p.settings.server && draft.baseUrl === p.settings.baseUrl ? 'border-accent bg-accent-soft/50' : 'border-line'}`}
            >
              <span className="font-semibold text-sm block">{p.name}</span>
              <span className="text-xs text-gray-500">{p.hint}</span>
            </button>
          ))}
        </div>

        <fieldset disabled={!draft.enabled} className="space-y-4 disabled:opacity-50">
          <div>
            <Label htmlFor="ai-url">Server URL</Label>
            <input id="ai-url" className={inputClass} required value={draft.baseUrl} onChange={update('baseUrl')} placeholder={DEFAULT_SETTINGS.baseUrl} />
            <p className="text-xs text-gray-400 mt-1">Steward: http://localhost:8787/v1 · Ollama: http://localhost:11434/v1</p>
          </div>
          <div>
            <Label htmlFor="ai-model">Model</Label>
            <input id="ai-model" className={inputClass} required value={draft.model} onChange={update('model')} placeholder="qwen3:8b" />
          </div>
          <div>
            <Label htmlFor="ai-server">Server type</Label>
            <select id="ai-server" className={inputClass} value={draft.server} onChange={(e) => setDraft({ ...draft, server: e.target.value as AIServer })}>
              <option value="auto">Detect from the URL</option>
              <option value="steward">Steward</option>
              <option value="ollama">Ollama</option>
              <option value="openai">Other OpenAI-compatible server</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Pick Steward or Ollama yourself when using a Tailscale address.</p>
          </div>
          <div>
            <Label htmlFor="ai-key">{serverKind(draft) === 'steward' ? 'Steward key' : 'API key (optional)'}</Label>
            <input
              id="ai-key"
              className={inputClass}
              type="password"
              required={serverKind(draft) === 'steward'}
              value={draft.apiKey}
              onChange={update('apiKey')}
              placeholder={serverKind(draft) === 'steward' ? 'STEWARD_KEY from ~/Steward/server/steward.env' : "Leave blank if your server doesn't need one"}
            />
            <p className="text-xs text-gray-400 mt-1">Saved only in this browser.</p>
          </div>
          {serverKind(draft) === 'steward' && (
            <Toggle checked={draft.useDocs} onChange={(useDocs) => setDraft({ ...draft, useDocs })} label="Let Steward add passages from my documents" />
          )}
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
