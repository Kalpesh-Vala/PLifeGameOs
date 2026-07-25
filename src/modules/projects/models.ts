import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A personal/side project tracked from idea to shipped.
 */
const projectSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ["idea", "building", "shipped", "paused"],
      default: "building",
    },
    techStack: { type: [String], default: [] },
    url: { type: String, default: null },
    repoUrl: { type: String, default: null },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

projectSchema.index({ userId: 1, createdAt: -1 });

export type ProjectDoc = InferSchemaType<typeof projectSchema>;

export const ProjectModel: Model<ProjectDoc> =
  (mongoose.models.Project as Model<ProjectDoc>) ??
  mongoose.model<ProjectDoc>("Project", projectSchema);
