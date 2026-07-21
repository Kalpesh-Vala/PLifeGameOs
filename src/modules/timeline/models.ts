import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A logged event in the user's day. `time` is a local HH:mm string; `date` is
 * the day key (YYYY-MM-DD) it belongs to.
 */
const timelineEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    time: { type: String, required: true }, // HH:mm
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "other" },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

timelineEventSchema.index({ userId: 1, date: 1, time: 1 });

export type TimelineEventDoc = InferSchemaType<typeof timelineEventSchema>;

export const TimelineEventModel: Model<TimelineEventDoc> =
  (mongoose.models.TimelineEvent as Model<TimelineEventDoc>) ??
  mongoose.model<TimelineEventDoc>("TimelineEvent", timelineEventSchema);
