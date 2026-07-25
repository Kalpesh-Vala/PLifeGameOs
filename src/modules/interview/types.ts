export const INTERVIEW_CATEGORIES = [
  "DSA",
  "System Design",
  "Behavioral",
  "CS Fundamentals",
  "Frontend",
  "Backend",
  "Domain",
  "Other",
] as const;

export type InterviewCategory = (typeof INTERVIEW_CATEGORIES)[number];

export const INTERVIEW_STATUSES = ["todo", "learning", "confident"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export type InterviewTopicView = {
  id: string;
  title: string;
  category: string;
  status: InterviewStatus;
  note: string | null;
  createdAt: string;
};

export type InterviewStats = {
  total: number;
  confident: number;
  learning: number;
  todo: number;
  readiness: number;
};

export const INTERVIEW_XP = 25;

/** Maps a prep category to the skill that gains XP when mastered. */
export const CATEGORY_SKILL: Record<string, string> = {
  DSA: "dsa",
  "System Design": "system-design",
  Behavioral: "communication",
  Frontend: "frontend",
  Backend: "backend",
  "CS Fundamentals": "programming",
  Domain: "programming",
  Other: "programming",
};
