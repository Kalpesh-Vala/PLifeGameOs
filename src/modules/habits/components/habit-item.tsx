"use client";

import { Flame, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import type { HabitView } from "@/modules/habits/types";

export function HabitItem({ habit }: { habit: HabitView }) {
  const utils = trpc.useUtils();

  const invalidate = () => {
    void utils.habits.list.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
    void utils.gamification.achievements.invalidate();
  };

  const toggle = trpc.habits.toggleToday.useMutation({
    onSuccess: (result) => {
      if (result.completed) {
        showAwardToasts(result.award, { description: `Habit: ${habit.title}` });
      }
      invalidate();
    },
    onError: () => toast.error("Could not update the habit."),
  });

  const remove = trpc.habits.delete.useMutation({
    onSuccess: () => {
      toast.success("Habit deleted.");
      invalidate();
    },
  });

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggle.mutate({ id: habit.id })}
          disabled={toggle.isPending}
          aria-label={habit.completedToday ? "Mark incomplete" : "Complete today"}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            habit.completedToday
              ? "border-xp bg-xp text-xp-foreground"
              : "border-border text-muted-foreground hover:border-xp/60",
          )}
        >
          {toggle.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{habit.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame
                className={cn(
                  "size-3.5",
                  habit.currentStreak > 0 ? "text-warning" : "",
                )}
              />
              {habit.currentStreak} day streak
            </span>
            <span>·</span>
            <span>best {habit.longestStreak}</span>
            {habit.skillName && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {habit.skillName}
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ id: habit.id })}
          aria-label="Delete habit"
        >
          {remove.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </div>

      <div className="mt-3">
        <ContributionHeatmap entries={habit.recentEntries} weeks={26} />
      </div>
    </div>
  );
}
