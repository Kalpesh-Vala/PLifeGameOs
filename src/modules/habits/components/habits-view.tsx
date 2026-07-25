"use client";

import * as React from "react";
import { Repeat, Shield, Zap, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { HabitCard } from "@/modules/habits/components/habit-card";
import { HabitFormDialog } from "@/modules/habits/components/habit-form-dialog";
import type { HabitView } from "@/modules/habits/types";
import type { HabitStatus } from "@/modules/habits/lib/rules";

const STATUS_ORDER: Record<HabitStatus, number> = {
  upcoming: 0,
  "on-time": 1,
  late: 2,
  missed: 3,
  rest: 4,
};

function sortHabits(habits: HabitView[]): HabitView[] {
  return [...habits].sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    return (a.scheduledTime ?? "99:99").localeCompare(b.scheduledTime ?? "99:99");
  });
}

export function HabitsView() {
  const habits = trpc.habits.list.useQuery();
  const stats = trpc.habits.stats.useQuery();
  const utils = trpc.useUtils();

  // Auto-settle missed habits once when the view mounts.
  const settle = trpc.habits.settle.useMutation({
    onSuccess: (result) => {
      if (result.missed > 0) {
        toast.error(
          `${result.missed} habit${result.missed > 1 ? "s" : ""} missed — −${result.penaltyXp} XP`,
        );
        void utils.habits.list.invalidate();
        void utils.habits.stats.invalidate();
        void utils.gamification.profile.invalidate();
      }
    },
  });
  const settled = React.useRef(false);
  React.useEffect(() => {
    if (settled.current) return;
    settled.current = true;
    settle.mutate();
  }, [settle]);

  return (
    <div className="space-y-4">
      {stats.isLoading || !stats.data ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : (
        <StatsHeader stats={stats.data} />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {(habits.data ?? []).length} habit
          {(habits.data ?? []).length === 1 ? "" : "s"}
        </p>
        <HabitFormDialog />
      </div>

      {habits.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (habits.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Repeat className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No habits yet</p>
          <p className="text-sm text-muted-foreground">
            Give a habit a scheduled time and beat the clock every day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortHabits(habits.data ?? []).map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatsHeader({
  stats,
}: {
  stats: {
    disciplineScore: number;
    dailyScore: number;
    weeklyScore: number;
    onTime: number;
    late: number;
    missed: number;
    upcoming: number;
    scheduledToday: number;
  };
}) {
  const disc = stats.disciplineScore;
  const discColor =
    disc >= 70 ? "text-success" : disc >= 40 ? "text-warning" : "text-destructive";

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2">
              <Shield className={cn("size-4", discColor)} />
              <span className="text-sm text-muted-foreground">
                Discipline score
              </span>
            </div>
            <p className={cn("mt-1 text-3xl font-bold", discColor)}>{disc}</p>
            <Progress value={disc} className="mt-2 h-1.5" />
          </div>
          <ScorePill
            icon={<Zap className="size-4 text-xp" />}
            label="Today's score"
            value={stats.dailyScore}
          />
          <ScorePill
            icon={<CalendarRange className="size-4 text-info" />}
            label="This week"
            value={stats.weeklyScore}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusChip label="Upcoming" count={stats.upcoming} tone="info" />
          <StatusChip label="On time" count={stats.onTime} tone="success" />
          <StatusChip label="Late" count={stats.late} tone="warning" />
          <StatusChip label="Missed" count={stats.missed} tone="destructive" />
        </div>
      </CardContent>
    </Card>
  );
}

function ScorePill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col justify-center rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "mt-1 text-xl font-semibold",
          value < 0 ? "text-destructive" : "",
        )}
      >
        {value > 0 ? "+" : ""}
        {value}
      </p>
    </div>
  );
}

function StatusChip({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: string;
}) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
      style={{ color: `var(--${tone})` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: `var(--${tone})` }} />
      {count} {label}
    </span>
  );
}
