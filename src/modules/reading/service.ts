import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { BookModel, type BookDoc } from "@/modules/reading/models";
import { READING_XP, type BookStatus, type BookView } from "@/modules/reading/types";

function toView(doc: HydratedDocument<BookDoc>): BookView {
  return {
    id: String(doc._id),
    title: doc.title,
    author: doc.author ?? null,
    status: doc.status as BookStatus,
    totalPages: doc.totalPages ?? null,
    currentPage: doc.currentPage,
    rating: doc.rating ?? null,
    finishedAt: doc.finishedAt ? new Date(doc.finishedAt).toISOString() : null,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function listBooks(userId: string): Promise<BookView[]> {
  await connectToDatabase();
  const docs = await BookModel.find({ userId }).sort({ createdAt: -1 });
  return docs.map(toView);
}

export async function createBook(
  userId: string,
  input: {
    title: string;
    author?: string | null;
    totalPages?: number | null;
    status?: BookStatus;
  },
): Promise<BookView> {
  await connectToDatabase();
  const doc = await BookModel.create({
    userId,
    title: input.title,
    author: input.author ?? null,
    totalPages: input.totalPages ?? null,
    status: input.status ?? "want",
  });
  return toView(doc);
}

async function maybeFinish(
  doc: HydratedDocument<BookDoc>,
  userId: string,
): Promise<AwardResult | null> {
  if (doc.status === "finished" && !doc.xpAwarded) {
    doc.xpAwarded = true;
    doc.finishedAt = new Date();
    await doc.save();
    return awardXp(userId, {
      amount: READING_XP,
      source: "reading",
      skillId: "reading",
      note: `Finished reading: ${doc.title}`,
    });
  }
  await doc.save();
  return null;
}

export type BookMutationResult = { book: BookView; award: AwardResult | null };

export async function setStatus(
  userId: string,
  id: string,
  status: BookStatus,
): Promise<BookMutationResult | null> {
  await connectToDatabase();
  const doc = await BookModel.findOne({ _id: id, userId });
  if (!doc) return null;
  doc.status = status;
  if (status !== "finished") doc.finishedAt = null;
  const award = await maybeFinish(doc, userId);
  return { book: toView(doc), award };
}

export async function setProgress(
  userId: string,
  id: string,
  currentPage: number,
): Promise<BookMutationResult | null> {
  await connectToDatabase();
  const doc = await BookModel.findOne({ _id: id, userId });
  if (!doc) return null;

  doc.currentPage = Math.max(0, currentPage);
  if (doc.status === "want" && doc.currentPage > 0) doc.status = "reading";
  if (doc.totalPages && doc.currentPage >= doc.totalPages) {
    doc.status = "finished";
  }
  const award = await maybeFinish(doc, userId);
  return { book: toView(doc), award };
}

export async function rateBook(
  userId: string,
  id: string,
  rating: number,
): Promise<BookView | null> {
  await connectToDatabase();
  const doc = await BookModel.findOne({ _id: id, userId });
  if (!doc) return null;
  doc.rating = rating;
  await doc.save();
  return toView(doc);
}

export async function deleteBook(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await BookModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
