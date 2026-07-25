import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import {
  FitnessDayModel,
  WorkoutModel,
  type FitnessDayDoc,
  type WorkoutDoc,
} from "@/modules/fitness/models";
import {
  WORKOUT_XP,
  WATER_STEP_ML,
  type FitnessDayView,
  type FitnessToday,
  type WeightPoint,
  type WorkoutView,
} from "@/modules/fitness/types";

function dayView(
  date: string,
  doc: HydratedDocument<FitnessDayDoc> | null,
): FitnessDayView {
  return {
    date,
    weightKg: doc?.weightKg ?? null,
    waterMl: doc?.waterMl ?? 0,
    sleepHours: doc?.sleepHours ?? null,
    calories: doc?.calories ?? null,
  };
}

function workoutView(doc: HydratedDocument<WorkoutDoc>): WorkoutView {
  return {
    id: String(doc._id),
    date: doc.date,
    type: doc.type,
    durationMin: doc.durationMin,
    note: doc.note ?? null,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function getFitnessToday(userId: string): Promise<FitnessToday> {
  await connectToDatabase();
  const date = dateKey();
  const [day, workouts] = await Promise.all([
    FitnessDayModel.findOne({ userId, date }),
    WorkoutModel.find({ userId, date }).sort({ createdAt: -1 }),
  ]);
  return { day: dayView(date, day), workouts: workouts.map(workoutView) };
}

export type UpsertMetricsInput = {
  weightKg?: number | null;
  sleepHours?: number | null;
  calories?: number | null;
};

export async function upsertMetrics(
  userId: string,
  input: UpsertMetricsInput,
): Promise<FitnessDayView> {
  await connectToDatabase();
  const date = dateKey();
  const set: Record<string, unknown> = {};
  if (input.weightKg !== undefined) set.weightKg = input.weightKg;
  if (input.sleepHours !== undefined) set.sleepHours = input.sleepHours;
  if (input.calories !== undefined) set.calories = input.calories;

  const doc = await FitnessDayModel.findOneAndUpdate(
    { userId, date },
    { $set: set, $setOnInsert: { userId, date } },
    { upsert: true, new: true },
  );
  return dayView(date, doc);
}

export async function addWater(
  userId: string,
  deltaMl: number = WATER_STEP_ML,
): Promise<FitnessDayView> {
  await connectToDatabase();
  const date = dateKey();
  const doc = await FitnessDayModel.findOneAndUpdate(
    { userId, date },
    { $inc: { waterMl: deltaMl }, $setOnInsert: { userId, date } },
    { upsert: true, new: true },
  );
  if (doc.waterMl < 0) {
    doc.waterMl = 0;
    await doc.save();
  }
  return dayView(date, doc);
}

export type AddWorkoutInput = {
  type: string;
  durationMin: number;
  note?: string | null;
};

export type AddWorkoutResult = { workout: WorkoutView; award: AwardResult };

export async function addWorkout(
  userId: string,
  input: AddWorkoutInput,
): Promise<AddWorkoutResult> {
  await connectToDatabase();
  const date = dateKey();
  const doc = await WorkoutModel.create({
    userId,
    date,
    type: input.type,
    durationMin: input.durationMin,
    note: input.note ?? null,
  });

  const award = await awardXp(userId, {
    amount: WORKOUT_XP,
    source: "fitness",
    skillId: "fitness",
    note: `Workout: ${input.type} (${input.durationMin}m)`,
  });

  return { workout: workoutView(doc), award };
}

export async function deleteWorkout(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await WorkoutModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}

export async function getWeightTrend(
  userId: string,
  limit = 60,
): Promise<WeightPoint[]> {
  await connectToDatabase();
  const days = await FitnessDayModel.find({
    userId,
    weightKg: { $ne: null },
  })
    .sort({ date: 1 })
    .limit(limit)
    .lean();
  return days
    .filter((d) => d.weightKg != null)
    .map((d) => ({ date: d.date, weightKg: d.weightKg as number }));
}

export async function getRecentWorkouts(
  userId: string,
  limit = 15,
): Promise<WorkoutView[]> {
  await connectToDatabase();
  const docs = await WorkoutModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return docs.map(workoutView);
}
