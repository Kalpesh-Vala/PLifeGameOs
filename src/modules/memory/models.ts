import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A long-term memory the AI can retrieve. `embedding` is a vector produced by
 * the embeddings model; retrieval uses Atlas Vector Search when available and
 * falls back to importance/recency + text match otherwise.
 */
const memorySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ["fact", "event", "insight", "journal", "review", "preference"],
      default: "fact",
    },
    content: { type: String, required: true },
    importance: { type: Number, default: 3, min: 1, max: 5 },
    source: { type: String, default: "system" },
    sourceId: { type: String, default: null },
    embedding: { type: [Number], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

memorySchema.index({ userId: 1, createdAt: -1 });

export type MemoryDoc = InferSchemaType<typeof memorySchema>;

export const MemoryModel: Model<MemoryDoc> =
  (mongoose.models.Memory as Model<MemoryDoc>) ??
  mongoose.model<MemoryDoc>("Memory", memorySchema);

/** Atlas Vector Search index name expected on the `memories` collection. */
export const MEMORY_VECTOR_INDEX = "memory_vector_index";
