import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import {
  LearningItemModel,
  type LearningItemDoc,
} from "@/modules/learning/models";
import {
  LEARNING_XP,
  type LearningItemView,
  type LearningStatus,
} from "@/modules/learning/types";

function toView(doc: HydratedDocument<LearningItemDoc>): LearningItemView {
  return {
    id: String(doc._id),
    title: doc.title,
    provider: doc.provider ?? null,
    url: doc.url ?? null,
    status: doc.status as LearningStatus,
    progress: doc.progress,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

function statusForProgress(progress: number): LearningStatus {
  if (progress >= 100) return "completed";
  if (progress > 0) return "in-progress";
  return "planned";
}

export async function listLearning(
  userId: string,
): Promise<LearningItemView[]> {
  await connectToDatabase();
  const docs = await LearningItemModel.find({ userId }).sort({
    createdAt: -1,
  });
  return docs.map(toView);
}

export async function createLearning(
  userId: string,
  input: { title: string; provider?: string | null; url?: string | null },
): Promise<LearningItemView> {
  await connectToDatabase();
  const doc = await LearningItemModel.create({
    userId,
    title: input.title,
    provider: input.provider ?? null,
    url: input.url ?? null,
  });
  return toView(doc);
}

export type UpdateProgressResult = {
  item: LearningItemView;
  award: AwardResult | null;
};

export async function updateProgress(
  userId: string,
  id: string,
  progress: number,
): Promise<UpdateProgressResult | null> {
  await connectToDatabase();
  const doc = await LearningItemModel.findOne({ _id: id, userId });
  if (!doc) return null;

  doc.progress = Math.max(0, Math.min(100, Math.round(progress)));
  doc.status = statusForProgress(doc.progress);

  let award: AwardResult | null = null;
  if (doc.progress >= 100 && !doc.xpAwarded) {
    doc.xpAwarded = true;
    await doc.save();
    award = await awardXp(userId, {
      amount: LEARNING_XP,
      source: "learning",
      skillId: "reading",
      note: `Completed learning: ${doc.title}`,
    });
  } else {
    await doc.save();
  }

  return { item: toView(doc), award };
}

export async function deleteLearning(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await LearningItemModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
