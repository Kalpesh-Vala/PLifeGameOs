"use client";

import { Trophy, Flame, Zap, Star, Medal, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LeaderboardView } from "@/modules/leaderboard/types";

function rankColor(rank: number): string {
  if (rank === 1) return "text-warning";
  if (rank === 2) return "text-zinc-400";
  if (rank === 3) return "text-amber-600";
  return "text-muted-foreground";
}

export function LeaderboardView() {
  const data = trpc.leaderboard.overview.useQuery();

  if (data.isLoading || !data.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const d = data.data;

  return (
    <div className="space-y-4">
      <Records data={d} />
      <div className="grid gap-4 lg:grid-cols-2">
        <WeeklyRanking data={d} />
        <SkillRanking data={d} />
      </div>
    </div>
  );
}

function Records({ data }: { data: LeaderboardView }) {
  const r = data.records;
  const stats = [
    { label: "Total XP", value: r.totalXp.toLocaleString(), icon: Zap, tone: "xp" },
    { label: `Level · ${r.title}`, value: r.level, icon: Star, tone: "info" },
    { label: "Longest streak", value: `${r.longestStreak}d`, icon: Flame, tone: "warning" },
    { label: "Best day", value: `${r.bestDayXp} XP`, icon: Trophy, tone: "legendary" },
    { label: "Achievements", value: r.achievements, icon: Medal, tone: "success" },
    { label: "Active days", value: r.activeDays, icon: CalendarCheck, tone: "info" },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label}>
            <CardContent className="py-4">
              <Icon
                className="size-4"
                style={{ color: `var(--${s.tone})` }}
              />
              <p className="mt-2 text-lg font-semibold leading-none">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function WeeklyRanking({ data }: { data: LeaderboardView }) {
  const max = Math.max(1, ...data.weeklyRanking.map((w) => w.xp));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Best weeks</CardTitle>
        <CardDescription>Your top XP weeks (last 8)</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {data.weeklyRanking.map((w) => (
            <li
              key={w.weekKey}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-1.5",
                w.isCurrent && "bg-accent/50",
              )}
            >
              <span className={cn("w-5 text-center font-bold", rankColor(w.rank))}>
                {w.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Week of {w.label}
                    {w.isCurrent && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (current)
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">{w.xp} XP</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-xp"
                    style={{ width: `${(w.xp / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SkillRanking({ data }: { data: LeaderboardView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Skill rankings</CardTitle>
        <CardDescription>Your skills by XP</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {data.skillRanking.map((s) => (
            <li key={s.name} className="flex items-center gap-3 py-1.5">
              <span className={cn("w-5 text-center font-bold", rankColor(s.rank))}>
                {s.rank}
              </span>
              <span className="flex-1 text-sm">{s.name}</span>
              <span className="text-xs text-muted-foreground">Lv {s.level}</span>
              <span className="w-16 text-right text-xs text-muted-foreground">
                {s.xp} XP
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
