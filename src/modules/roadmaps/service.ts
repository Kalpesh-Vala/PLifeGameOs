import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { RoadmapModel, type RoadmapDoc } from "@/modules/roadmaps/models";
import { ROADMAP_STEP_XP, type RoadmapView } from "@/modules/roadmaps/types";

function toView(doc: HydratedDocument<RoadmapDoc>): RoadmapView {
  const total = doc.steps.length;
  const done = doc.steps.filter((s) => s.done).length;
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description ?? null,
    category: doc.category ?? "General",
    steps: doc.steps.map((s) => ({
      id: String(s._id),
      title: s.title,
      done: s.done,
    })),
    totalSteps: total,
    doneSteps: done,
    progressPct: total ? Math.round((done / total) * 100) : 0,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function listRoadmaps(userId: string): Promise<RoadmapView[]> {
  await connectToDatabase();
  const docs = await RoadmapModel.find({ userId }).sort({ createdAt: -1 });
  return docs.map(toView);
}

export async function createRoadmap(
  userId: string,
  input: {
    title: string;
    description?: string | null;
    category?: string;
    steps: string[];
  },
): Promise<RoadmapView> {
  await connectToDatabase();
  const doc = await RoadmapModel.create({
    userId,
    title: input.title,
    description: input.description ?? null,
    category: input.category || "General",
    steps: input.steps
      .map((t) => t.trim())
      .filter(Boolean)
      .map((title) => ({ title, done: false, rewarded: false })),
  });
  return toView(doc);
}

export type ToggleStepResult = {
  roadmap: RoadmapView;
  award: AwardResult | null;
};

export async function toggleStep(
  userId: string,
  roadmapId: string,
  stepId: string,
): Promise<ToggleStepResult | null> {
  await connectToDatabase();
  const doc = await RoadmapModel.findOne({ _id: roadmapId, userId });
  if (!doc) return null;

  const step = doc.steps.id(stepId);
  if (!step) return null;

  step.done = !step.done;

  let award: AwardResult | null = null;
  const shouldReward = step.done && !step.rewarded;
  if (shouldReward) step.rewarded = true;

  await doc.save();

  if (shouldReward) {
    award = await awardXp(userId, {
      amount: ROADMAP_STEP_XP,
      source: "roadmap",
      skillId: "reading",
      note: `Roadmap step: ${step.title}`,
    });
  }

  return { roadmap: toView(doc), award };
}

export async function deleteRoadmap(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await RoadmapModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
