import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { ingestMemorySafe } from "@/modules/memory/service";
import {
  JournalEntryModel,
  type JournalEntryDoc,
} from "@/modules/journal/models";
import { JOURNAL_XP, type JournalEntryView } from "@/modules/journal/types";

function toView(entry: HydratedDocument<JournalEntryDoc>): JournalEntryView {
  return {
    id: String(entry._id),
    date: entry.date,
    title: entry.title ?? null,
    content: entry.content,
    mood: entry.mood ?? null,
    tags: entry.tags ?? [],
    createdAt: new Date(entry.createdAt as Date).toISOString(),
  };
}

export async function listJournal(
  userId: string,
  limit = 50,
): Promise<JournalEntryView[]> {
  await connectToDatabase();
  const entries = await JournalEntryModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return entries.map(toView);
}

export type CreateJournalInput = {
  title?: string | null;
  content: string;
  mood?: number | null;
  tags?: string[];
};

export type CreateJournalResult = {
  entry: JournalEntryView;
  award: AwardResult | null;
};

export async function createJournal(
  userId: string,
  input: CreateJournalInput,
): Promise<CreateJournalResult> {
  await connectToDatabase();
  const date = dateKey();

  const countToday = await JournalEntryModel.countDocuments({ userId, date });

  const entry = await JournalEntryModel.create({
    userId,
    date,
    title: input.title ?? null,
    content: input.content,
    mood: input.mood ?? null,
    tags: input.tags ?? [],
  });

  let award: AwardResult | null = null;
  if (countToday === 0) {
    award = await awardXp(userId, {
      amount: JOURNAL_XP,
      source: "journal",
      note: "Wrote a journal entry",
    });
  }

  // Feed the entry into long-term memory (best-effort, non-blocking on failure).
  await ingestMemorySafe(userId, {
    content: input.title
      ? `Journal — ${input.title}: ${input.content}`
      : `Journal: ${input.content}`,
    kind: "journal",
    importance: 3,
    source: "journal",
    sourceId: String(entry._id),
  });

  return { entry: toView(entry), award };
}

export async function updateJournal(
  userId: string,
  id: string,
  input: Partial<CreateJournalInput>,
): Promise<JournalEntryView | null> {
  await connectToDatabase();
  const entry = await JournalEntryModel.findOne({ _id: id, userId });
  if (!entry) return null;
  if (input.title !== undefined) entry.title = input.title;
  if (input.content !== undefined) entry.content = input.content;
  if (input.mood !== undefined) entry.mood = input.mood;
  if (input.tags !== undefined) entry.tags = input.tags;
  await entry.save();
  return toView(entry);
}

export async function deleteJournal(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await JournalEntryModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
