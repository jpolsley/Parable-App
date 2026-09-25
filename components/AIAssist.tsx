import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { Button, TextArea, inputClass } from './ui';

interface AIAssistProps {
  label: string;
  placeholder?: string;
  hasExisting: boolean;
  run: (instruction: string) => Promise<string>;
  onApply: (text: string, mode: 'replace' | 'append') => void;
}

// A collapsed "✨" button that expands into prompt → preview → apply. Nothing changes until the leader applies it.
export const AIAssist: React.FC<AIAssistProps> = ({ label, placeholder, hasExisting, run, onApply }) => {
  const { aiSettings } = useStore();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!aiSettings.enabled) return null;

  const reset = () => {
    setOpen(false);
    setResult(null);
    setError('');
    setInstruction('');
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      setResult(await run(instruction.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
        <Sparkles className="w-3.5 h-3.5" /> {label}
      </button>
    );
  }

  return (
    <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-2">
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && generate()}
          placeholder={placeholder ?? 'Optional direction, e.g. "shorter", "add humor", "for 3rd graders"'}
          autoFocus
        />
        <Button type="button" size="sm" variant="ai" icon={Sparkles} loading={loading} onClick={generate}>
          {result ? 'Retry' : 'Draft'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
      {result !== null && (
        <>
          <TextArea value={result} onChange={(e) => setResult(e.target.value)} minRows={4} aria-label="AI draft" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => { onApply(result, 'replace'); reset(); }}>
              {hasExisting ? 'Replace' : 'Use this'}
            </Button>
            {hasExisting && (
              <Button type="button" size="sm" variant="outline" onClick={() => { onApply(result, 'append'); reset(); }}>
                Append
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={reset}>Discard</Button>
          </div>
        </>
      )}
      {result === null && (
        <button type="button" onClick={reset} className="text-xs text-gray-500 hover:text-black">Cancel</button>
      )}
    </div>
  );
};
