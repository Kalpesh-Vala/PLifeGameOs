import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * An interview prep topic tracked from "to learn" to "confident".
 */
const interviewTopicSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "DSA" },
    status: {
      type: String,
      enum: ["todo", "learning", "confident"],
      default: "todo",
    },
    note: { type: String, default: null },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

interviewTopicSchema.index({ userId: 1, createdAt: -1 });

export type InterviewTopicDoc = InferSchemaType<typeof interviewTopicSchema>;

export const InterviewTopicModel: Model<InterviewTopicDoc> =
  (mongoose.models.InterviewTopic as Model<InterviewTopicDoc>) ??
  mongoose.model<InterviewTopicDoc>("InterviewTopic", interviewTopicSchema);
