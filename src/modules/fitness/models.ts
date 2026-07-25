import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Daily fitness metrics, one document per user per day.
 */
const fitnessDaySchema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    weightKg: { type: Number, default: null },
    waterMl: { type: Number, default: 0 },
    sleepHours: { type: Number, default: null },
    calories: { type: Number, default: null },
  },
  { timestamps: true },
);

fitnessDaySchema.index({ userId: 1, date: 1 }, { unique: true });

/**
 * A single workout, multiple per day allowed.
 */
const workoutSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    type: { type: String, required: true },
    durationMin: { type: Number, required: true, min: 1 },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

workoutSchema.index({ userId: 1, createdAt: -1 });

export type FitnessDayDoc = InferSchemaType<typeof fitnessDaySchema>;
export type WorkoutDoc = InferSchemaType<typeof workoutSchema>;

export const FitnessDayModel: Model<FitnessDayDoc> =
  (mongoose.models.FitnessDay as Model<FitnessDayDoc>) ??
  mongoose.model<FitnessDayDoc>("FitnessDay", fitnessDaySchema);

export const WorkoutModel: Model<WorkoutDoc> =
  (mongoose.models.Workout as Model<WorkoutDoc>) ??
  mongoose.model<WorkoutDoc>("Workout", workoutSchema);
