const LIST_MARK = /^\s*(?:\d+[.)]|[-*•])\s+/;

// Split into non-empty lines, dropping "1." / "-" style markers.
export const listItems = (text: string) =>
  text.split('\n').map((l) => l.replace(LIST_MARK, '').trim()).filter(Boolean);

// True when most lines look like a list the leader typed ("1. …", "- …").
export const looksLikeList = (text: string) => {
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.length >= 2 && lines.filter((l) => LIST_MARK.test(l)).length >= Math.ceil(lines.length / 2);
};

export const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

// "[Hold up the jar] Have you…" → segments, so stage directions can be styled as cues.
export const cueSegments = (text: string): { cue: boolean; text: string }[] =>
  text.split(/(\[[^\]]+\])/).filter(Boolean).map((t) => (t.startsWith('[') && t.endsWith(']') ? { cue: true, text: t.slice(1, -1) } : { cue: false, text: t }));
