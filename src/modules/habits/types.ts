import type {
  Difficulty,
  HabitStatus,
  Priority,
  Recurrence,
} from "@/modules/habits/lib/rules";
import type { AwardResult } from "@/modules/gamification/types";
import type { PenaltyResult } from "@/modules/gamification/service";

export type HabitView = {
  id: string;
  title: string;
  notes: string | null;
  skillId: string | null;
  skillName: string | null;

  scheduledTime: string | null;
  gracePeriodMin: number;
  recurrence: Recurrence;
  weeklyDays: number[];

  difficulty: Difficulty;
  priority: Priority;
  xpReward: number;
  penaltyXp: number;
  penaltyCoins: number;

  currentStreak: number;
  longestStreak: number;

  status: HabitStatus;
  scheduledToday: boolean;
  completedToday: boolean;
  deadlineTime: string | null;

  recentEntries: string[];
  totalCompletions: number;
  createdAt: string;
};

export type CheckInHabitResult = {
  habit: HabitView;
  status: HabitStatus;
  xpAwarded: number;
  penaltyApplied: number;
  award: AwardResult | null;
  penalty: PenaltyResult | null;
  allOnTimeBonus: AwardResult | null;
  message: string;
};

export type SettleResult = {
  missed: number;
  penaltyXp: number;
  penaltyCoins: number;
};

export type HabitStatsView = {
  disciplineScore: number;
  disciplineTracked: boolean;
  dailyScore: number;
  weeklyScore: number;
  onTime: number;
  late: number;
  missed: number;
  upcoming: number;
  scheduledToday: number;
};
