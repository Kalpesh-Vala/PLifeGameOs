import type { SkillCategory } from "@/modules/gamification/lib/skills";
import type { AchievementTier } from "@/modules/gamification/lib/achievements";

export type SkillView = {
  id: string;
  name: string;
  category: SkillCategory;
  icon: string;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
};

export type AchievementView = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  unlocked: boolean;
  unlockedAt: string | null;
  secret: boolean;
};

export type ProfileView = {
  level: number;
  title: string;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  isMaxLevel: boolean;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  disciplineScore: number;
  disciplineTracked: boolean;
  lastCheckIn: string | null;
  checkedInToday: boolean;
  checkInCount: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
  skills: SkillView[];
};

export type UnlockedAchievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
};

export type AwardResult = {
  amount: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  fromLevel: number;
  skillLevelUp: { skillId: string; from: number; to: number } | null;
  unlockedAchievements: UnlockedAchievement[];
};

export type CheckInResult = AwardResult & {
  alreadyCheckedIn: boolean;
  currentStreak: number;
};

export type ActivityItem = {
  id: string;
  amount: number;
  source: string;
  skillId: string | null;
  note: string | null;
  createdAt: string;
};
