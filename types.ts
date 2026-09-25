export type PartType =
  | 'script'
  | 'bible-story'
  | 'bible-verse'
  | 'worship'
  | 'video'
  | 'game'
  | 'group-activity'
  | 'discussion'
  | 'prayer'
  | 'craft'
  | 'announcement'
  | 'other';

// How a supply quantity scales: a fixed amount, or multiplied by class size / group count.
export type SupplyPer = 'total' | 'person' | 'group';

export interface Supply {
  id: string;
  name: string;
  qty: number;
  per: SupplyPer;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface Part {
  id: string;
  title: string;
  type: PartType;
  minutes: number;
  hidden: boolean;
  pageBreak: boolean;
  script: string;
  instructions: string;
  supplies: Supply[];
  media: LinkItem[];
  resources: LinkItem[];
  inclusionTips: string;
  leaderNotes: string;
}

export interface Section {
  id: string;
  title: string;
  hidden: boolean;
  pageBreak: boolean;
  collapsed: boolean;
  parts: Part[];
}

export type SeriesColor = 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

export interface Series {
  id: string;
  title: string;
  description: string;
  audience: string;
  color: SeriesColor;
  startDate: string; // YYYY-MM-DD; week N is scheduled startDate + 7 * (N - 1)
  bigIdea: string;
  memoryVerse: string;
  createdAt: number;
  updatedAt: number;
}

export interface Service {
  id: string;
  title: string;
  audience: string;
  seriesId: string | null;
  week: number | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM, 24h
  classSize: number;
  groupCount: number;
  bigIdea: string;
  keyVerse: string;
  scripture: string;
  checkedSupplies: string[];
  sections: Section[];
  createdAt: number;
  updatedAt: number;
}

export interface Database {
  version: 1;
  series: Series[];
  services: Service[];
  library: Part[];
}

export type PrintScope =
  | { kind: 'series-book'; seriesId: string }
  | { kind: 'series'; seriesId: string }
  | { kind: 'series-takehome'; seriesId: string }
  | { kind: 'guide'; takeHome?: boolean }
  | { kind: 'takehome' }
  | { kind: 'run-sheet' }
  | { kind: 'supplies' }
  | { kind: 'section'; sectionId: string }
  | { kind: 'part'; sectionId: string; partId: string };
