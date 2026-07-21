/**
 * GitHub Models registry. Each capability has an ordered fallback chain — if a
 * model fails (rate limit, outage, timeout) the next one is tried. Model IDs
 * and token-param rules come from AI-README.md.
 */

export type ModelCapability = "fast" | "reasoning" | "vision" | "embeddings";

export const MODEL_CHAINS: Record<ModelCapability, string[]> = {
  // Everyday chat, nudges, quick generation.
  fast: [
    "openai/gpt-4o-mini",
    "openai/gpt-4.1-mini",
    "mistral-ai/mistral-small-2503",
    "meta/llama-4-scout-17b-16e-instruct",
  ],
  // Deep analysis: weekly/monthly reviews, pattern detection.
  reasoning: [
    "openai/gpt-5-mini",
    "openai/o4-mini",
    "openai/gpt-4.1",
    "deepseek/deepseek-r1",
  ],
  // Image understanding (receipts, screenshots, journal photos).
  vision: [
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "meta/llama-4-scout-17b-16e-instruct",
    "mistral-ai/mistral-small-2503",
  ],
  // Embeddings endpoint (not chat/completions).
  embeddings: ["openai/text-embedding-3-small", "openai/text-embedding-3-large"],
};

/** Embedding vector dimensions for the primary embedding model. */
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Reasoning-family models reject `max_tokens` and require
 * `max_completion_tokens` (see AI-README.md).
 */
export function usesCompletionTokens(model: string): boolean {
  const name = model.split("/").pop() ?? model;
  return ["gpt-5", "o1", "o3", "o4"].some((p) => name.startsWith(p));
}
