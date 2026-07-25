import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { computeStreaks } from "@/modules/habits/lib/streak";
import {
  CodingProblemModel,
  type CodingProblemDoc,
} from "@/modules/coding/models";
import {
  CODING_XP,
  type CodingProblemView,
  type CodingStats,
  type Difficulty,
} from "@/modules/coding/types";

function toView(doc: HydratedDocument<CodingProblemDoc>): CodingProblemView {
  return {
    id: String(doc._id),
    title: doc.title,
    platform: doc.platform ?? "Other",
    difficulty: doc.difficulty as Difficulty,
    topic: doc.topic ?? null,
    url: doc.url ?? null,
    note: doc.note ?? null,
    solvedOn: doc.solvedOn,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function listProblems(
  userId: string,
  limit = 50,
): Promise<CodingProblemView[]> {
  await connectToDatabase();
  const docs = await CodingProblemModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return docs.map(toView);
}

export type CreateProblemInput = {
  title: string;
  platform: string;
  difficulty: Difficulty;
  topic?: string | null;
  url?: string | null;
};

export type CreateProblemResult = {
  problem: CodingProblemView;
  award: AwardResult;
};

export async function createProblem(
  userId: string,
  input: CreateProblemInput,
): Promise<CreateProblemResult> {
  await connectToDatabase();
  const doc = await CodingProblemModel.create({
    userId,
    title: input.title,
    platform: input.platform,
    difficulty: input.difficulty,
    topic: input.topic ?? null,
    url: input.url ?? null,
    solvedOn: dateKey(),
  });

  const award = await awardXp(userId, {
    amount: CODING_XP[input.difficulty],
    source: "coding",
    skillId: "dsa",
    note: `Solved: ${input.title} (${input.difficulty})`,
  });

  return { problem: toView(doc), award };
}

export async function deleteProblem(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await CodingProblemModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}

export async function getCodingStats(userId: string): Promise<CodingStats> {
  await connectToDatabase();
  const docs = await CodingProblemModel.find({ userId }).lean();

  const byDifficulty: Record<Difficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };
  const platformMap = new Map<string, number>();
  const solveHeatmap: Record<string, number> = {};

  for (const d of docs) {
    byDifficulty[d.difficulty as Difficulty] += 1;
    platformMap.set(d.platform ?? "Other", (platformMap.get(d.platform ?? "Other") ?? 0) + 1);
    solveHeatmap[d.solvedOn] = (solveHeatmap[d.solvedOn] ?? 0) + 1;
  }

  const { current } = computeStreaks(Object.keys(solveHeatmap));

  return {
    total: docs.length,
    byDifficulty,
    byPlatform: [...platformMap.entries()]
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count),
    currentStreak: current,
    solveHeatmap,
  };
}
