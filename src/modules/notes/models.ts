import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A freeform note. Pinned notes surface first.
 */
const noteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: null },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

noteSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });

export type NoteDoc = InferSchemaType<typeof noteSchema>;

export const NoteModel: Model<NoteDoc> =
  (mongoose.models.Note as Model<NoteDoc>) ??
  mongoose.model<NoteDoc>("Note", noteSchema);
