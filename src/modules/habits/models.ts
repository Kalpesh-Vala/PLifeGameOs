import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A recurring habit with a strict, time-based schedule.
 * `entries` stores date keys of successful completions for the heatmap; rich
 * per-day outcomes (on-time/late/missed) live in HabitLog.
 */
const habitSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: null },
    skillId: { type: String, default: null },

    // Schedule
    scheduledTime: { type: String, default: null }, // "HH:mm" or null (anytime)
    gracePeriodMin: { type: Number, default: 30, min: 0, max: 720 },
    recurrence: { type: String, enum: ["daily", "weekly"], default: "daily" },
    weeklyDays: { type: [Number], default: [] }, // 0=Sun..6=Sat

    // Config
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    xpReward: { type: Number, default: 20, min: 0 },
    penaltyXp: { type: Number, default: 10, min: 0 },
    penaltyCoins: { type: Number, default: 1, min: 0 },

    // Streak state
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    entries: { type: [String], default: [] },
    lastRewardDate: { type: String, default: null },
  },
  { timestamps: true },
);

habitSchema.index({ userId: 1, createdAt: -1 });

/**
 * The outcome of a habit on a specific day. One document per habit per day.
 */
const habitLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    habitId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: {
      type: String,
      enum: ["on-time", "late", "missed"],
      required: true,
    },
    checkedInAt: { type: Date, default: null },
    xp: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
  },
  { timestamps: true },
);

habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: 1 });

export type HabitDoc = InferSchemaType<typeof habitSchema>;
export type HabitLogDoc = InferSchemaType<typeof habitLogSchema>;

export const HabitModel: Model<HabitDoc> =
  (mongoose.models.Habit as Model<HabitDoc>) ??
  mongoose.model<HabitDoc>("Habit", habitSchema);

export const HabitLogModel: Model<HabitLogDoc> =
  (mongoose.models.HabitLog as Model<HabitLogDoc>) ??
  mongoose.model<HabitLogDoc>("HabitLog", habitLogSchema);
