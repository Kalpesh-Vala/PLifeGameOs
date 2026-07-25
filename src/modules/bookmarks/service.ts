import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { BookmarkModel, type BookmarkDoc } from "@/modules/bookmarks/models";
import type { BookmarkView } from "@/modules/bookmarks/types";

function toView(doc: HydratedDocument<BookmarkDoc>): BookmarkView {
  return {
    id: String(doc._id),
    title: doc.title,
    url: doc.url,
    description: doc.description ?? null,
    category: doc.category ?? "General",
    tags: doc.tags ?? [],
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function listBookmarks(
  userId: string,
): Promise<BookmarkView[]> {
  await connectToDatabase();
  const docs = await BookmarkModel.find({ userId })
    .sort({ category: 1, createdAt: -1 })
    .limit(1000);
  return docs.map(toView);
}

export type CreateBookmarkInput = {
  title: string;
  url: string;
  description?: string | null;
  category: string;
  tags?: string[];
};

export async function createBookmark(
  userId: string,
  input: CreateBookmarkInput,
): Promise<BookmarkView> {
  await connectToDatabase();
  const doc = await BookmarkModel.create({
    userId,
    title: input.title,
    url: input.url,
    description: input.description ?? null,
    category: input.category || "General",
    tags: input.tags ?? [],
  });
  return toView(doc);
}

export async function deleteBookmark(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await BookmarkModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
