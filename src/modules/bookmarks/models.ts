import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A saved link, organized by category and tags.
 */
const bookmarkSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    description: { type: String, default: null },
    category: { type: String, default: "General", trim: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

bookmarkSchema.index({ userId: 1, category: 1, createdAt: -1 });

export type BookmarkDoc = InferSchemaType<typeof bookmarkSchema>;

export const BookmarkModel: Model<BookmarkDoc> =
  (mongoose.models.Bookmark as Model<BookmarkDoc>) ??
  mongoose.model<BookmarkDoc>("Bookmark", bookmarkSchema);
