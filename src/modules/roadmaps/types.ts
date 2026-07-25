export type RoadmapStepView = {
  id: string;
  title: string;
  done: boolean;
};

export type RoadmapView = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  steps: RoadmapStepView[];
  totalSteps: number;
  doneSteps: number;
  progressPct: number;
  createdAt: string;
};

export const ROADMAP_STEP_XP = 5;
