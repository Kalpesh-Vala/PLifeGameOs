import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A solved coding problem (DSA practice, competitive programming, etc.).
 */
const codingProblemSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    platform: { type: String, default: "LeetCode" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    topic: { type: String, default: null },
    url: { type: String, default: null },
    note: { type: String, default: null },
    solvedOn: { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true },
);

codingProblemSchema.index({ userId: 1, createdAt: -1 });
codingProblemSchema.index({ userId: 1, solvedOn: 1 });

export type CodingProblemDoc = InferSchemaType<typeof codingProblemSchema>;

export const CodingProblemModel: Model<CodingProblemDoc> =
  (mongoose.models.CodingProblem as Model<CodingProblemDoc>) ??
  mongoose.model<CodingProblemDoc>("CodingProblem", codingProblemSchema);
