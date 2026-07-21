import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A recurring habit. `entries` stores completion date keys (YYYY-MM-DD).
 * `lastRewardDate` guards against earning XP twice for the same day.
 */
const habitSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: null },
    cadence: { type: String, enum: ["daily"], default: "daily" },
    skillId: { type: String, default: null },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    entries: { type: [String], default: [] },
    lastRewardDate: { type: String, default: null },
  },
  { timestamps: true },
);

habitSchema.index({ userId: 1, createdAt: -1 });

export type HabitDoc = InferSchemaType<typeof habitSchema>;

export const HabitModel: Model<HabitDoc> =
  (mongoose.models.Habit as Model<HabitDoc>) ??
  mongoose.model<HabitDoc>("Habit", habitSchema);
