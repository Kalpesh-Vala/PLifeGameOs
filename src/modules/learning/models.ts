import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A course or learning resource tracked by percentage progress.
 */
const learningItemSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    provider: { type: String, default: null },
    url: { type: String, default: null },
    status: {
      type: String,
      enum: ["planned", "in-progress", "completed"],
      default: "planned",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

learningItemSchema.index({ userId: 1, createdAt: -1 });

export type LearningItemDoc = InferSchemaType<typeof learningItemSchema>;

export const LearningItemModel: Model<LearningItemDoc> =
  (mongoose.models.LearningItem as Model<LearningItemDoc>) ??
  mongoose.model<LearningItemDoc>("LearningItem", learningItemSchema);
