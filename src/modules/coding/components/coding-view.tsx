"use client";

import * as React from "react";
import { Code2, Flame, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import {
  CODING_PLATFORMS,
  DIFFICULTIES,
  type CodingProblemView,
  type Difficulty,
} from "@/modules/coding/types";

const DIFF_STYLE: Record<Difficulty, string> = {
  easy: "text-success border-success/40",
  medium: "text-warning border-warning/40",
  hard: "text-destructive border-destructive/40",
};

export function CodingView() {
  const stats = trpc.coding.stats.useQuery();
  const list = trpc.coding.list.useQuery();

  return (
    <div className="space-y-4">
      {stats.isLoading || !stats.data ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total solved" value={stats.data.total} />
          <StatCard
            label="Streak"
            value={`${stats.data.currentStreak}d`}
            icon={<Flame className="size-4 text-warning" />}
          />
          <StatCard label="Easy" value={stats.data.byDifficulty.easy} tone="success" />
          <StatCard label="Medium" value={stats.data.byDifficulty.medium} tone="warning" />
          <StatCard label="Hard" value={stats.data.byDifficulty.hard} tone="destructive" />
        </div>
      )}

      <AddProblem />

      {stats.data && stats.data.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Solve activity</CardTitle>
            <CardDescription>Last 26 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ContributionHeatmap counts={stats.data.solveHeatmap} weeks={26} />
          </CardContent>
        </Card>
      )}

      <ProblemList problems={list.data ?? []} loading={list.isLoading} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-2">
          {icon}
          <p
            className="text-xl font-semibold leading-none"
            style={tone ? { color: `var(--${tone})` } : undefined}
          >
            {value}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function AddProblem() {
  const [title, setTitle] = React.useState("");
  const [platform, setPlatform] =
    React.useState<(typeof CODING_PLATFORMS)[number]>("LeetCode");
  const [difficulty, setDifficulty] = React.useState<Difficulty>("medium");
  const [topic, setTopic] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.coding.create.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: `Solved ${title}` });
      setTitle("");
      setTopic("");
      void utils.coding.list.invalidate();
      void utils.coding.stats.invalidate();
      void utils.gamification.profile.invalidate();
      void utils.gamification.recentActivity.invalidate();
    },
    onError: () => toast.error("Could not log the problem."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log a solved problem</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({
              title: title.trim(),
              platform,
              difficulty,
              topic: topic.trim() || null,
            });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Problem name (e.g. Two Sum)"
            required
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Platform</Label>
              <Select
                value={platform}
                onValueChange={(v) =>
                  setPlatform(v as (typeof CODING_PLATFORMS)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODING_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Difficulty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d} className="capitalize">
                      {d} · +{d === "easy" ? 10 : d === "medium" ? 20 : 35} XP
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Arrays"
              />
            </div>
          </div>
          <Button type="submit" disabled={create.isPending} className="w-full">
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Log problem
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ProblemList({
  problems,
  loading,
}: {
  problems: CodingProblemView[];
  loading: boolean;
}) {
  const utils = trpc.useUtils();
  const remove = trpc.coding.delete.useMutation({
    onSuccess: () => {
      void utils.coding.list.invalidate();
      void utils.coding.stats.invalidate();
    },
  });

  if (loading) return <Skeleton className="h-40 rounded-xl" />;
  if (problems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <Code2 className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No problems logged yet.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent solves</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {problems.map((p) => (
            <li
              key={p.id}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/40"
            >
              <Badge
                variant="outline"
                className={cn("h-5 w-16 justify-center text-[10px] capitalize", DIFF_STYLE[p.difficulty])}
              >
                {p.difficulty}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.platform}
                  {p.topic ? ` · ${p.topic}` : ""}
                </p>
              </div>
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: p.id })}
                aria-label="Delete problem"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
