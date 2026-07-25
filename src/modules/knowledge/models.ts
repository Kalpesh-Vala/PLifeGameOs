import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A curated knowledge-base entry — a concept the user has learned, organized
 * by category. Distinct from freeform notes: this is reference knowledge.
 */
const knowledgeEntrySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, default: "General", trim: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

knowledgeEntrySchema.index({ userId: 1, category: 1, updatedAt: -1 });

export type KnowledgeEntryDoc = InferSchemaType<typeof knowledgeEntrySchema>;

export const KnowledgeEntryModel: Model<KnowledgeEntryDoc> =
  (mongoose.models.KnowledgeEntry as Model<KnowledgeEntryDoc>) ??
  mongoose.model<KnowledgeEntryDoc>("KnowledgeEntry", knowledgeEntrySchema);
