import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import {
  TimelineEventModel,
  type TimelineEventDoc,
} from "@/modules/timeline/models";
import {
  TIMELINE_XP,
  type TimelineEventView,
} from "@/modules/timeline/types";
import type { TimelineCategory } from "@/modules/timeline/lib/categories";

function toView(event: HydratedDocument<TimelineEventDoc>): TimelineEventView {
  return {
    id: String(event._id),
    date: event.date,
    time: event.time,
    title: event.title,
    category: (event.category ?? "other") as TimelineCategory,
    note: event.note ?? null,
  };
}

export async function listTimeline(
  userId: string,
  date: string,
): Promise<TimelineEventView[]> {
  await connectToDatabase();
  const events = await TimelineEventModel.find({ userId, date }).sort({
    time: 1,
  });
  return events.map(toView);
}

export type CreateTimelineInput = {
  date: string;
  time: string;
  title: string;
  category: TimelineCategory;
  note?: string | null;
};

export type CreateTimelineResult = {
  event: TimelineEventView;
  award: AwardResult | null;
};

export async function createTimelineEvent(
  userId: string,
  input: CreateTimelineInput,
): Promise<CreateTimelineResult> {
  await connectToDatabase();

  const countForDate = await TimelineEventModel.countDocuments({
    userId,
    date: input.date,
  });

  const event = await TimelineEventModel.create({
    userId,
    date: input.date,
    time: input.time,
    title: input.title,
    category: input.category,
    note: input.note ?? null,
  });

  // Reward the first event logged for *today* only, once per day.
  let award: AwardResult | null = null;
  if (input.date === dateKey() && countForDate === 0) {
    award = await awardXp(userId, {
      amount: TIMELINE_XP,
      source: "timeline",
      note: "Logged your day",
    });
  }

  return { event: toView(event), award };
}

export async function deleteTimelineEvent(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await TimelineEventModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
