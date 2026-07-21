import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const chatMessageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

chatMessageSchema.index({ userId: 1, createdAt: 1 });

export type ChatMessageDoc = InferSchemaType<typeof chatMessageSchema>;

export const ChatMessageModel: Model<ChatMessageDoc> =
  (mongoose.models.ChatMessage as Model<ChatMessageDoc>) ??
  mongoose.model<ChatMessageDoc>("ChatMessage", chatMessageSchema);

/**
 * A generated weekly/monthly review. `periodKey` makes each period's review
 * unique so re-generating replaces rather than duplicates.
 */
const reviewSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    period: { type: String, enum: ["weekly", "monthly"], required: true },
    periodKey: { type: String, required: true },
    summary: { type: String, required: true },
    wins: { type: [String], default: [] },
    challenges: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    productivityScore: { type: Number, default: 0 },
    stats: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

reviewSchema.index({ userId: 1, period: 1, periodKey: 1 }, { unique: true });

export type ReviewDoc = InferSchemaType<typeof reviewSchema>;

export const ReviewModel: Model<ReviewDoc> =
  (mongoose.models.Review as Model<ReviewDoc>) ??
  mongoose.model<ReviewDoc>("Review", reviewSchema);
