import { startOfMonth, endOfMonth, parseISO } from "date-fns";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { TaskModel } from "@/modules/tasks/models";
import { TimelineEventModel } from "@/modules/timeline/models";
import { JournalEntryModel } from "@/modules/journal/models";
import { MoodEntryModel } from "@/modules/mood/models";
import { XpEventModel } from "@/modules/gamification/models";
import type {
  CalendarMonth,
  CalendarDaySummary,
  DayDetail,
} from "@/modules/calendar/types";

export async function getMonth(
  userId: string,
  monthKey: string,
): Promise<CalendarMonth> {
  await connectToDatabase();
  const monthStart = startOfMonth(parseISO(`${monthKey}-01`));
  const monthEnd = endOfMonth(monthStart);
  const startKey = `${monthKey}-01`;
  const endKey = dateKey(monthEnd);

  const [tasks, events, journals, moods, xpEvents] = await Promise.all([
    TaskModel.find({
      userId,
      dueDate: { $gte: monthStart, $lte: monthEnd },
    }).lean(),
    TimelineEventModel.find({
      userId,
      date: { $gte: startKey, $lte: endKey },
    }).lean(),
    JournalEntryModel.find({
      userId,
      date: { $gte: startKey, $lte: endKey },
    }).lean(),
    MoodEntryModel.find({
      userId,
      date: { $gte: startKey, $lte: endKey },
    }).lean(),
    XpEventModel.find({
      userId,
      createdAt: { $gte: monthStart, $lte: monthEnd },
    }).lean(),
  ]);

  const map = new Map<string, CalendarDaySummary>();
  const ensure = (date: string): CalendarDaySummary => {
    let d = map.get(date);
    if (!d) {
      d = { date, xp: 0, tasksDue: 0, events: 0, hasJournal: false, mood: null };
      map.set(date, d);
    }
    return d;
  };

  for (const t of tasks) {
    if (t.dueDate) ensure(dateKey(new Date(t.dueDate))).tasksDue += 1;
  }
  for (const e of events) ensure(e.date).events += 1;
  for (const j of journals) ensure(j.date).hasJournal = true;
  for (const m of moods) ensure(m.date).mood = m.mood;
  for (const x of xpEvents) {
    ensure(dateKey(new Date(x.createdAt as Date))).xp += x.amount;
  }

  return { monthKey, days: [...map.values()] };
}

export async function getDay(
  userId: string,
  date: string,
): Promise<DayDetail> {
  await connectToDatabase();
  const dayStart = parseISO(`${date}T00:00:00`);
  const dayEnd = parseISO(`${date}T23:59:59`);

  const [tasks, events, journals, mood] = await Promise.all([
    TaskModel.find({
      userId,
      dueDate: { $gte: dayStart, $lte: dayEnd },
    }).lean(),
    TimelineEventModel.find({ userId, date }).sort({ time: 1 }).lean(),
    JournalEntryModel.find({ userId, date }).sort({ createdAt: -1 }).lean(),
    MoodEntryModel.findOne({ userId, date }).lean(),
  ]);

  return {
    date,
    tasks: tasks.map((t) => ({
      id: String(t._id),
      title: t.title,
      status: t.status,
      priority: t.priority,
    })),
    events: events.map((e) => ({
      id: String(e._id),
      time: e.time,
      title: e.title,
      category: e.category ?? "other",
    })),
    journals: journals.map((j) => ({
      id: String(j._id),
      title: j.title ?? null,
      content: j.content,
    })),
    mood: mood?.mood ?? null,
  };
}
