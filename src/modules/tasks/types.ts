export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "done";

export type TaskView = {
  id: string;
  title: string;
  notes: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  skillId: string | null;
  skillName: string | null;
  xpReward: number;
  completedAt: string | null;
  createdAt: string;
};

/** XP granted when a task of each priority is completed. */
export const TASK_XP: Record<TaskPriority, number> = {
  low: 10,
  medium: 20,
  high: 40,
};
