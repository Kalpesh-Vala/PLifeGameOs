export type PeriodStats = {
  days: number;
  xpEarned: number;
  tasksCompleted: number;
  habitsCompleted: number;
  checkIns: number;
  journalEntries: number;
  questsClaimed: number;
  activeDays: number;
};

export type SourceBreakdown = {
  source: string;
  label: string;
  xp: number;
  count: number;
};

export type BalanceSlice = {
  category: string;
  xp: number;
};

export type SkillBar = {
  name: string;
  level: number;
  xp: number;
  progressPct: number;
};

export type TrendPoint = { date: string; xp: number };
export type DowPoint = { day: string; xp: number };
export type HabitOutcomePoint = {
  date: string;
  onTime: number;
  late: number;
  missed: number;
};
export type CompletionMix = { type: string; count: number };

export type AnalyticsOverview = {
  level: number;
  title: string;
  totalXp: number;
  disciplineScore: number;
  currentStreak: number;
  longestStreak: number;
  productivityScore: number;
  habitConsistency: number;
  period: PeriodStats;
  xpBySource: SourceBreakdown[];
  lifeBalance: BalanceSlice[];
  skills: SkillBar[];
  xpHeatmap: Record<string, number>;
  moodTrend: { date: string; mood: number | null; energy: number | null }[];
  xpTrend: TrendPoint[];
  dowActivity: DowPoint[];
  habitOutcomes: HabitOutcomePoint[];
  completionMix: CompletionMix[];
};
