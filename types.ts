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

// ---------- Book design ----------
// How a series looks in print, as data. The renderer reads it; Diana edits it with small patches;
// lib/design.ts fills every missing field with a default and clamps anything out of range.

export type DesignTone = 'paper' | 'ink' | 'accent' | 'secondary' | 'muted' | 'deep';
export type MotifType = 'band' | 'circle' | 'ring' | 'x' | 'track' | 'line' | 'frame' | 'arrow' | 'grid' | 'barcode' | 'stripes' | 'crosshair' | 'label';

// One shape on a cover or divider. Positions and sizes are fractions of the page:
// x 0 = left edge, 1 = right edge; y 0 = top, 1 = bottom; size is a fraction of the page width.
export interface Motif {
  type: MotifType;
  x: number;
  y: number;
  size: number;
  aspect: number; // width ÷ height for bands, tracks, frames, grids, stripes, barcodes
  rotation: number; // degrees
  tone: DesignTone;
  style: 'solid' | 'outline';
  opacity: number; // 0.05–1
  count: number; // rings in a ring, bars in a barcode, lines in a grid
  text: string; // label motifs only
}

export interface DesignSurface {
  background: DesignTone;
  layout: 'bottom' | 'center' | 'top';
  align: 'left' | 'center' | 'right';
  titleScale: number; // 0.7–1.4
  titleDirection: 'across' | 'up'; // 'up' sets the title huge and vertical, reading bottom to top, like a book spine
  titleBox: 'none' | 'outline' | 'solid'; // a label box around the small text (eyebrow, theme)
  showCount: boolean; // the big "05 weeks" number on the cover
  motifs: Motif[];
}

export interface BookDesign {
  palette: { paper: string; ink: string; accent: string; secondary: string; muted: string; deep: string }; // deep '' = derived from accent
  type: {
    display: 'jakarta' | 'fraunces' | 'dmserif' | 'oswald' | 'nunito' | 'grotesk' | 'inter' | 'mono';
    body: 'serif' | 'sans' | 'rounded';
    label: 'sans' | 'mono';
    headingCase: 'normal' | 'caps';
  };
  page: {
    corners: 'round' | 'soft' | 'square';
    headerRule: 'ink' | 'accent' | 'heavy';
    mark: 'none' | 'x' | 'ring' | 'arrow' | 'crosshair' | 'barcode' | 'dot';
  };
  components: { questions: 'numbers' | 'boxed'; scripture: 'panel' | 'rule' };
  cover: DesignSurface;
  divider: DesignSurface;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? Partial<U>[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type BookDesignPatch = DeepPartial<BookDesign>;

export interface DesignRevision {
  id: string;
  createdAt: number;
  source: 'manual' | 'diana' | 'look' | 'reference-image';
  prompt?: string;
  note?: string;
  design: BookDesign;
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
  design?: BookDesign; // missing means the default look
  designHistory?: DesignRevision[]; // newest first, kept short
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
