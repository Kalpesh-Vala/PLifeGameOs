export const PROJECT_STATUSES = [
  "idea",
  "building",
  "shipped",
  "paused",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectView = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  techStack: string[];
  url: string | null;
  repoUrl: string | null;
  createdAt: string;
};

export const PROJECT_XP = 60;
