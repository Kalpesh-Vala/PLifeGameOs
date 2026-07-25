export type LearningStatus = "planned" | "in-progress" | "completed";

export type LearningItemView = {
  id: string;
  title: string;
  provider: string | null;
  url: string | null;
  status: LearningStatus;
  progress: number;
  createdAt: string;
};

export const LEARNING_XP = 40;
