export interface AISettings {
  enabled: boolean;
  baseUrl: string; // OpenAI-compatible base URL, e.g. http://localhost:11434/v1
  model: string;
  apiKey: string; // optional; most self-hosted servers ignore it
}

const STORAGE_KEY = 'parable.aiSettings';

// AI is opt-in: the builder is fully usable without a server.
export const DEFAULT_SETTINGS: AISettings = {
  enabled: false,
  baseUrl: import.meta.env.VITE_AI_BASE_URL || 'http://localhost:11434/v1',
  model: import.meta.env.VITE_AI_MODEL || 'llama3.1',
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
};

export const loadSettings = (): AISettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Settings saved before the on/off switch existed belong to someone who already set up a server.
      return { ...DEFAULT_SETTINGS, enabled: true, ...saved };
    }
  } catch {
    // storage unavailable or corrupt; fall back to defaults
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AISettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable; settings last for this page load only
  }
};
