import OpenAI from "openai";
import { env, isAiConfigured } from "@/env";

/**
 * OpenAI-compatible client pointed at GitHub Models. Cached per process.
 * The `api-version` default query is required for the newer reasoning models.
 */
let cached: OpenAI | null = null;

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI is not configured. Set GITHUB_MODELS_TOKEN in your environment.");
    this.name = "AiNotConfiguredError";
  }
}

export function getAiClient(): OpenAI {
  if (!isAiConfigured || !env.GITHUB_MODELS_TOKEN) {
    throw new AiNotConfiguredError();
  }
  if (cached) return cached;

  cached = new OpenAI({
    apiKey: env.GITHUB_MODELS_TOKEN,
    baseURL: env.GITHUB_MODELS_BASE_URL,
    defaultQuery: { "api-version": "2024-12-01-preview" },
    timeout: 45_000,
    maxRetries: 0,
  });
  return cached;
}

export { isAiConfigured };
