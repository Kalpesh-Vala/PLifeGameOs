import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A journal entry. Multiple entries per day are allowed. `date` is the local
 * day key (YYYY-MM-DD) the entry belongs to.
 */
const journalEntrySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    title: { type: String, default: null },
    content: { type: String, required: true },
    mood: { type: Number, default: null, min: 1, max: 5 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

journalEntrySchema.index({ userId: 1, createdAt: -1 });

export type JournalEntryDoc = InferSchemaType<typeof journalEntrySchema>;

export const JournalEntryModel: Model<JournalEntryDoc> =
  (mongoose.models.JournalEntry as Model<JournalEntryDoc>) ??
  mongoose.model<JournalEntryDoc>("JournalEntry", journalEntrySchema);
