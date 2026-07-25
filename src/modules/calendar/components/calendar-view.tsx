"use client";

import * as React from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Clock,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { dateKey } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMood } from "@/modules/mood/lib/scale";
import { getTimelineCategory } from "@/modules/timeline/lib/categories";
import { DynamicIcon } from "@/components/dynamic-icon";
import type { CalendarDaySummary } from "@/modules/calendar/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView() {
  const [month, setMonth] = React.useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = React.useState<string | null>(dateKey());

  const monthKey = format(month, "yyyy-MM");
  const data = trpc.calendar.month.useQuery({ monthKey });

  const summary = new Map<string, CalendarDaySummary>(
    (data.data?.days ?? []).map((d) => [d.date, d]),
  );

  const gridDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">{format(month, "MMMM yyyy")}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(startOfMonth(new Date()))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[11px] font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          {data.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {gridDays.map((day) => {
                const key = dateKey(day);
                const s = summary.get(key);
                const inMonth = isSameMonth(day, month);
                const isSelected = selected === key;
                const moodMeta = s?.mood ? getMood(s.mood) : undefined;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={cn(
                      "flex aspect-square flex-col rounded-md border p-1 text-left transition-colors",
                      !inMonth && "opacity-40",
                      isSelected
                        ? "border-primary bg-accent"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs",
                        isToday(day) &&
                          "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="mt-auto flex flex-wrap items-center gap-0.5">
                      {moodMeta && (
                        <span className="text-[10px] leading-none">
                          {moodMeta.emoji}
                        </span>
                      )}
                      {s?.tasksDue ? (
                        <span className="size-1.5 rounded-full bg-info" />
                      ) : null}
                      {s?.events ? (
                        <span className="size-1.5 rounded-full bg-warning" />
                      ) : null}
                      {s?.hasJournal ? (
                        <span className="size-1.5 rounded-full bg-legendary" />
                      ) : null}
                      {s?.xp ? (
                        <span className="size-1.5 rounded-full bg-xp" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <Legend color="bg-info" label="Tasks due" />
            <Legend color="bg-warning" label="Events" />
            <Legend color="bg-legendary" label="Journal" />
            <Legend color="bg-xp" label="XP earned" />
          </div>
        </CardContent>
      </Card>

      <DayPanel date={selected} />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("size-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function DayPanel({ date }: { date: string | null }) {
  const day = trpc.calendar.day.useQuery(
    { date: date ?? "" },
    { enabled: !!date },
  );

  if (!date) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Select a day to see its details.
        </CardContent>
      </Card>
    );
  }

  const d = day.data;
  const moodMeta = d?.mood ? getMood(d.mood) : undefined;
  const empty =
    d &&
    d.tasks.length === 0 &&
    d.events.length === 0 &&
    d.journals.length === 0 &&
    !d.mood;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {format(new Date(date), "EEEE, MMM d")}
          {moodMeta && <span className="ml-2">{moodMeta.emoji}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {day.isLoading ? (
          <Skeleton className="h-40" />
        ) : empty ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nothing logged for this day.
          </p>
        ) : (
          <>
            {d!.tasks.length > 0 && (
              <Section icon={<ListChecks className="size-4" />} title="Tasks due">
                {d!.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        t.status === "done" ? "bg-success" : "bg-info",
                      )}
                    />
                    <span
                      className={cn(
                        t.status === "done" &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {t.title}
                    </span>
                  </div>
                ))}
              </Section>
            )}

            {d!.events.length > 0 && (
              <Section icon={<Clock className="size-4" />} title="Timeline">
                {d!.events.map((e) => {
                  const cat = getTimelineCategory(e.category);
                  return (
                    <div key={e.id} className="flex items-center gap-2 text-sm">
                      <span className="w-10 text-xs tabular-nums text-muted-foreground">
                        {e.time}
                      </span>
                      <DynamicIcon
                        name={cat?.icon ?? "Circle"}
                        className={cn("size-3.5", cat?.color)}
                      />
                      <span>{e.title}</span>
                    </div>
                  );
                })}
              </Section>
            )}

            {d!.journals.length > 0 && (
              <Section
                icon={<NotebookPen className="size-4" />}
                title="Journal"
              >
                {d!.journals.map((j) => (
                  <div key={j.id} className="text-sm">
                    {j.title && <p className="font-medium">{j.title}</p>}
                    <p className="line-clamp-3 text-muted-foreground">
                      {j.content}
                    </p>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
