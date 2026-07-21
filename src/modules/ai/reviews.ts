import { subDays, format } from "date-fns";
import { connectToDatabase } from "@/server/db/mongoose";
import { isAiConfigured } from "@/env";
import { AiNotConfiguredError } from "@/server/ai/client";
import { completeJson } from "@/server/ai/complete";
import { XpEventModel } from "@/modules/gamification/models";
import { getProfileView } from "@/modules/gamification/service";
import { MoodEntryModel } from "@/modules/mood/models";
import { JournalEntryModel } from "@/modules/journal/models";
import { ingestMemorySafe } from "@/modules/memory/service";
import { ReviewModel } from "@/modules/ai/models";

export type ReviewPeriod = "weekly" | "monthly";

export type ReviewStats = {
  xpEarned: number;
  tasksCompleted: number;
  habitsCompleted: number;
  checkIns: number;
  questsClaimed: number;
  journalEntries: number;
  avgMood: number | null;
};

export type ReviewView = {
  id: string;
  period: ReviewPeriod;
  periodKey: string;
  summary: string;
  wins: string[];
  challenges: string[];
  suggestions: string[];
  productivityScore: number;
  stats: ReviewStats;
  createdAt: string;
};

function periodConfig(period: ReviewPeriod) {
  const now = new Date();
  if (period === "weekly") {
    return { start: subDays(now, 7), key: format(now, "RRRR-'W'II") };
  }
  return { start: subDays(now, 30), key: format(now, "yyyy-MM") };
}

async function computeStats(
  userId: string,
  start: Date,
): Promise<ReviewStats> {
  await connectToDatabase();

  const [events, moods, journalCount] = await Promise.all([
    XpEventModel.find({ userId, createdAt: { $gte: start } }).lean(),
    MoodEntryModel.find({
      userId,
      date: { $gte: format(start, "yyyy-MM-dd") },
    }).lean(),
    JournalEntryModel.countDocuments({
      userId,
      createdAt: { $gte: start },
    }),
  ]);

  const stats: ReviewStats = {
    xpEarned: 0,
    tasksCompleted: 0,
    habitsCompleted: 0,
    checkIns: 0,
    questsClaimed: 0,
    journalEntries: journalCount,
    avgMood: null,
  };

  for (const e of events) {
    stats.xpEarned += e.amount;
    if (e.source === "task") stats.tasksCompleted += 1;
    else if (e.source === "habit") stats.habitsCompleted += 1;
    else if (e.source === "check-in") stats.checkIns += 1;
    else if (e.source === "quest" || e.source === "mission")
      stats.questsClaimed += 1;
  }

  if (moods.length > 0) {
    stats.avgMood =
      Math.round(
        (moods.reduce((s, m) => s + m.mood, 0) / moods.length) * 10,
      ) / 10;
  }

  return stats;
}

type ReviewJson = {
  summary: string;
  wins: string[];
  challenges: string[];
  suggestions: string[];
  productivityScore: number;
};

function toView(doc: {
  _id: unknown;
  period: string;
  periodKey: string;
  summary: string;
  wins: string[];
  challenges: string[];
  suggestions: string[];
  productivityScore: number;
  stats: unknown;
  createdAt: Date;
}): ReviewView {
  return {
    id: String(doc._id),
    period: doc.period as ReviewPeriod,
    periodKey: doc.periodKey,
    summary: doc.summary,
    wins: doc.wins,
    challenges: doc.challenges,
    suggestions: doc.suggestions,
    productivityScore: doc.productivityScore,
    stats: doc.stats as ReviewStats,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export async function getLatestReview(
  userId: string,
  period: ReviewPeriod,
): Promise<ReviewView | null> {
  await connectToDatabase();
  const doc = await ReviewModel.findOne({ userId, period })
    .sort({ createdAt: -1 })
    .lean();
  return doc ? toView(doc) : null;
}

export async function generateReview(
  userId: string,
  period: ReviewPeriod,
): Promise<ReviewView> {
  if (!isAiConfigured) throw new AiNotConfiguredError();
  await connectToDatabase();

  const { start, key } = periodConfig(period);
  const stats = await computeStats(userId, start);
  const profile = await getProfileView(userId);

  const label = period === "weekly" ? "week" : "month";
  const prompt = `You are the user's Life OS coach. Generate a ${label}ly review from their stats.

Profile: Level ${profile.level} (${profile.title}), ${profile.currentStreak}-day streak.
This ${label}'s stats:
- XP earned: ${stats.xpEarned}
- Tasks completed: ${stats.tasksCompleted}
- Habit check-offs: ${stats.habitsCompleted}
- Daily check-ins: ${stats.checkIns}
- Quests/missions claimed: ${stats.questsClaimed}
- Journal entries: ${stats.journalEntries}
- Average mood (1-5): ${stats.avgMood ?? "not logged"}

Respond with ONLY a JSON object of this shape:
{
  "summary": "2-3 sentence honest, encouraging summary",
  "wins": ["specific win", "..."],
  "challenges": ["specific challenge or slip", "..."],
  "suggestions": ["specific, actionable suggestion for next ${label}", "..."],
  "productivityScore": <integer 0-100 reflecting the ${label}>
}
Base everything on the actual numbers. Be specific and motivating, not generic.`;

  const { data } = await completeJson<ReviewJson>({
    capability: "reasoning",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 900,
  });

  const doc = await ReviewModel.findOneAndUpdate(
    { userId, period, periodKey: key },
    {
      userId,
      period,
      periodKey: key,
      summary: data.summary,
      wins: data.wins ?? [],
      challenges: data.challenges ?? [],
      suggestions: data.suggestions ?? [],
      productivityScore: Math.max(0, Math.min(100, data.productivityScore ?? 0)),
      stats,
    },
    { upsert: true, new: true },
  ).lean();

  await ingestMemorySafe(userId, {
    content: `${label[0].toUpperCase()}${label.slice(1)}ly review (${key}): ${data.summary}`,
    kind: "review",
    importance: 4,
    source: "review",
  });

  return toView(doc!);
}
