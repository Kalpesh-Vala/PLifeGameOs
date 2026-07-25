import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { ingestMemorySafe } from "@/modules/memory/service";
import {
  KnowledgeEntryModel,
  type KnowledgeEntryDoc,
} from "@/modules/knowledge/models";
import {
  KNOWLEDGE_XP,
  type KnowledgeEntryView,
} from "@/modules/knowledge/types";

function toView(
  doc: HydratedDocument<KnowledgeEntryDoc>,
): KnowledgeEntryView {
  return {
    id: String(doc._id),
    title: doc.title,
    content: doc.content,
    category: doc.category ?? "General",
    tags: doc.tags ?? [],
    createdAt: new Date(doc.createdAt as Date).toISOString(),
    updatedAt: new Date(doc.updatedAt as Date).toISOString(),
  };
}

export async function listEntries(
  userId: string,
): Promise<KnowledgeEntryView[]> {
  await connectToDatabase();
  const docs = await KnowledgeEntryModel.find({ userId })
    .sort({ category: 1, updatedAt: -1 })
    .limit(500);
  return docs.map(toView);
}

export type CreateEntryInput = {
  title: string;
  content: string;
  category: string;
  tags?: string[];
};

export type CreateEntryResult = {
  entry: KnowledgeEntryView;
  award: AwardResult | null;
};

export async function createEntry(
  userId: string,
  input: CreateEntryInput,
): Promise<CreateEntryResult> {
  await connectToDatabase();

  const startOfDay = new Date(`${dateKey()}T00:00:00`);
  const countToday = await KnowledgeEntryModel.countDocuments({
    userId,
    createdAt: { $gte: startOfDay },
  });

  const doc = await KnowledgeEntryModel.create({
    userId,
    title: input.title,
    content: input.content,
    category: input.category || "General",
    tags: input.tags ?? [],
  });

  let award: AwardResult | null = null;
  if (countToday === 0) {
    award = await awardXp(userId, {
      amount: KNOWLEDGE_XP,
      source: "knowledge",
      skillId: "reading",
      note: "Added to knowledge base",
    });
  }

  await ingestMemorySafe(userId, {
    content: `Knowledge (${input.category}) — ${input.title}: ${input.content}`,
    kind: "insight",
    importance: 3,
    source: "knowledge",
    sourceId: String(doc._id),
  });

  return { entry: toView(doc), award };
}

export async function updateEntry(
  userId: string,
  id: string,
  input: Partial<CreateEntryInput>,
): Promise<KnowledgeEntryView | null> {
  await connectToDatabase();
  const doc = await KnowledgeEntryModel.findOne({ _id: id, userId });
  if (!doc) return null;
  if (input.title !== undefined) doc.title = input.title;
  if (input.content !== undefined) doc.content = input.content;
  if (input.category !== undefined) doc.category = input.category || "General";
  if (input.tags !== undefined) doc.tags = input.tags;
  await doc.save();
  return toView(doc);
}

export async function deleteEntry(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await KnowledgeEntryModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
