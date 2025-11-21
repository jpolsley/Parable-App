
export interface TeachingPoint {
  point: string;
  description: string;
}

export interface WeekContent {
  week_number: number;
  title: string;
  scripture_reference: string;
  key_verse: string;
  main_idea: string;
  learning_objective: string;
  hook: string;
  teaching_points: TeachingPoint[]; 
  discussion_questions: string[];
  application_challenge: string;
  activity_idea: string;
}

export interface CurriculumSeries {
  title: string;
  description: string;
  target_audience: string;
  weeks: WeekContent[];
}

export interface GeneratorParams {
  topic: string;
  audience: string;
  duration: number; // number of weeks
  tone: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  VIEWING = 'VIEWING',
  ERROR = 'ERROR'
}
