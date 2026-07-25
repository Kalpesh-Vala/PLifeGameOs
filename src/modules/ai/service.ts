import type { ChatCompletionMessageParam } from "openai/resources/index";
import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { isAiConfigured } from "@/env";
import { complete } from "@/server/ai/complete";
import { AiNotConfiguredError } from "@/server/ai/client";
import { buildUserContext } from "@/server/ai/context";
import { isAiContextEnabled } from "@/modules/settings/service";
import { ChatMessageModel, type ChatMessageDoc } from "@/modules/ai/models";
import type { ChatMessageView, SendMessageResult } from "@/modules/ai/types";

const HISTORY_WINDOW = 12;

const SYSTEM_PROMPT = `You are the user's Life OS AI — their personal coach, mentor, and accountability partner inside a gamified life-management app.

You have access to a live snapshot of their real data (level, streaks, tasks, habits, mood, recent activity) and relevant long-term memories, provided below each turn.

Guidelines:
- Be warm, direct, and concise. Talk like a sharp, encouraging coach — not a corporate assistant.
- Ground every answer in their ACTUAL data. Reference specific tasks, streaks, skills, or patterns.
- Celebrate real wins; gently and specifically call out slipping patterns.
- Give actionable next steps, not generic advice.
- Never invent data that isn't in the snapshot. If you don't know, say so and ask.
- Keep responses focused (a few short paragraphs or a tight list).`;

function toView(doc: HydratedDocument<ChatMessageDoc>): ChatMessageView {
  return {
    id: String(doc._id),
    role: doc.role as ChatMessageView["role"],
    content: doc.content,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

const CONTEXT_DISABLED_NOTE =
  "(The user has turned off data access for the AI. Do not reference their personal Life OS data; answer generally and, if needed, suggest they enable data access in Settings.)";

/** Builds user context only if the user has granted AI data access. */
async function buildContextIfAllowed(
  userId: string,
  query: string,
): Promise<string> {
  const allowed = await isAiContextEnabled(userId);
  return allowed ? buildUserContext(userId, query) : CONTEXT_DISABLED_NOTE;
}

export async function getChatHistory(
  userId: string,
  limit = 50,
): Promise<ChatMessageView[]> {
  await connectToDatabase();
  const docs = await ChatMessageModel.find({ userId })
    .sort({ createdAt: 1 })
    .limit(limit);
  return docs.map(toView);
}

export async function clearChatHistory(userId: string): Promise<void> {
  await connectToDatabase();
  await ChatMessageModel.deleteMany({ userId });
}

export async function sendMessage(
  userId: string,
  text: string,
): Promise<SendMessageResult> {
  if (!isAiConfigured) throw new AiNotConfiguredError();
  await connectToDatabase();

  await ChatMessageModel.create({ userId, role: "user", content: text });

  const [context, recent] = await Promise.all([
    buildContextIfAllowed(userId, text),
    ChatMessageModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(HISTORY_WINDOW),
  ]);

  const history = recent.reverse();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
    ...history.map(
      (m): ChatCompletionMessageParam => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }),
    ),
  ];

  const result = await complete({
    capability: "fast",
    messages,
    maxTokens: 700,
    temperature: 0.75,
  });

  const assistant = await ChatMessageModel.create({
    userId,
    role: "assistant",
    content: result.content,
  });

  return { message: toView(assistant), model: result.model };
}

/**
 * Generates a short, specific accountability nudge from the user's current
 * state — the kind of thing a good coach would say if they glanced at your day.
 */
export async function generateNudge(userId: string): Promise<string> {
  if (!isAiConfigured) throw new AiNotConfiguredError();

  const context = await buildContextIfAllowed(
    userId,
    "daily accountability nudge",
  );

  const result = await complete({
    capability: "fast",
    messages: [
      {
        role: "system",
        content:
          "You are the user's Life OS coach. Using their snapshot, write ONE short, specific, motivating nudge (1-2 sentences). Reference a real detail (a streak, an open task, mood, or a pattern). No preamble, no lists — just the nudge.",
      },
      { role: "user", content: context },
    ],
    maxTokens: 120,
    temperature: 0.8,
  });

  return result.content;
}
