import { Database } from '../../types';
import bless from './bless.json';
import spine from '../../layouts/spine.parable-layout.json';

// Series that come built in. Each is added once per browser; deleting one keeps it gone.
export const SAMPLES: { key: string; data: Partial<Database> }[] = [
  { key: 'bless', data: bless as unknown as Partial<Database> },
];

// Book designs that come built in, added to the design library once per browser the same way.
export const SAMPLE_LAYOUTS: { key: string; data: unknown }[] = [
  { key: 'layout:spine', data: spine },
];
