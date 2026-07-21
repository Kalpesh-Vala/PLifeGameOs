"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import { MOODS, getMood, type MoodLevel } from "@/modules/mood/lib/scale";
import type { MoodTrendPoint } from "@/modules/mood/types";

export function MoodView() {
  const today = trpc.mood.today.useQuery();
  const trend = trpc.mood.trend.useQuery({ days: 30 });

  if (today.isLoading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <MoodPicker
        initialMood={today.data?.mood ?? null}
        initialEnergy={today.data?.energy ?? null}
        initialNote={today.data?.note ?? null}
      />
      <MoodTrend points={trend.data ?? []} loading={trend.isLoading} />
    </div>
  );
}

function MoodPicker({
  initialMood,
  initialEnergy,
  initialNote,
}: {
  initialMood: MoodLevel | null;
  initialEnergy: number | null;
  initialNote: string | null;
}) {
  const [mood, setMood] = React.useState<MoodLevel | null>(initialMood);
  const [energy, setEnergy] = React.useState<number | null>(initialEnergy);
  const [note, setNote] = React.useState(initialNote ?? "");

  const utils = trpc.useUtils();
  const log = trpc.mood.log.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: "Mood logged" });
      if (!result.award) toast.success("Mood updated.");
      void utils.mood.today.invalidate();
      void utils.mood.trend.invalidate();
      void utils.gamification.profile.invalidate();
      void utils.gamification.recentActivity.invalidate();
    },
    onError: () => toast.error("Could not save your mood."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">How are you feeling today?</CardTitle>
        <CardDescription>Log your mood to track trends over time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex justify-between gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 transition-colors",
                mood === m.value
                  ? "border-primary bg-accent"
                  : "hover:bg-accent/50",
              )}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Energy (optional)
          </Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((e) => (
              <button
                key={e}
                onClick={() => setEnergy(energy === e ? null : e)}
                className={cn(
                  "size-9 rounded-md border text-sm transition-colors",
                  energy === e
                    ? "border-primary bg-accent font-medium"
                    : "hover:bg-accent/50",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mood-note" className="text-xs text-muted-foreground">
            Note (optional)
          </Label>
          <Input
            id="mood-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind?"
          />
        </div>

        <Button
          className="w-full"
          disabled={!mood || log.isPending}
          onClick={() =>
            mood &&
            log.mutate({ mood, energy, note: note.trim() || null })
          }
        >
          {log.isPending && <Loader2 className="size-4 animate-spin" />}
          {initialMood ? "Update mood" : "Log mood"}
        </Button>
      </CardContent>
    </Card>
  );
}

function MoodTrend({
  points,
  loading,
}: {
  points: MoodTrendPoint[];
  loading: boolean;
}) {
  const logged = points.filter((p) => p.mood !== null);
  const avg =
    logged.length > 0
      ? (logged.reduce((s, p) => s + (p.mood ?? 0), 0) / logged.length).toFixed(1)
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
          <p className="text-xs text-muted-foreground">avg mood</p>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex h-24 items-end gap-1">
            {points.map((p) => {
              const meta = p.mood ? getMood(p.mood) : undefined;
              return (
                <div
                  key={p.date}
                  className="group relative flex-1"
                  title={`${format(new Date(p.date), "MMM d")}${
                    meta ? ` · ${meta.label}` : " · no entry"
                  }`}
                >
                  <div
                    className={cn(
                      "w-full rounded-sm",
                      meta ? "bg-xp" : "bg-muted",
                    )}
                    style={{
                      height: p.mood ? `${(p.mood / 5) * 100}%` : "4px",
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
