import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A task the user wants to complete. Completing it grants XP once (tracked via
 * `xpAwarded` to prevent re-completion farming).
 */
const taskSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: null },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "done"],
      default: "todo",
    },
    dueDate: { type: Date, default: null },
    skillId: { type: String, default: null },
    completedAt: { type: Date, default: null },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

taskSchema.index({ userId: 1, status: 1, createdAt: -1 });

export type TaskDoc = InferSchemaType<typeof taskSchema>;

export const TaskModel: Model<TaskDoc> =
  (mongoose.models.Task as Model<TaskDoc>) ??
  mongoose.model<TaskDoc>("Task", taskSchema);
