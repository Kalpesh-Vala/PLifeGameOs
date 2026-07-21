import { getAiClient } from "@/server/ai/client";
import { MODEL_CHAINS } from "@/server/ai/models";

/**
 * Creates an embedding vector for the given text, walking the embeddings
 * fallback chain. Uses the embeddings endpoint (not chat/completions).
 */
export async function embed(text: string): Promise<number[]> {
  const client = getAiClient();
  const input = text.slice(0, 8000);
  let lastError: unknown;

  for (const model of MODEL_CHAINS.embeddings) {
    try {
      const res = await client.embeddings.create({ model, input });
      const vector = res.data[0]?.embedding;
      if (vector?.length) return vector;
      lastError = new Error(`Empty embedding from ${model}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Embedding failed");
}
