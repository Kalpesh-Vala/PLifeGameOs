import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A vision-board item: an aspiration with an optional image and caption.
 */
const visionItemSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    caption: { type: String, default: null },
    category: { type: String, default: "Life" },
  },
  { timestamps: true },
);

visionItemSchema.index({ userId: 1, createdAt: -1 });

export type VisionItemDoc = InferSchemaType<typeof visionItemSchema>;

export const VisionItemModel: Model<VisionItemDoc> =
  (mongoose.models.VisionItem as Model<VisionItemDoc>) ??
  mongoose.model<VisionItemDoc>("VisionItem", visionItemSchema);
