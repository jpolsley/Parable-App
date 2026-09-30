import { Database } from '../../types';
import bless from './bless.json';

// Series that come built in. Each is added once per browser; deleting one keeps it gone.
export const SAMPLES: { key: string; data: Partial<Database> }[] = [
  { key: 'bless', data: bless as unknown as Partial<Database> },
];
