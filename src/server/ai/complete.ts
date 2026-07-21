import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/index";
import { getAiClient } from "@/server/ai/client";
import {
  MODEL_CHAINS,
  usesCompletionTokens,
  type ModelCapability,
} from "@/server/ai/models";

export type CompleteOptions = {
  capability?: ModelCapability;
  messages: ChatCompletionMessageParam[];
  maxTokens?: number;
  temperature?: number;
};

export type CompleteResult = {
  content: string;
  model: string;
};

/**
 * Runs a chat completion, walking the capability's fallback chain until one
 * model succeeds. Handles the `max_tokens` vs `max_completion_tokens` split and
 * omits `temperature` for reasoning models that reject it.
 */
export async function complete({
  capability = "fast",
  messages,
  maxTokens = 800,
  temperature = 0.7,
}: CompleteOptions): Promise<CompleteResult> {
  const client = getAiClient();
  const chain = MODEL_CHAINS[capability];
  let lastError: unknown;

  for (const model of chain) {
    try {
      const reasoning = usesCompletionTokens(model);
      const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
        {
          model,
          messages,
          ...(reasoning
            ? { max_completion_tokens: maxTokens }
            : { max_tokens: maxTokens, temperature }),
        };

      const res = await client.chat.completions.create(params);
      const content = res.choices[0]?.message?.content?.trim() ?? "";
      if (content) return { content, model };
      lastError = new Error(`Empty response from ${model}`);
    } catch (error) {
      lastError = error;
      // Try the next model in the chain.
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All models failed");
}

/**
 * Like `complete`, but instructs the model to return JSON and parses it.
 * Falls back to extracting the first {...} block if the response has extra prose.
 */
export async function completeJson<T>(
  options: CompleteOptions,
): Promise<{ data: T; model: string }> {
  const result = await complete(options);
  const parsed = extractJson<T>(result.content);
  return { data: parsed, model: result.model };
}

function extractJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("Model did not return valid JSON");
  }
}
