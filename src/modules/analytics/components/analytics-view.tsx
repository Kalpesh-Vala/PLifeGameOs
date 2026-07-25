"use client";

import * as React from "react";
import {
  Gauge,
  Shield,
  Flame,
  Zap,
  Star,
  CalendarCheck,
  Lightbulb,
} from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import type { AnalyticsOverview } from "@/modules/analytics/types";
import {
  XpTrendChart,
  SourceDonut,
  LifeBalanceRadar,
  DowBar,
  HabitOutcomeChart,
  MoodEnergyChart,
  SkillBarsChart,
  CompletionMixChart,
} from "@/modules/analytics/components/charts";

export function AnalyticsView() {
  const overview = trpc.analytics.overview.useQuery();

  if (overview.isLoading || !overview.data || !overview.data.xpTrend) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-72 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const d = overview.data;

  return (
    <div className="space-y-5">
      <KpiRow data={d} />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="wellbeing">Wellbeing</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="XP momentum"
              description="XP earned per day over the last 30 days"
              insight={xpInsight(d)}
            >
              <XpTrendChart data={d.xpTrend} />
            </ChartCard>
            <ChartCard
              title="XP by source"
              description="Where your points come from"
            >
              <SourceDonut data={d.xpBySource} />
            </ChartCard>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Life balance"
              description="XP spread across life areas"
            >
              <LifeBalanceRadar data={d.lifeBalance} />
            </ChartCard>
            <ChartCard
              title="Contribution activity"
              description="Last 26 weeks of XP"
            >
              <div className="flex h-[240px] items-center">
                <ContributionHeatmap counts={d.xpHeatmap} weeks={26} />
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="mt-4 space-y-4">
          <ChartCard
            title="Habit outcomes"
            description="On-time, late, and missed habits (last 14 days)"
            insight={habitInsight(d)}
          >
            <HabitOutcomeChart data={d.habitOutcomes} />
          </ChartCard>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Activity mix"
              description="What you completed in the last 30 days"
            >
              <CompletionMixChart data={d.completionMix} />
            </ChartCard>
            <ChartCard
              title="Productive days"
              description="XP by day of week"
              insight={dowInsight(d)}
            >
              <DowBar data={d.dowActivity} />
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="wellbeing" className="mt-4 space-y-4">
          <ChartCard
            title="Mood & energy"
            description="Your emotional trend over 30 days"
            insight={moodInsight(d)}
          >
            <MoodEnergyChart data={d.moodTrend} />
          </ChartCard>
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniStat label="Habit consistency" value={`${d.habitConsistency}%`} />
            <MiniStat label="Avg mood (30d)" value={avgMood(d)} />
            <MiniStat
              label="Journal entries"
              value={String(d.period.journalEntries)}
            />
          </div>
        </TabsContent>

        <TabsContent value="growth" className="mt-4 space-y-4">
          <ChartCard
            title="Skill growth"
            description="Your strongest skills by XP"
          >
            <SkillBarsChart data={d.skills} />
          </ChartCard>
          <SourceTable data={d} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiRow({ data }: { data: AnalyticsOverview }) {
  const kpis = [
    {
      label: "Productivity",
      value: data.productivityScore,
      icon: Gauge,
      tone: "xp",
      progress: data.productivityScore,
    },
    {
      label: "Discipline",
      value: data.disciplineTracked ? data.disciplineScore : "—",
      icon: Shield,
      tone: !data.disciplineTracked
        ? "muted-foreground"
        : data.disciplineScore >= 70
          ? "success"
          : data.disciplineScore >= 40
            ? "warning"
            : "destructive",
      progress: data.disciplineTracked ? data.disciplineScore : undefined,
    },
    {
      label: "Streak",
      value: `${data.currentStreak}d`,
      icon: Flame,
      tone: "warning",
    },
    {
      label: `Level · ${data.title}`,
      value: data.level,
      icon: Star,
      tone: "legendary",
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
      tone: "success",
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <Card key={k.label}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="truncate text-xs text-muted-foreground">
                  {k.label}
                </span>
                <Icon className="size-4" style={{ color: `var(--${k.tone})` }} />
              </div>
              <p className="mt-1.5 text-2xl font-semibold leading-none">
                {k.value}
              </p>
              {"progress" in k && k.progress !== undefined && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${k.progress}%`,
                      backgroundColor: `var(--${k.tone})`,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ChartCard({
  title,
  description,
  insight,
  className,
  children,
}: {
  title: string;
  description?: string;
  insight?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
        {insight && (
          <p className="mt-2 flex items-start gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
            {insight}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function SourceTable({ data }: { data: AnalyticsOverview }) {
  const total = data.xpBySource.reduce((s, x) => s + x.xp, 0) || 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Source breakdown</CardTitle>
        <CardDescription>XP and activity by source (30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 text-right font-medium">Events</th>
                <th className="pb-2 text-right font-medium">XP</th>
                <th className="pb-2 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {data.xpBySource.map((s) => (
                <tr key={s.source} className="border-b last:border-0">
                  <td className="py-2">{s.label}</td>
                  <td className="py-2 text-right text-muted-foreground">
                    {s.count}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {s.xp.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-muted-foreground">
                    {Math.round((s.xp / total) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Insight helpers ----

function xpInsight(d: AnalyticsOverview): string | null {
  const total = d.xpTrend.reduce((s, p) => s + p.xp, 0);
  const active = d.xpTrend.filter((p) => p.xp > 0).length;
  if (active === 0) return "No XP earned in the last 30 days — start a quick check-in.";
  const avg = Math.round(total / 30);
  return `Averaging ${avg} XP/day, active on ${active} of the last 30 days.`;
}

function dowInsight(d: AnalyticsOverview): string | null {
  const top = [...d.dowActivity].sort((a, b) => b.xp - a.xp)[0];
  if (!top || top.xp === 0) return null;
  const dayNames: Record<string, string> = {
    Sun: "Sundays",
    Mon: "Mondays",
    Tue: "Tuesdays",
    Wed: "Wednesdays",
    Thu: "Thursdays",
    Fri: "Fridays",
    Sat: "Saturdays",
  };
  return `You're most productive on ${dayNames[top.day] ?? top.day}.`;
}

function habitInsight(d: AnalyticsOverview): string | null {
  const totals = d.habitOutcomes.reduce(
    (a, o) => ({
      onTime: a.onTime + o.onTime,
      late: a.late + o.late,
      missed: a.missed + o.missed,
    }),
    { onTime: 0, late: 0, missed: 0 },
  );
  const total = totals.onTime + totals.late + totals.missed;
  if (total === 0) return "No habit activity yet — add a scheduled habit.";
  const rate = Math.round((totals.onTime / total) * 100);
  return `${rate}% on-time over 14 days · ${totals.missed} missed.`;
}

function moodInsight(d: AnalyticsOverview): string | null {
  const logged = d.moodTrend.filter((m) => m.mood !== null);
  if (logged.length === 0) return "Log your mood to reveal patterns.";
  const first = logged.slice(0, Math.ceil(logged.length / 2));
  const second = logged.slice(Math.ceil(logged.length / 2));
  const avg = (arr: typeof logged) =>
    arr.reduce((s, m) => s + (m.mood ?? 0), 0) / (arr.length || 1);
  const delta = avg(second) - avg(first);
  const dir = delta > 0.3 ? "trending up" : delta < -0.3 ? "trending down" : "steady";
  return `Mood is ${dir} · logged on ${logged.length} of 30 days.`;
}

function avgMood(d: AnalyticsOverview): string {
  const logged = d.moodTrend.filter((m) => m.mood !== null);
  if (logged.length === 0) return "—";
  return (
    logged.reduce((s, m) => s + (m.mood ?? 0), 0) / logged.length
  ).toFixed(1);
}
