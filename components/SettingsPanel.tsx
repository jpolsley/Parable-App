import React, { useState } from 'react';
import { AISettings, DEFAULT_SETTINGS } from '../services/aiSettings';
import { Button } from './Button';
import { Icons } from './Icons';

interface SettingsPanelProps {
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  onClose: () => void;
}

const inputClass = "w-full bg-white border-2 border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors rounded-none";
const labelClass = "block font-bold text-gray-700 uppercase tracking-wider text-xs mb-2";

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, onClose }) => {
  const [draft, setDraft] = useState<AISettings>(settings);

  const update = (field: keyof AISettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ ...draft, [field]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...draft, baseUrl: draft.baseUrl.trim(), model: draft.model.trim(), apiKey: draft.apiKey.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-cream border-2 border-black shadow-hard w-full max-w-lg p-6 md:p-8 space-y-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-serif">AI Server</h2>
            <p className="text-sm text-gray-500 mt-1">
              Any OpenAI-compatible server works: Ollama, LM Studio, llama.cpp, vLLM, LocalAI.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-black" aria-label="Close">
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className={labelClass}>Base URL</label>
          <input className={inputClass} required value={draft.baseUrl} onChange={update('baseUrl')} placeholder={DEFAULT_SETTINGS.baseUrl} />
          <p className="text-xs text-gray-400 mt-1">Ollama: http://localhost:11434/v1 · LM Studio: http://localhost:1234/v1</p>
        </div>

        <div>
          <label className={labelClass}>Model</label>
          <input className={inputClass} required value={draft.model} onChange={update('model')} placeholder="llama3.1" />
        </div>

        <div>
          <label className={labelClass}>API Key (optional)</label>
          <input className={inputClass} type="password" value={draft.apiKey} onChange={update('apiKey')} placeholder="Leave blank if your server doesn't need one" />
          <p className="text-xs text-gray-400 mt-1">Saved only in this browser.</p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">Save</Button>
          <Button type="button" variant="outline" onClick={() => setDraft(DEFAULT_SETTINGS)}>Reset</Button>
        </div>
      </form>
    </div>
  );
};
