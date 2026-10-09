import { Database } from '../../types';
import bless from './bless.json';
import spine from '../../layouts/spine.parable-layout.json';
import posterClub from '../../layouts/poster-club.parable-layout.json';

// A newer version of a built-in series, and how to recognize the older copy a browser may still hold:
// an untouched copy (series text and every week exactly as shipped) is replaced in place.
export interface Replaces {
  key: string; // the older sample's key
  seriesId: string;
  stamp: number; // the older weeks' updatedAt; any edit changes it
  fingerprint: number; // hash of the older series' text (see seriesFingerprint)
}

// Series that come built in. Each is added once per browser; deleting one keeps it gone.
export const SAMPLES: { key: string; data: Partial<Database>; replaces?: Replaces }[] = [
  // B.L.E.S.S. rewritten to follow the Ministry Playbook (first shipped as "bless").
  {
    key: 'bless-v2',
    data: bless as unknown as Partial<Database>,
    replaces: { key: 'bless', seriesId: 'bless-series', stamp: 1790726400000, fingerprint: 553312865 },
  },
];

export const seriesFingerprint = (s: { title: string; description: string; bigIdea: string; memoryVerse: string; leaderGuide: string; audience: string }) => {
  let x = 5381;
  for (const c of [s.title, s.description, s.bigIdea, s.memoryVerse, s.leaderGuide, s.audience].join('|')) x = ((x * 33) ^ c.charCodeAt(0)) >>> 0;
  return x;
};

// Book designs that come built in, added to the design library once per browser the same way.
export const SAMPLE_LAYOUTS: { key: string; data: unknown; replacesId?: string }[] = [
  // Spine v2 has white paper; it takes the place of the older tan version in the library (books keep their own copy).
  { key: 'layout:spine-v2', data: spine, replacesId: 'spine-v1' },
  { key: 'layout:poster-club', data: posterClub },
];
