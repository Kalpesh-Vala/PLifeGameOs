import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import {
  encryptField,
  encryptNullable,
  decryptField,
  decryptNullable,
} from "@/server/security/crypto";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { ingestMemorySafe } from "@/modules/memory/service";
import { NoteModel, type NoteDoc } from "@/modules/notes/models";
import { NOTE_XP, type NoteView } from "@/modules/notes/types";

function toView(doc: HydratedDocument<NoteDoc>): NoteView {
  return {
    id: String(doc._id),
    title: decryptNullable(doc.title ?? null),
    content: decryptField(doc.content),
    tags: doc.tags ?? [],
    pinned: doc.pinned,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
    updatedAt: new Date(doc.updatedAt as Date).toISOString(),
  };
}

export async function listNotes(userId: string): Promise<NoteView[]> {
  await connectToDatabase();
  const docs = await NoteModel.find({ userId })
    .sort({ pinned: -1, updatedAt: -1 })
    .limit(300);
  return docs.map(toView);
}

export type CreateNoteInput = {
  title?: string | null;
  content: string;
  tags?: string[];
};

export type CreateNoteResult = { note: NoteView; award: AwardResult | null };

export async function createNote(
  userId: string,
  input: CreateNoteInput,
): Promise<CreateNoteResult> {
  await connectToDatabase();

  const startOfDay = new Date(`${dateKey()}T00:00:00`);
  const countToday = await NoteModel.countDocuments({
    userId,
    createdAt: { $gte: startOfDay },
  });

  const doc = await NoteModel.create({
    userId,
    title: encryptNullable(input.title ?? null),
    content: encryptField(input.content),
    tags: input.tags ?? [],
  });

  let award: AwardResult | null = null;
  if (countToday === 0) {
    award = await awardXp(userId, {
      amount: NOTE_XP,
      source: "note",
      skillId: "writing",
      note: "Captured a note",
    });
  }

  await ingestMemorySafe(userId, {
    content: input.title
      ? `Note — ${input.title}: ${input.content}`
      : `Note: ${input.content}`,
    kind: "fact",
    importance: 2,
    source: "note",
    sourceId: String(doc._id),
  });

  return { note: toView(doc), award };
}

export async function updateNote(
  userId: string,
  id: string,
  input: Partial<CreateNoteInput>,
): Promise<NoteView | null> {
  await connectToDatabase();
  const doc = await NoteModel.findOne({ _id: id, userId });
  if (!doc) return null;
  if (input.title !== undefined) doc.title = encryptNullable(input.title);
  if (input.content !== undefined) doc.content = encryptField(input.content);
  if (input.tags !== undefined) doc.tags = input.tags;
  await doc.save();
  return toView(doc);
}

export async function togglePin(
  userId: string,
  id: string,
): Promise<NoteView | null> {
  await connectToDatabase();
  const doc = await NoteModel.findOne({ _id: id, userId });
  if (!doc) return null;
  doc.pinned = !doc.pinned;
  await doc.save();
  return toView(doc);
}

export async function deleteNote(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await NoteModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
