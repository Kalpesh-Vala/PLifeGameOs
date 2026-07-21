import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A "boss battle" — a big goal broken into milestones. Defeating the boss
 * (completing every milestone) grants a large XP reward once.
 */
const milestoneSchema = new Schema({
  title: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
});

const bossBattleSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["active", "defeated"], default: "active" },
    milestones: { type: [milestoneSchema], default: [] },
    skillId: { type: String, default: null },
    deadline: { type: Date, default: null },
    defeatedAt: { type: Date, default: null },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bossBattleSchema.index({ userId: 1, status: 1, createdAt: -1 });

export type BossBattleDoc = InferSchemaType<typeof bossBattleSchema>;

export const BossBattleModel: Model<BossBattleDoc> =
  (mongoose.models.BossBattle as Model<BossBattleDoc>) ??
  mongoose.model<BossBattleDoc>("BossBattle", bossBattleSchema);
