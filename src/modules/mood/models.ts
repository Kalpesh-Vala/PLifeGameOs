import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * One mood log per user per day (unique on userId+date). Re-logging updates
 * the same document.
 */
const moodEntrySchema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    mood: { type: Number, required: true, min: 1, max: 5 },
    energy: { type: Number, default: null, min: 1, max: 5 },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

moodEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export type MoodEntryDoc = InferSchemaType<typeof moodEntrySchema>;

export const MoodEntryModel: Model<MoodEntryDoc> =
  (mongoose.models.MoodEntry as Model<MoodEntryDoc>) ??
  mongoose.model<MoodEntryDoc>("MoodEntry", moodEntrySchema);
