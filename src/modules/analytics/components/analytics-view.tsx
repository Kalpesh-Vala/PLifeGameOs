"use client";

import { Gauge, Flame, Zap, CalendarCheck, Repeat } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsOverview } from "@/modules/analytics/types";

export function AnalyticsView() {
  const overview = trpc.analytics.overview.useQuery();

  if (overview.isLoading || !overview.data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const d = overview.data;

  return (
    <div className="space-y-6">
      <StatRow data={d} />
      <XpHeatmapCard heatmap={d.xpHeatmap} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarCard
          title="XP by source"
          description="Where your XP came from (last 30 days)"
          items={d.xpBySource.map((s) => ({ label: s.label, value: s.xp }))}
          suffix="XP"
        />
        <BarCard
          title="Life balance"
          description="XP across life areas"
          items={d.lifeBalance
            .sort((a, b) => b.xp - a.xp)
            .map((s) => ({ label: s.category, value: s.xp }))}
          suffix="XP"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarCard
          title="Skill growth"
          description="Your strongest skills"
          items={d.skills
            .slice(0, 8)
            .map((s) => ({ label: `${s.name} · Lv ${s.level}`, value: s.xp }))}
          suffix="XP"
        />
        <MoodCard trend={d.moodTrend} />
      </div>
    </div>
  );
}

function StatRow({ data }: { data: AnalyticsOverview }) {
  const stats = [
    {
      label: "Productivity",
      value: `${data.productivityScore}`,
      icon: Gauge,
      tone: "xp",
      progress: data.productivityScore,
    },
    {
      label: "Habit consistency",
      value: `${data.habitConsistency}%`,
      icon: Repeat,
      tone: "success",
      progress: data.habitConsistency,
    },
    {
      label: "Current streak",
      value: `${data.currentStreak}d`,
      icon: Flame,
      tone: "warning",
    },
    {
      label: "XP (30d)",
      value: data.period.xpEarned.toLocaleString(),
      icon: Zap,
      tone: "info",
    },
    {
      label: "Active days",
      value: `${data.period.activeDays}/30`,
      icon: CalendarCheck,
      tone: "legendary",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--${s.tone}) 15%, transparent)`,
                    color: `var(--${s.tone})`,
                  }}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
              {"progress" in s && s.progress !== undefined && (
                <Progress value={s.progress} className="mt-3 h-1.5" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function XpHeatmapCard({ heatmap }: { heatmap: Record<string, number> }) {
  const total = Object.values(heatmap).reduce((s, v) => s + v, 0);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">XP activity</CardTitle>
          <CardDescription>Last 26 weeks</CardDescription>
        </div>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} XP
        </p>
      </CardHeader>
      <CardContent>
        <ContributionHeatmap counts={heatmap} weeks={26} />
      </CardContent>
    </Card>
  );
}

function BarCard({
  title,
  description,
  items,
  suffix,
}: {
  title: string;
  description: string;
  items: { label: string; value: number }[];
  suffix?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {item.value.toLocaleString()}
                    {suffix ? ` ${suffix}` : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-xp"
                    style={{ width: `${(item.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MoodCard({
  trend,
}: {
  trend: { date: string; mood: number | null }[];
}) {
  const logged = trend.filter((t) => t.mood !== null);
  const avg =
    logged.length > 0
      ? (logged.reduce((s, t) => s + (t.mood ?? 0), 0) / logged.length).toFixed(1)
      : "—";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Mood trend</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{avg}</p>
          <p className="text-xs text-muted-foreground">avg</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-24 items-end gap-1">
          {trend.map((p) => (
            <div
              key={p.date}
              className="flex-1"
              title={`${p.date}${p.mood ? ` · ${p.mood}/5` : ""}`}
            >
              <div
                className={p.mood ? "rounded-sm bg-xp" : "rounded-sm bg-muted"}
                style={{ height: p.mood ? `${(p.mood / 5) * 100}%` : "4px" }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
