import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { isAiConfigured } from "@/env";
import { embed } from "@/server/ai/embed";
import {
  MemoryModel,
  MEMORY_VECTOR_INDEX,
  type MemoryDoc,
} from "@/modules/memory/models";
import type {
  MemoryKind,
  MemoryView,
  RetrievedMemory,
} from "@/modules/memory/types";

function toView(doc: HydratedDocument<MemoryDoc>): MemoryView {
  return {
    id: String(doc._id),
    kind: doc.kind as MemoryKind,
    content: doc.content,
    importance: doc.importance,
    source: doc.source,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export type AddMemoryInput = {
  content: string;
  kind?: MemoryKind;
  importance?: number;
  source?: string;
  sourceId?: string | null;
};

/**
 * Stores a memory, embedding its content when AI is configured. Embedding
 * failures are non-fatal — the memory is still saved and remains retrievable
 * via the text/recency fallback.
 */
export async function addMemory(
  userId: string,
  input: AddMemoryInput,
): Promise<MemoryView> {
  await connectToDatabase();

  let embedding: number[] = [];
  if (isAiConfigured) {
    try {
      embedding = await embed(input.content);
    } catch (error) {
      console.error("[memory] embedding failed; storing without vector:", error);
    }
  }

  const doc = await MemoryModel.create({
    userId,
    content: input.content,
    kind: input.kind ?? "fact",
    importance: input.importance ?? 3,
    source: input.source ?? "system",
    sourceId: input.sourceId ?? null,
    embedding,
  });

  return toView(doc);
}

/** Best-effort ingestion that never throws (safe to call from write paths). */
export async function ingestMemorySafe(
  userId: string,
  input: AddMemoryInput,
): Promise<void> {
  try {
    await addMemory(userId, input);
  } catch (error) {
    console.error("[memory] ingestion failed:", error);
  }
}

export async function listMemories(
  userId: string,
  limit = 100,
): Promise<MemoryView[]> {
  await connectToDatabase();
  const docs = await MemoryModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return docs.map(toView);
}

export async function deleteMemory(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await MemoryModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}

/**
 * Retrieves the most relevant memories for a query. Uses Atlas Vector Search
 * when the index and embeddings are available; otherwise falls back to a
 * recency + importance + keyword match so the feature degrades gracefully.
 */
export async function retrieveMemories(
  userId: string,
  query: string,
  k = 6,
): Promise<RetrievedMemory[]> {
  await connectToDatabase();

  if (isAiConfigured) {
    try {
      const vector = await embed(query);
      const results = await MemoryModel.aggregate([
        {
          $vectorSearch: {
            index: MEMORY_VECTOR_INDEX,
            path: "embedding",
            queryVector: vector,
            numCandidates: 100,
            limit: k,
            filter: { userId },
          },
        },
        {
          $project: {
            content: 1,
            kind: 1,
            importance: 1,
            source: 1,
            createdAt: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]);

      if (results.length > 0) {
        return results.map((r) => ({
          id: String(r._id),
          kind: r.kind as MemoryKind,
          content: r.content,
          importance: r.importance,
          source: r.source,
          createdAt: new Date(r.createdAt).toISOString(),
          score: r.score ?? 0,
        }));
      }
    } catch (error) {
      console.error(
        "[memory] vector search unavailable, using fallback:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return fallbackRetrieve(userId, query, k);
}

async function fallbackRetrieve(
  userId: string,
  query: string,
  k: number,
): Promise<RetrievedMemory[]> {
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 3);

  const docs = await MemoryModel.find({ userId })
    .sort({ importance: -1, createdAt: -1 })
    .limit(200);

  const scored = docs.map((doc) => {
    const text = doc.content.toLowerCase();
    const matches = terms.filter((t) => text.includes(t)).length;
    return { doc, score: matches + doc.importance / 10 };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map(({ doc, score }) => ({
    ...toView(doc),
    score,
  }));
}
