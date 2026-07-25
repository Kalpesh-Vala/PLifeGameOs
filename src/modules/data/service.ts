import { connectToDatabase } from "@/server/db/mongoose";
import { USER_MODELS } from "@/modules/data/registry";

export type ExportBundle = {
  exportedAt: string;
  version: number;
  userId: string;
  collections: Record<string, unknown[]>;
};

/**
 * Serializes every user-scoped collection into a single JSON bundle the user
 * can download and keep as a backup.
 */
export async function exportUserData(userId: string): Promise<ExportBundle> {
  await connectToDatabase();

  const collections: Record<string, unknown[]> = {};
  for (const { name, model } of USER_MODELS) {
    collections[name] = await model.find({ userId }).lean();
  }

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    userId,
    collections,
  };
}

export type DeleteSummary = { deleted: Record<string, number>; total: number };

/**
 * Permanently deletes all of a user's data across every collection.
 */
export async function deleteAllUserData(
  userId: string,
): Promise<DeleteSummary> {
  await connectToDatabase();

  const deleted: Record<string, number> = {};
  let total = 0;
  for (const { name, model } of USER_MODELS) {
    const res = await model.deleteMany({ userId });
    deleted[name] = res.deletedCount ?? 0;
    total += res.deletedCount ?? 0;
  }

  return { deleted, total };
}

/**
 * Resets gamification progress (XP, levels, streaks, achievements, quests)
 * while keeping the user's content (tasks, notes, journals, etc.).
 */
export async function resetProgress(userId: string): Promise<void> {
  await connectToDatabase();
  const progressCollections = ["profile", "xpEvents", "questBoards"];
  for (const { name, model } of USER_MODELS) {
    if (progressCollections.includes(name)) {
      await model.deleteMany({ userId });
    }
  }
}
