import { startOfDay, startOfWeek, format } from "date-fns";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { awardXp } from "@/modules/gamification/service";
import { XpEventModel } from "@/modules/gamification/models";
import type { AwardResult } from "@/modules/gamification/types";
import { QuestBoardModel } from "@/modules/quests/models";
import {
  getQuestDefinition,
  poolFor,
  questCountFor,
  type QuestMetric,
  type QuestPeriod,
} from "@/modules/quests/lib/definitions";
import type { QuestBoardView, QuestView } from "@/modules/quests/types";

function periodKeyFor(period: QuestPeriod): string {
  return period === "daily"
    ? dateKey()
    : format(new Date(), "RRRR-'W'II"); // ISO week, e.g. 2026-W30
}

function rangeStartFor(period: QuestPeriod): Date {
  return period === "daily"
    ? startOfDay(new Date())
    : startOfWeek(new Date(), { weekStartsOn: 1 });
}

function pickQuestIds(period: QuestPeriod): string[] {
  const pool = [...poolFor(period)];
  const count = Math.min(questCountFor(period), pool.length);
  // Fisher–Yates shuffle, then take the first `count`.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((q) => q.id);
}

async function getOrCreateBoard(userId: string, period: QuestPeriod) {
  await connectToDatabase();
  const periodKey = periodKeyFor(period);

  const existing = await QuestBoardModel.findOne({ userId, period, periodKey });
  if (existing) return existing;

  try {
    return await QuestBoardModel.create({
      userId,
      period,
      periodKey,
      quests: pickQuestIds(period).map((defId) => ({ defId, claimed: false })),
    });
  } catch {
    // Unique-index race: another request created it first.
    return QuestBoardModel.findOne({ userId, period, periodKey });
  }
}

type Metrics = Record<QuestMetric, number>;

async function computeMetrics(
  userId: string,
  period: QuestPeriod,
): Promise<Metrics> {
  await connectToDatabase();
  const start = rangeStartFor(period);
  const events = await XpEventModel.find({
    userId,
    createdAt: { $gte: start },
  }).lean();

  const metrics: Metrics = { tasks: 0, habits: 0, checkin: 0, xp: 0 };
  for (const e of events) {
    metrics.xp += e.amount;
    if (e.source === "task") metrics.tasks += 1;
    else if (e.source === "habit") metrics.habits += 1;
    else if (e.source === "check-in") metrics.checkin += 1;
  }
  return metrics;
}

function buildQuestView(
  period: QuestPeriod,
  defId: string,
  claimed: boolean,
  metrics: Metrics,
): QuestView | null {
  const def = getQuestDefinition(period, defId);
  if (!def) return null;
  const current = Math.min(metrics[def.metric], def.target);
  return {
    defId: def.id,
    title: def.title,
    metric: def.metric,
    target: def.target,
    current,
    xpReward: def.xpReward,
    completed: metrics[def.metric] >= def.target,
    claimed,
  };
}

export async function getQuestBoard(
  userId: string,
  period: QuestPeriod,
): Promise<QuestBoardView> {
  const board = await getOrCreateBoard(userId, period);
  const metrics = await computeMetrics(userId, period);

  const quests = (board?.quests ?? [])
    .map((q) => buildQuestView(period, q.defId, q.claimed, metrics))
    .filter((q): q is QuestView => q !== null);

  return {
    period,
    periodKey: periodKeyFor(period),
    quests,
  };
}

export type ClaimQuestResult = {
  award: AwardResult;
  defId: string;
};

export async function claimQuest(
  userId: string,
  period: QuestPeriod,
  defId: string,
): Promise<ClaimQuestResult | null | "not-ready" | "already-claimed"> {
  const board = await getOrCreateBoard(userId, period);
  if (!board) return null;

  const entry = board.quests.find((q) => q.defId === defId);
  const def = getQuestDefinition(period, defId);
  if (!entry || !def) return null;
  if (entry.claimed) return "already-claimed";

  const metrics = await computeMetrics(userId, period);
  if (metrics[def.metric] < def.target) return "not-ready";

  entry.claimed = true;
  await board.save();

  const award = await awardXp(userId, {
    amount: def.xpReward,
    source: period === "daily" ? "quest" : "mission",
    note: `${period === "daily" ? "Quest" : "Mission"}: ${def.title}`,
  });

  return { award, defId };
}
