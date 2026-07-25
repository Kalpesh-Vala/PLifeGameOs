import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A book on the reading shelf.
 */
const bookSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, default: null },
    status: {
      type: String,
      enum: ["want", "reading", "finished"],
      default: "want",
    },
    totalPages: { type: Number, default: null },
    currentPage: { type: Number, default: 0 },
    rating: { type: Number, default: null, min: 1, max: 5 },
    finishedAt: { type: Date, default: null },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bookSchema.index({ userId: 1, status: 1, createdAt: -1 });

export type BookDoc = InferSchemaType<typeof bookSchema>;

export const BookModel: Model<BookDoc> =
  (mongoose.models.Book as Model<BookDoc>) ??
  mongoose.model<BookDoc>("Book", bookSchema);
