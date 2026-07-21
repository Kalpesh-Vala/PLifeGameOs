export type QuestMetric = "tasks" | "habits" | "checkin" | "xp";
export type QuestPeriod = "daily" | "weekly";

export type QuestDefinition = {
  id: string;
  title: string;
  metric: QuestMetric;
  target: number;
  xpReward: number;
};

/** Pool of daily quests. A random few are chosen each day. */
export const DAILY_QUESTS: QuestDefinition[] = [
  { id: "d-task-1", title: "Complete 1 task", metric: "tasks", target: 1, xpReward: 15 },
  { id: "d-task-3", title: "Complete 3 tasks", metric: "tasks", target: 3, xpReward: 35 },
  { id: "d-habit-1", title: "Complete 1 habit", metric: "habits", target: 1, xpReward: 20 },
  { id: "d-habit-2", title: "Complete 2 habits", metric: "habits", target: 2, xpReward: 30 },
  { id: "d-checkin", title: "Check in today", metric: "checkin", target: 1, xpReward: 15 },
  { id: "d-xp-100", title: "Earn 100 XP", metric: "xp", target: 100, xpReward: 30 },
];

/** Pool of weekly missions. A random few are chosen each week. */
export const WEEKLY_MISSIONS: QuestDefinition[] = [
  { id: "w-task-10", title: "Complete 10 tasks", metric: "tasks", target: 10, xpReward: 100 },
  { id: "w-habit-15", title: "Complete 15 habit check-offs", metric: "habits", target: 15, xpReward: 120 },
  { id: "w-checkin-5", title: "Check in on 5 days", metric: "checkin", target: 5, xpReward: 80 },
  { id: "w-xp-500", title: "Earn 500 XP", metric: "xp", target: 500, xpReward: 150 },
  { id: "w-task-20", title: "Complete 20 tasks", metric: "tasks", target: 20, xpReward: 200 },
];

export const QUESTS_PER_DAY = 3;
export const MISSIONS_PER_WEEK = 3;

export function poolFor(period: QuestPeriod): QuestDefinition[] {
  return period === "daily" ? DAILY_QUESTS : WEEKLY_MISSIONS;
}

export function questCountFor(period: QuestPeriod): number {
  return period === "daily" ? QUESTS_PER_DAY : MISSIONS_PER_WEEK;
}

export function getQuestDefinition(
  period: QuestPeriod,
  id: string,
): QuestDefinition | undefined {
  return poolFor(period).find((q) => q.id === id);
}
