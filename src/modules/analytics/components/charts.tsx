"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  AnalyticsOverview,
  CompletionMix,
  DowPoint,
  HabitOutcomePoint,
  SkillBar,
  SourceBreakdown,
  TrendPoint,
} from "@/modules/analytics/types";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const shortDate = (d: string) => format(parseISO(d), "MMM d");

/** Area chart — XP earned per day (last 30 days). */
export function XpTrendChart({ data }: { data: TrendPoint[] }) {
  const config = {
    xp: { label: "XP", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillXp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-xp)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-xp)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={shortDate}
        />
        <YAxis tickLine={false} axisLine={false} width={30} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} />}
        />
        <Area
          dataKey="xp"
          type="monotone"
          fill="url(#fillXp)"
          stroke="var(--color-xp)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/** Donut — XP distribution by source. */
export function SourceDonut({ data }: { data: SourceBreakdown[] }) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.source, { label: d.label, color: PALETTE[i % 5] }]),
  );
  const chartData = data.map((d, i) => ({
    ...d,
    fill: PALETTE[i % 5],
  }));

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="label" hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="xp"
          nameKey="label"
          innerRadius={55}
          strokeWidth={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.source} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="label" />}
          className="flex-wrap gap-1.5"
        />
      </PieChart>
    </ChartContainer>
  );
}

/** Radar — life balance across skill categories. */
export function LifeBalanceRadar({
  data,
}: {
  data: AnalyticsOverview["lifeBalance"];
}) {
  const config = {
    xp: { label: "XP", color: "var(--chart-4)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
      <RadarChart data={data}>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis dataKey="category" className="text-[11px]" />
        <Radar
          dataKey="xp"
          fill="var(--color-xp)"
          fillOpacity={0.4}
          stroke="var(--color-xp)"
          strokeWidth={2}
        />
      </RadarChart>
    </ChartContainer>
  );
}

/** Vertical bars — XP by day of week. */
export function DowBar({ data }: { data: DowPoint[] }) {
  const config = {
    xp: { label: "XP", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={data} margin={{ top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={30} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="xp" fill="var(--color-xp)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

/** Stacked bars — habit outcomes over the last 14 days. */
export function HabitOutcomeChart({ data }: { data: HabitOutcomePoint[] }) {
  const config = {
    onTime: { label: "On time", color: "var(--success)" },
    late: { label: "Late", color: "var(--warning)" },
    missed: { label: "Missed", color: "var(--destructive)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={data} margin={{ top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
          tickFormatter={shortDate}
        />
        <YAxis tickLine={false} axisLine={false} width={26} allowDecimals={false} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="onTime" stackId="a" fill="var(--color-onTime)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="late" stackId="a" fill="var(--color-late)" />
        <Bar dataKey="missed" stackId="a" fill="var(--color-missed)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

/** Line — mood & energy trend. */
export function MoodEnergyChart({
  data,
}: {
  data: AnalyticsOverview["moodTrend"];
}) {
  const config = {
    mood: { label: "Mood", color: "var(--chart-1)" },
    energy: { label: "Energy", color: "var(--chart-3)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={shortDate}
        />
        <YAxis domain={[0, 5]} tickLine={false} axisLine={false} width={24} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(v) => shortDate(String(v))} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="mood"
          type="monotone"
          stroke="var(--color-mood)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          dataKey="energy"
          type="monotone"
          stroke="var(--color-energy)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ChartContainer>
  );
}

/** Horizontal bars — top skills by XP. */
export function SkillBarsChart({ data }: { data: SkillBar[] }) {
  const config = {
    xp: { label: "XP", color: "var(--chart-5)" },
  } satisfies ChartConfig;
  const top = data.slice(0, 8);

  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart
        data={top}
        layout="vertical"
        margin={{ left: 8, right: 12 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={92}
          className="text-[11px]"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="xp" fill="var(--color-xp)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

/** Vertical bars — activity completion mix. */
export function CompletionMixChart({ data }: { data: CompletionMix[] }) {
  const config = {
    count: { label: "Count", color: "var(--chart-2)" },
  } satisfies ChartConfig;
  const chartData = data.map((d, i) => ({ ...d, fill: PALETTE[i % 5] }));

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={chartData} margin={{ top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={26} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.type} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
