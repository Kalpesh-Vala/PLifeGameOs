export type BossStatus = "active" | "defeated";

export type MilestoneView = {
  id: string;
  title: string;
  done: boolean;
};

export type BossBattleView = {
  id: string;
  title: string;
  description: string | null;
  status: BossStatus;
  milestones: MilestoneView[];
  totalMilestones: number;
  doneMilestones: number;
  progressPct: number;
  xpReward: number;
  skillId: string | null;
  skillName: string | null;
  deadline: string | null;
  defeatedAt: string | null;
  createdAt: string;
};

/** Projected XP for defeating a boss, scaling with the number of milestones. */
export function bossXpReward(milestoneCount: number): number {
  return 50 + 25 * Math.max(1, milestoneCount);
}
