import { subDays } from "date-fns";
import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dispatch } from "@/server/events/bus";
import { cachedForUser } from "@/server/cache";
import { dateKey, yesterdayKey } from "@/lib/date";
import { getSkill } from "@/modules/gamification/lib/skills";
import {
  adjustDiscipline,
  applyPenalty,
  awardXp,
  getProfileView,
} from "@/modules/gamification/service";
import { XpEventModel } from "@/modules/gamification/models";
import {
  HabitModel,
  HabitLogModel,
  type HabitDoc,
  type HabitLogDoc,
} from "@/modules/habits/models";
import {
  ALL_ON_TIME_XP,
  DISCIPLINE_DELTA,
  LATE_GRACE_XP_FACTOR,
  PRIORITY_BONUS,
  isScheduledOnDow,
  streakMultiplier,
  timeToMinutes,
  type Difficulty,
  type HabitStatus,
  type Priority,
  type Recurrence,
} from "@/modules/habits/lib/rules";
import type {
  CheckInHabitResult,
  HabitStatsView,
  HabitView,
  SettleResult,
} from "@/modules/habits/types";

const HEATMAP_DAYS = 182;

function minsOfDay(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

function minutesToTime(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function isScheduledToday(habit: HabitDoc, now: Date): boolean {
  return isScheduledOnDow(
    habit.recurrence as Recurrence,
    habit.weeklyDays ?? [],
    now.getDay(),
  );
}

function computeStatus(
  habit: HabitDoc,
  log: HabitLogDoc | null,
  now: Date,
): HabitStatus {
  if (log) return log.status as HabitStatus;
  if (!isScheduledToday(habit, now)) return "rest";
  const sched = timeToMinutes(habit.scheduledTime ?? null);
  if (sched === null) return "upcoming";
  const deadline = sched + habit.gracePeriodMin;
  return minsOfDay(now) <= deadline ? "upcoming" : "missed";
}

function toView(
  habit: HydratedDocument<HabitDoc>,
  log: HabitLogDoc | null,
  now: Date,
): HabitView {
  const skill = habit.skillId ? getSkill(habit.skillId) : undefined;
  const windowStart = dateKey(subDays(now, HEATMAP_DAYS - 1));
  const sched = timeToMinutes(habit.scheduledTime ?? null);
  const status = computeStatus(habit, log, now);

  return {
    id: String(habit._id),
    title: habit.title,
    notes: habit.notes ?? null,
    skillId: habit.skillId ?? null,
    skillName: skill?.name ?? null,
    scheduledTime: habit.scheduledTime ?? null,
    gracePeriodMin: habit.gracePeriodMin,
    recurrence: habit.recurrence as Recurrence,
    weeklyDays: habit.weeklyDays ?? [],
    difficulty: habit.difficulty as Difficulty,
    priority: habit.priority as Priority,
    xpReward: habit.xpReward,
    penaltyXp: habit.penaltyXp,
    penaltyCoins: habit.penaltyCoins,
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    status,
    scheduledToday: isScheduledToday(habit, now),
    completedToday: log
      ? log.status === "on-time" || log.status === "late"
      : false,
    deadlineTime:
      sched !== null ? minutesToTime(sched + habit.gracePeriodMin) : null,
    recentEntries: (habit.entries ?? []).filter((d) => d >= windowStart),
    totalCompletions: (habit.entries ?? []).length,
    createdAt: new Date(habit.createdAt as Date).toISOString(),
  };
}

export async function listHabits(userId: string): Promise<HabitView[]> {
  await connectToDatabase();
  const now = new Date();
  const today = dateKey(now);
  const habits = await HabitModel.find({ userId }).sort({ createdAt: -1 });
  const logs = await HabitLogModel.find({ userId, date: today }).lean();
  const logByHabit = new Map(logs.map((l) => [l.habitId, l as HabitLogDoc]));

  return habits.map((h) =>
    toView(h, logByHabit.get(String(h._id)) ?? null, now),
  );
}

export type HabitConfigInput = {
  title: string;
  notes?: string | null;
  skillId?: string | null;
  scheduledTime?: string | null;
  gracePeriodMin?: number;
  recurrence?: Recurrence;
  weeklyDays?: number[];
  difficulty?: Difficulty;
  priority?: Priority;
  xpReward?: number;
  penaltyXp?: number;
  penaltyCoins?: number;
};

export async function createHabit(
  userId: string,
  input: HabitConfigInput,
): Promise<HabitView> {
  await connectToDatabase();
  const habit = await HabitModel.create({
    userId,
    title: input.title,
    notes: input.notes ?? null,
    skillId: input.skillId ?? null,
    scheduledTime: input.scheduledTime ?? null,
    gracePeriodMin: input.gracePeriodMin ?? 30,
    recurrence: input.recurrence ?? "daily",
    weeklyDays: input.weeklyDays ?? [],
    difficulty: input.difficulty ?? "medium",
    priority: input.priority ?? "medium",
    xpReward: input.xpReward ?? 20,
    penaltyXp: input.penaltyXp ?? 10,
    penaltyCoins: input.penaltyCoins ?? 1,
  });
  return toView(habit, null, new Date());
}

export async function updateHabit(
  userId: string,
  id: string,
  input: Partial<HabitConfigInput>,
): Promise<HabitView | null> {
  await connectToDatabase();
  const habit = await HabitModel.findOne({ _id: id, userId });
  if (!habit) return null;

  const fields: (keyof HabitConfigInput)[] = [
    "title",
    "notes",
    "skillId",
    "scheduledTime",
    "gracePeriodMin",
    "recurrence",
    "weeklyDays",
    "difficulty",
    "priority",
    "xpReward",
    "penaltyXp",
    "penaltyCoins",
  ];
  for (const f of fields) {
    if (input[f] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (habit as any)[f] = input[f];
    }
  }
  await habit.save();

  const now = new Date();
  const log = await HabitLogModel.findOne({
    habitId: id,
    date: dateKey(now),
  }).lean();
  return toView(habit, (log as HabitLogDoc) ?? null, now);
}

export async function deleteHabit(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await HabitModel.deleteOne({ _id: id, userId });
  await HabitLogModel.deleteMany({ userId, habitId: id });
  return res.deletedCount > 0;
}

function outcomeStatus(
  habit: HabitDoc,
  now: Date,
): { status: "on-time" | "late"; withinGrace: boolean } {
  const sched = timeToMinutes(habit.scheduledTime ?? null);
  if (sched === null) return { status: "on-time", withinGrace: true };
  const mins = minsOfDay(now);
  if (mins <= sched) return { status: "on-time", withinGrace: true };
  if (mins <= sched + habit.gracePeriodMin)
    return { status: "late", withinGrace: true };
  return { status: "late", withinGrace: false };
}

export async function checkInHabit(
  userId: string,
  habitId: string,
): Promise<CheckInHabitResult | null> {
  await connectToDatabase();
  const now = new Date();
  const today = dateKey(now);

  const habit = await HabitModel.findOne({ _id: habitId, userId });
  if (!habit) return null;

  if (!isScheduledToday(habit, now)) {
    return {
      habit: toView(habit, null, now),
      status: "rest",
      xpAwarded: 0,
      penaltyApplied: 0,
      award: null,
      penalty: null,
      allOnTimeBonus: null,
      message: "This habit isn't scheduled today.",
    };
  }

  const existing = await HabitLogModel.findOne({ habitId, date: today });
  if (existing) {
    return {
      habit: toView(habit, existing, now),
      status: existing.status as HabitStatus,
      xpAwarded: existing.xp,
      penaltyApplied: existing.penalty,
      award: null,
      penalty: null,
      allOnTimeBonus: null,
      message: "Already recorded for today.",
    };
  }

  const { status, withinGrace } = outcomeStatus(habit, now);
  let xpAwarded = 0;
  let penaltyApplied = 0;
  let award: CheckInHabitResult["award"] = null;
  let penalty: CheckInHabitResult["penalty"] = null;
  let message = "";

  if (status === "on-time") {
    const mult = streakMultiplier(habit.currentStreak);
    xpAwarded =
      Math.round(habit.xpReward * mult) +
      PRIORITY_BONUS[habit.priority as Priority];

    const continued = (habit.entries ?? []).includes(yesterdayKey(now));
    habit.currentStreak = continued ? habit.currentStreak + 1 : 1;
    habit.longestStreak = Math.max(habit.longestStreak, habit.currentStreak);
    habit.entries.push(today);
    habit.lastRewardDate = today;
    await habit.save();

    award = await awardXp(userId, {
      amount: xpAwarded,
      source: "habit",
      skillId: habit.skillId ?? undefined,
      note: `On-time: ${habit.title}`,
    });
    await adjustDiscipline(userId, DISCIPLINE_DELTA.onTime);
    await dispatch("habit.completed", {
      userId,
      habitId,
      skillId: habit.skillId ?? undefined,
      xp: xpAwarded,
    });
    message = `On time! +${xpAwarded} XP${mult > 1 ? ` (×${mult})` : ""}`;
  } else if (withinGrace) {
    xpAwarded = Math.round(habit.xpReward * LATE_GRACE_XP_FACTOR);
    habit.entries.push(today);
    await habit.save();

    award = await awardXp(userId, {
      amount: xpAwarded,
      source: "habit",
      skillId: habit.skillId ?? undefined,
      note: `Late (partial): ${habit.title}`,
    });
    await adjustDiscipline(userId, DISCIPLINE_DELTA.lateGrace);
    await dispatch("habit.completed", {
      userId,
      habitId,
      skillId: habit.skillId ?? undefined,
      xp: xpAwarded,
    });
    message = `Late — partial credit (+${xpAwarded} XP).`;
  } else {
    penaltyApplied = habit.penaltyXp;
    habit.currentStreak = 0;
    await habit.save();

    penalty = await applyPenalty(userId, {
      xp: habit.penaltyXp,
      coins: habit.penaltyCoins,
      disciplineDelta: DISCIPLINE_DELTA.lateBeyond,
      source: "habit-late",
      note: `Late: ${habit.title}`,
    });
    message = `Too late — penalty applied (−${habit.penaltyXp} XP).`;
  }

  await HabitLogModel.create({
    userId,
    habitId,
    date: today,
    status,
    checkedInAt: now,
    xp: xpAwarded,
    penalty: penaltyApplied,
  });

  const allOnTimeBonus = await maybeAwardAllOnTime(userId, now);

  return {
    habit: toView(habit, null, now),
    status,
    xpAwarded,
    penaltyApplied,
    award,
    penalty,
    allOnTimeBonus,
    message,
  };
}

async function maybeAwardAllOnTime(
  userId: string,
  now: Date,
): Promise<CheckInHabitResult["allOnTimeBonus"]> {
  const today = dateKey(now);
  const habits = await HabitModel.find({ userId });
  const scheduled = habits.filter((h) => isScheduledToday(h, now));
  if (scheduled.length === 0) return null;

  const onTimeLogs = await HabitLogModel.countDocuments({
    userId,
    date: today,
    status: "on-time",
  });
  if (onTimeLogs < scheduled.length) return null;

  const already = await XpEventModel.exists({
    userId,
    source: "all-on-time",
    createdAt: { $gte: new Date(`${today}T00:00:00`) },
  });
  if (already) return null;

  const bonus = await awardXp(userId, {
    amount: ALL_ON_TIME_XP,
    source: "all-on-time",
    note: "Perfect day — all habits on time!",
  });
  await adjustDiscipline(userId, DISCIPLINE_DELTA.allOnTimeBonus);
  return bonus;
}

export async function settleHabits(userId: string): Promise<SettleResult> {
  await connectToDatabase();
  const now = new Date();
  const today = dateKey(now);
  const mins = minsOfDay(now);

  const habits = await HabitModel.find({ userId });
  let missed = 0;
  let penaltyXp = 0;
  let penaltyCoins = 0;

  for (const habit of habits) {
    if (!isScheduledToday(habit, now)) continue;
    const sched = timeToMinutes(habit.scheduledTime ?? null);
    if (sched === null) continue;
    if (mins <= sched + habit.gracePeriodMin) continue;

    const existing = await HabitLogModel.findOne({
      habitId: String(habit._id),
      date: today,
    });
    if (existing) continue;

    const xp = Math.round(habit.penaltyXp * 1.5);
    habit.currentStreak = 0;
    await habit.save();

    try {
      await HabitLogModel.create({
        userId,
        habitId: String(habit._id),
        date: today,
        status: "missed",
        checkedInAt: null,
        xp: 0,
        penalty: xp,
      });
    } catch {
      continue;
    }

    await applyPenalty(userId, {
      xp,
      coins: habit.penaltyCoins,
      disciplineDelta: DISCIPLINE_DELTA.missed,
      source: "habit-missed",
      note: `Missed: ${habit.title}`,
    });

    missed += 1;
    penaltyXp += xp;
    penaltyCoins += habit.penaltyCoins;
  }

  return { missed, penaltyXp, penaltyCoins };
}

export function getHabitStats(userId: string): Promise<HabitStatsView> {
  return cachedForUser(userId, "habits:stats", 8_000, () =>
    computeHabitStats(userId),
  );
}

async function computeHabitStats(
  userId: string,
): Promise<HabitStatsView> {
  await connectToDatabase();
  const now = new Date();
  const today = dateKey(now);
  const weekStart = dateKey(subDays(now, 6));

  const [profile, habits, todayLogs, weekLogs, anyLog] = await Promise.all([
    getProfileView(userId),
    HabitModel.find({ userId }),
    HabitLogModel.find({ userId, date: today }).lean(),
    HabitLogModel.find({ userId, date: { $gte: weekStart } }).lean(),
    HabitLogModel.exists({ userId }),
  ]);

  const logByHabit = new Map(todayLogs.map((l) => [l.habitId, l]));
  let onTime = 0;
  let late = 0;
  let missed = 0;
  let upcoming = 0;
  let scheduledToday = 0;

  for (const habit of habits) {
    if (!isScheduledToday(habit, now)) continue;
    scheduledToday += 1;
    const status = computeStatus(
      habit,
      (logByHabit.get(String(habit._id)) as HabitLogDoc) ?? null,
      now,
    );
    if (status === "on-time") onTime += 1;
    else if (status === "late") late += 1;
    else if (status === "missed") missed += 1;
    else if (status === "upcoming") upcoming += 1;
  }

  const dailyScore = todayLogs.reduce((s, l) => s + l.xp - l.penalty, 0);
  const weeklyScore = weekLogs.reduce((s, l) => s + l.xp - l.penalty, 0);

  return {
    disciplineScore: profile.disciplineScore,
    disciplineTracked: !!anyLog,
    dailyScore,
    weeklyScore,
    onTime,
    late,
    missed,
    upcoming,
    scheduledToday,
  };
}
