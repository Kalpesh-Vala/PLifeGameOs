import { subDays, differenceInCalendarDays } from "date-fns";
import { connectToDatabase } from "@/server/db/mongoose";
import { cachedForUser } from "@/server/cache";
import { dateKey } from "@/lib/date";
import { getProfileView } from "@/modules/gamification/service";
import { XpEventModel } from "@/modules/gamification/models";
import { SKILLS } from "@/modules/gamification/lib/skills";
import { HabitModel, HabitLogModel } from "@/modules/habits/models";
import { MoodEntryModel } from "@/modules/mood/models";
import { JournalEntryModel } from "@/modules/journal/models";
import type {
  AnalyticsOverview,
  SourceBreakdown,
} from "@/modules/analytics/types";

const HEATMAP_DAYS = 182;
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SOURCE_LABELS: Record<string, string> = {
  task: "Tasks",
  habit: "Habits",
  "check-in": "Check-ins",
  quest: "Quests",
  mission: "Missions",
  journal: "Journal",
  mood: "Mood",
  timeline: "Timeline",
  boss: "Boss Battles",
  review: "Reviews",
  manual: "Manual",
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function getAnalyticsOverview(
  userId: string,
): Promise<AnalyticsOverview> {
  return cachedForUser(userId, "analytics:overview", 20_000, () =>
    computeAnalyticsOverview(userId),
  );
}

async function computeAnalyticsOverview(
  userId: string,
): Promise<AnalyticsOverview> {
  await connectToDatabase();

  const start180 = subDays(new Date(), HEATMAP_DAYS - 1);
  const start30Key = dateKey(subDays(new Date(), 29));
  const start14Key = dateKey(subDays(new Date(), 13));
  const start7 = subDays(new Date(), 6);

  const [profile, events, habits, moods, journalCount, habitLogs] =
    await Promise.all([
      getProfileView(userId),
      XpEventModel.find({ userId, createdAt: { $gte: start180 } }).lean(),
      HabitModel.find({ userId }).lean(),
      MoodEntryModel.find({ userId, date: { $gte: start30Key } }).lean(),
      JournalEntryModel.countDocuments({
        userId,
        createdAt: { $gte: subDays(new Date(), 30) },
      }),
      HabitLogModel.find({ userId, date: { $gte: start14Key } }).lean(),
    ]);

  // XP heatmap (per-day totals) + active days.
  const xpHeatmap: Record<string, number> = {};
  const start30 = subDays(new Date(), 30);
  const start30ms = start30.getTime();
  const start7ms = start7.getTime();

  const src30 = new Map<string, { xp: number; count: number }>();
  const activeDaySet = new Set<string>();
  const dowXp = [0, 0, 0, 0, 0, 0, 0];
  let xp30 = 0;
  const count7: Record<string, number> = {};

  for (const e of events) {
    const created = new Date(e.createdAt as Date);
    const key = dateKey(created);
    xpHeatmap[key] = (xpHeatmap[key] ?? 0) + e.amount;

    const t = created.getTime();
    if (t >= start30ms) {
      xp30 += e.amount;
      activeDaySet.add(key);
      if (e.amount > 0) dowXp[created.getDay()] += e.amount;
      const cur = src30.get(e.source) ?? { xp: 0, count: 0 };
      cur.xp += e.amount;
      cur.count += 1;
      src30.set(e.source, cur);
    }
    if (t >= start7ms) count7[e.source] = (count7[e.source] ?? 0) + 1;
  }

  const xpBySource: SourceBreakdown[] = [...src30.entries()]
    .map(([source, v]) => ({
      source,
      label: SOURCE_LABELS[source] ?? source,
      xp: v.xp,
      count: v.count,
    }))
    .sort((a, b) => b.xp - a.xp);

  // Productivity score (last 7 days composite).
  const habitCount = habits.length;
  const habits7 = count7["habit"] ?? 0;
  const habitRate =
    habitCount > 0
      ? Math.min(1, habits7 / (habitCount * 7))
      : Math.min(1, habits7 / 7);
  const productivityScore = clamp(
    Math.round(
      30 * Math.min(1, (count7["check-in"] ?? 0) / 7) +
        25 * habitRate +
        30 * Math.min(1, (count7["task"] ?? 0) / 14) +
        15 * Math.min(1, (count7["journal"] ?? 0) / 7),
    ),
  );

  // Habit consistency (last 30 days).
  let habitConsistency = 0;
  if (habitCount > 0) {
    const rates = habits.map((h) => {
      const created = new Date(h.createdAt as Date);
      const window = Math.max(
        1,
        Math.min(30, differenceInCalendarDays(new Date(), created) + 1),
      );
      const recent = (h.entries ?? []).filter((d) => d >= start30Key).length;
      return Math.min(1, recent / window);
    });
    habitConsistency = Math.round(
      (rates.reduce((s, r) => s + r, 0) / rates.length) * 100,
    );
  }

  // Life balance: XP grouped by skill category, plus "General".
  const catXp: Record<string, number> = {};
  let skillXpTotal = 0;
  for (const s of profile.skills) {
    const def = SKILLS.find((d) => d.id === s.id);
    if (!def) continue;
    catXp[def.category] = (catXp[def.category] ?? 0) + s.xp;
    skillXpTotal += s.xp;
  }
  const general = Math.max(0, profile.totalXp - skillXpTotal);
  const lifeBalance = [
    ...Object.entries(catXp).map(([category, xp]) => ({ category, xp })),
    { category: "General", xp: general },
  ].filter((b) => b.xp > 0);

  // Mood trend (last 30 days).
  const moodByDate = new Map(moods.map((m) => [m.date, m]));
  const moodTrend = Array.from({ length: 30 }, (_, i) => {
    const d = dateKey(subDays(new Date(), 29 - i));
    const entry = moodByDate.get(d);
    return {
      date: d,
      mood: entry?.mood ?? null,
      energy: entry?.energy ?? null,
    };
  });

  // XP trend (last 30 days, derived from heatmap).
  const xpTrend = Array.from({ length: 30 }, (_, i) => {
    const d = dateKey(subDays(new Date(), 29 - i));
    return { date: d, xp: xpHeatmap[d] ?? 0 };
  });

  // Day-of-week activity (last 30 days).
  const dowActivity = DOW_LABELS.map((day, i) => ({ day, xp: dowXp[i] }));

  // Habit outcomes (last 14 days, stacked on-time/late/missed).
  const outcomeByDate = new Map<
    string,
    { onTime: number; late: number; missed: number }
  >();
  for (const log of habitLogs) {
    const o = outcomeByDate.get(log.date) ?? {
      onTime: 0,
      late: 0,
      missed: 0,
    };
    if (log.status === "on-time") o.onTime += 1;
    else if (log.status === "late") o.late += 1;
    else if (log.status === "missed") o.missed += 1;
    outcomeByDate.set(log.date, o);
  }
  const habitOutcomes = Array.from({ length: 14 }, (_, i) => {
    const d = dateKey(subDays(new Date(), 13 - i));
    const o = outcomeByDate.get(d) ?? { onTime: 0, late: 0, missed: 0 };
    return { date: d, ...o };
  });

  // Completion mix (last 30 days, by activity type).
  const completionMix = [
    { type: "Tasks", count: src30.get("task")?.count ?? 0 },
    { type: "Habits", count: src30.get("habit")?.count ?? 0 },
    {
      type: "Quests",
      count:
        (src30.get("quest")?.count ?? 0) + (src30.get("mission")?.count ?? 0),
    },
    { type: "Check-ins", count: src30.get("check-in")?.count ?? 0 },
    { type: "Journal", count: src30.get("journal")?.count ?? 0 },
    { type: "Workouts", count: src30.get("fitness")?.count ?? 0 },
    { type: "Coding", count: src30.get("coding")?.count ?? 0 },
  ].filter((c) => c.count > 0);

  return {
    level: profile.level,
    title: profile.title,
    totalXp: profile.totalXp,
    disciplineScore: profile.disciplineScore,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    productivityScore,
    habitConsistency,
    period: {
      days: 30,
      xpEarned: xp30,
      tasksCompleted: src30.get("task")?.count ?? 0,
      habitsCompleted: src30.get("habit")?.count ?? 0,
      checkIns: src30.get("check-in")?.count ?? 0,
      journalEntries: journalCount,
      questsClaimed:
        (src30.get("quest")?.count ?? 0) + (src30.get("mission")?.count ?? 0),
      activeDays: activeDaySet.size,
    },
    xpBySource,
    lifeBalance,
    skills: [...profile.skills]
      .sort((a, b) => b.xp - a.xp)
      .map((s) => ({
        name: s.name,
        level: s.level,
        xp: s.xp,
        progressPct: s.progressPct,
      })),
    xpHeatmap,
    moodTrend,
    xpTrend,
    dowActivity,
    habitOutcomes,
    completionMix,
  };
}
