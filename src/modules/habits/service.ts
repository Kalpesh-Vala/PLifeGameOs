import { subDays } from "date-fns";
import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dispatch } from "@/server/events/bus";
import { dateKey } from "@/lib/date";
import { getSkill } from "@/modules/gamification/lib/skills";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { HabitModel, type HabitDoc } from "@/modules/habits/models";
import { computeStreaks } from "@/modules/habits/lib/streak";
import { HABIT_XP, type HabitView } from "@/modules/habits/types";

const HEATMAP_DAYS = 182;

function toView(habit: HydratedDocument<HabitDoc>): HabitView {
  const today = dateKey();
  const windowStart = dateKey(subDays(new Date(), HEATMAP_DAYS - 1));
  const skill = habit.skillId ? getSkill(habit.skillId) : undefined;

  return {
    id: String(habit._id),
    title: habit.title,
    notes: habit.notes ?? null,
    cadence: "daily",
    skillId: habit.skillId ?? null,
    skillName: skill?.name ?? null,
    xpReward: HABIT_XP,
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    completedToday: habit.entries.includes(today),
    recentEntries: habit.entries.filter((d) => d >= windowStart),
    totalCompletions: habit.entries.length,
    createdAt: new Date(habit.createdAt as Date).toISOString(),
  };
}

export type CreateHabitInput = {
  title: string;
  notes?: string;
  skillId?: string | null;
};

export async function listHabits(userId: string): Promise<HabitView[]> {
  await connectToDatabase();
  const habits = await HabitModel.find({ userId }).sort({ createdAt: -1 });
  return habits.map(toView);
}

export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<HabitView> {
  await connectToDatabase();
  const habit = await HabitModel.create({
    userId,
    title: input.title,
    notes: input.notes ?? null,
    skillId: input.skillId ?? null,
  });
  return toView(habit);
}

export async function updateHabit(
  userId: string,
  id: string,
  input: Partial<CreateHabitInput>,
): Promise<HabitView | null> {
  await connectToDatabase();
  const habit = await HabitModel.findOne({ _id: id, userId });
  if (!habit) return null;
  if (input.title !== undefined) habit.title = input.title;
  if (input.notes !== undefined) habit.notes = input.notes;
  if (input.skillId !== undefined) habit.skillId = input.skillId;
  await habit.save();
  return toView(habit);
}

export async function deleteHabit(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await HabitModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}

export type ToggleHabitResult = {
  habit: HabitView;
  award: AwardResult | null;
  completed: boolean;
};

/** Toggles today's completion. Awards XP at most once per calendar day. */
export async function toggleHabitToday(
  userId: string,
  id: string,
): Promise<ToggleHabitResult | null> {
  await connectToDatabase();
  const habit = await HabitModel.findOne({ _id: id, userId });
  if (!habit) return null;

  const today = dateKey();
  const doneToday = habit.entries.includes(today);

  let award: AwardResult | null = null;
  let completed: boolean;

  if (doneToday) {
    // Undo today's completion.
    habit.entries = habit.entries.filter((d) => d !== today);
    completed = false;
  } else {
    habit.entries.push(today);
    completed = true;
  }

  const streaks = computeStreaks(habit.entries, today);
  habit.currentStreak = streaks.current;
  habit.longestStreak = Math.max(habit.longestStreak, streaks.longest);

  const shouldReward = completed && habit.lastRewardDate !== today;
  if (shouldReward) habit.lastRewardDate = today;

  await habit.save();

  if (shouldReward) {
    award = await awardXp(userId, {
      amount: HABIT_XP,
      source: "habit",
      skillId: habit.skillId ?? undefined,
      note: `Habit: ${habit.title}`,
    });
    await dispatch("habit.completed", {
      userId,
      habitId: String(habit._id),
      skillId: habit.skillId ?? undefined,
      xp: HABIT_XP,
    });
  }

  return { habit: toView(habit), award, completed };
}
