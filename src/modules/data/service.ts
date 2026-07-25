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

export type ImportSummary = {
  imported: Record<string, number>;
  total: number;
};

/**
 * Restores a user's data from an export bundle. This is a full replace: for
 * every known collection present in the bundle, the user's existing documents
 * are removed and replaced with the backup's documents. All data is force-
 * scoped to the current user, so a bundle can never write into another
 * account. Fresh `_id`s are generated to avoid cast/collision issues; this app
 * keys data by userId + natural fields, not cross-collection `_id` references.
 */
export async function importUserData(
  userId: string,
  bundle: { collections?: Record<string, unknown[]> },
): Promise<ImportSummary> {
  await connectToDatabase();

  const collections = bundle.collections ?? {};
  const imported: Record<string, number> = {};
  let total = 0;

  for (const { name, model } of USER_MODELS) {
    const raw = collections[name];
    if (!Array.isArray(raw)) {
      imported[name] = 0;
      continue;
    }

    const docs = raw
      .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
      .map((d) => {
        const clone: Record<string, unknown> = { ...d };
        delete clone._id;
        delete clone.__v;
        delete clone.id;
        clone.userId = userId;
        return clone;
      });

    // Replace this collection's data for the user.
    await model.deleteMany({ userId });

    let inserted = 0;
    if (docs.length) {
      try {
        const res = await model.insertMany(docs, { ordered: false });
        inserted = res.length;
      } catch (err) {
        // With ordered:false, valid docs still insert; count what succeeded.
        const bulk = err as { insertedDocs?: unknown[] };
        inserted = bulk.insertedDocs?.length ?? 0;
      }
    }

    imported[name] = inserted;
    total += inserted;
  }

  return { imported, total };
}

