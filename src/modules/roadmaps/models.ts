import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A learning roadmap: an ordered checklist of steps. Each completed step grants
 * a small XP reward once (tracked via `rewarded`).
 */
const roadmapStepSchema = new Schema({
  title: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
  rewarded: { type: Boolean, default: false },
});

const roadmapSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    category: { type: String, default: "General" },
    steps: { type: [roadmapStepSchema], default: [] },
  },
  { timestamps: true },
);

roadmapSchema.index({ userId: 1, createdAt: -1 });

export type RoadmapDoc = InferSchemaType<typeof roadmapSchema>;

export const RoadmapModel: Model<RoadmapDoc> =
  (mongoose.models.Roadmap as Model<RoadmapDoc>) ??
  mongoose.model<RoadmapDoc>("Roadmap", roadmapSchema);
