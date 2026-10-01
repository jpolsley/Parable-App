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
  optional: boolean; // "Going deeper": extra material a leader can use if there's time
  script: string;
  instructions: string;
  supplies: Supply[];
  media: LinkItem[];
  resources: LinkItem[];
  inclusionTips: string;
  leaderNotes: string;
}

// Who a section is for: the whole room, small group leaders, or neither (arrival, games, announcements).
export type SectionRole = 'large' | 'small' | 'other';

export interface Section {
  id: string;
  title: string;
  role: SectionRole;
  hidden: boolean;
  pageBreak: boolean;
  collapsed: boolean;
  parts: Part[];
}

export type SeriesColor = 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

// How a series looks in print. Kept to a fixed set of choices so every combination prints well.
export interface SeriesDesign {
  fonts: 'modern' | 'classic' | 'editorial' | 'camp' | 'friendly' | 'bold';
  corners: 'round' | 'soft' | 'square';
  headings: 'normal' | 'caps';
  accent: string; // #RRGGBB, or '' to use the series color
}

export interface Series {
  id: string;
  title: string;
  description: string;
  audience: string;
  color: SeriesColor;
  startDate: string; // YYYY-MM-DD; week N is scheduled startDate + 7 * (N - 1)
  bigIdea: string;
  memoryVerse: string;
  leaderGuide: string; // welcome letter for the "Start here" page of the printed book
  design?: SeriesDesign; // missing means the default look
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
  objectives: string; // one per line
  keyVerse: string;
  scripture: string;
  checkedSupplies: string[];
  family: FamilyCues;
  sections: Section[];
  createdAt: number;
  updatedAt: number;
}

// Four everyday moments for parents to carry the lesson home.
export interface FamilyCues {
  morning: string;
  onTheGo: string;
  meal: string;
  bedtime: string;
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
  | { kind: 'series-small'; seriesId: string }
  | { kind: 'series-family'; seriesId: string }
  | { kind: 'series-takehome'; seriesId: string }
  | { kind: 'week' }
  | { kind: 'lesson' }
  | { kind: 'small' }
  | { kind: 'family' }
  | { kind: 'takehome' }
  | { kind: 'run-sheet' }
  | { kind: 'supplies' }
  | { kind: 'section'; sectionId: string }
  | { kind: 'part'; sectionId: string; partId: string };
