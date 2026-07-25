import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import {
  InterviewTopicModel,
  type InterviewTopicDoc,
} from "@/modules/interview/models";
import {
  CATEGORY_SKILL,
  INTERVIEW_XP,
  type InterviewStats,
  type InterviewStatus,
  type InterviewTopicView,
} from "@/modules/interview/types";

function toView(doc: HydratedDocument<InterviewTopicDoc>): InterviewTopicView {
  return {
    id: String(doc._id),
    title: doc.title,
    category: doc.category ?? "Other",
    status: doc.status as InterviewStatus,
    note: doc.note ?? null,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function listTopics(
  userId: string,
): Promise<InterviewTopicView[]> {
  await connectToDatabase();
  const docs = await InterviewTopicModel.find({ userId }).sort({
    createdAt: -1,
  });
  return docs.map(toView);
}

export async function getInterviewStats(
  userId: string,
): Promise<InterviewStats> {
  await connectToDatabase();
  const docs = await InterviewTopicModel.find({ userId }).lean();
  const confident = docs.filter((d) => d.status === "confident").length;
  const learning = docs.filter((d) => d.status === "learning").length;
  const todo = docs.filter((d) => d.status === "todo").length;
  return {
    total: docs.length,
    confident,
    learning,
    todo,
    readiness: docs.length ? Math.round((confident / docs.length) * 100) : 0,
  };
}

export async function createTopic(
  userId: string,
  input: { title: string; category: string; note?: string | null },
): Promise<InterviewTopicView> {
  await connectToDatabase();
  const doc = await InterviewTopicModel.create({
    userId,
    title: input.title,
    category: input.category,
    note: input.note ?? null,
  });
  return toView(doc);
}

export type UpdateStatusResult = {
  topic: InterviewTopicView;
  award: AwardResult | null;
};

export async function updateStatus(
  userId: string,
  id: string,
  status: InterviewStatus,
): Promise<UpdateStatusResult | null> {
  await connectToDatabase();
  const doc = await InterviewTopicModel.findOne({ _id: id, userId });
  if (!doc) return null;

  doc.status = status;

  let award: AwardResult | null = null;
  if (status === "confident" && !doc.xpAwarded) {
    doc.xpAwarded = true;
    await doc.save();
    award = await awardXp(userId, {
      amount: INTERVIEW_XP,
      source: "interview",
      skillId: CATEGORY_SKILL[doc.category ?? "Other"] ?? "programming",
      note: `Confident on: ${doc.title}`,
    });
  } else {
    await doc.save();
  }

  return { topic: toView(doc), award };
}

export async function deleteTopic(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await InterviewTopicModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
