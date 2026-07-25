import { format, startOfWeek, subWeeks } from "date-fns";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { getProfileView } from "@/modules/gamification/service";
import { XpEventModel } from "@/modules/gamification/models";
import type { LeaderboardView, WeeklyRank } from "@/modules/leaderboard/types";

const WEEKS = 8;

function weekKeyOf(date: Date): string {
  return format(date, "RRRR-'W'II");
}

export async function getLeaderboard(
  userId: string,
): Promise<LeaderboardView> {
  await connectToDatabase();

  const profile = await getProfileView(userId);
  const since = startOfWeek(subWeeks(new Date(), WEEKS - 1), {
    weekStartsOn: 1,
  });
  const events = await XpEventModel.find({
    userId,
    createdAt: { $gte: since },
  }).lean();

  // Aggregate XP per week and per day.
  const weekXp = new Map<string, number>();
  const dayXp = new Map<string, number>();
  for (const e of events) {
    const d = new Date(e.createdAt as Date);
    weekXp.set(weekKeyOf(d), (weekXp.get(weekKeyOf(d)) ?? 0) + e.amount);
    const dk = dateKey(d);
    dayXp.set(dk, (dayXp.get(dk) ?? 0) + e.amount);
  }

  const currentWeekKey = weekKeyOf(new Date());
  const weeks: { weekKey: string; label: string; xp: number; isCurrent: boolean }[] =
    [];
  for (let i = 0; i < WEEKS; i++) {
    const start = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const key = weekKeyOf(start);
    weeks.push({
      weekKey: key,
      label: format(start, "MMM d"),
      xp: weekXp.get(key) ?? 0,
      isCurrent: key === currentWeekKey,
    });
  }

  const weeklyRanking: WeeklyRank[] = [...weeks]
    .sort((a, b) => b.xp - a.xp)
    .map((w, i) => ({ ...w, rank: i + 1 }));

  const bestDayXp = Math.max(0, ...dayXp.values());

  // Skill ranking.
  const skillRanking = [...profile.skills]
    .sort((a, b) => b.xp - a.xp)
    .map((s, i) => ({
      rank: i + 1,
      name: s.name,
      level: s.level,
      xp: s.xp,
    }));

  return {
    records: {
      totalXp: profile.totalXp,
      level: profile.level,
      title: profile.title,
      longestStreak: profile.longestStreak,
      bestDayXp,
      achievements: profile.achievementsUnlocked,
      activeDays: dayXp.size,
    },
    weeklyRanking,
    skillRanking,
  };
}
