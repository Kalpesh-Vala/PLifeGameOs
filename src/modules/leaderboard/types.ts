export type LeaderboardRecords = {
  totalXp: number;
  level: number;
  title: string;
  longestStreak: number;
  bestDayXp: number;
  achievements: number;
  activeDays: number;
};

export type WeeklyRank = {
  weekKey: string;
  label: string;
  xp: number;
  rank: number;
  isCurrent: boolean;
};

export type SkillRank = {
  rank: number;
  name: string;
  level: number;
  xp: number;
};

export type LeaderboardView = {
  records: LeaderboardRecords;
  weeklyRanking: WeeklyRank[];
  skillRanking: SkillRank[];
};
