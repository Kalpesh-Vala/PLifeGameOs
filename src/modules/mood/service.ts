import { subDays } from "date-fns";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { MoodEntryModel } from "@/modules/mood/models";
import {
  MOOD_XP,
  type MoodEntryView,
  type MoodTrendPoint,
} from "@/modules/mood/types";
import type { MoodLevel } from "@/modules/mood/lib/scale";

export async function getTodayMood(
  userId: string,
): Promise<MoodEntryView | null> {
  await connectToDatabase();
  const entry = await MoodEntryModel.findOne({ userId, date: dateKey() });
  if (!entry) return null;
  return {
    date: entry.date,
    mood: entry.mood as MoodLevel,
    energy: entry.energy ?? null,
    note: entry.note ?? null,
  };
}

export type LogMoodInput = {
  mood: MoodLevel;
  energy?: number | null;
  note?: string | null;
};

export type LogMoodResult = {
  entry: MoodEntryView;
  award: AwardResult | null;
};

export async function logMood(
  userId: string,
  input: LogMoodInput,
): Promise<LogMoodResult> {
  await connectToDatabase();
  const date = dateKey();
  const existing = await MoodEntryModel.findOne({ userId, date });

  let award: AwardResult | null = null;

  if (existing) {
    existing.mood = input.mood;
    existing.energy = input.energy ?? null;
    existing.note = input.note ?? null;
    await existing.save();
  } else {
    await MoodEntryModel.create({
      userId,
      date,
      mood: input.mood,
      energy: input.energy ?? null,
      note: input.note ?? null,
    });
    award = await awardXp(userId, {
      amount: MOOD_XP,
      source: "mood",
      note: "Logged today's mood",
    });
  }

  return {
    entry: {
      date,
      mood: input.mood,
      energy: input.energy ?? null,
      note: input.note ?? null,
    },
    award,
  };
}

export async function getMoodTrend(
  userId: string,
  days = 30,
): Promise<MoodTrendPoint[]> {
  await connectToDatabase();
  const start = dateKey(subDays(new Date(), days - 1));
  const entries = await MoodEntryModel.find({
    userId,
    date: { $gte: start },
  }).lean();

  const byDate = new Map(entries.map((e) => [e.date, e]));
  const points: MoodTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dateKey(subDays(new Date(), i));
    const entry = byDate.get(d);
    points.push({
      date: d,
      mood: entry?.mood ?? null,
      energy: entry?.energy ?? null,
    });
  }
  return points;
}
