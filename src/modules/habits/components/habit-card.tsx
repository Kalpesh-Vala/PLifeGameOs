"use client";

import {
  Flame,
  Trash2,
  Loader2,
  Check,
  Clock,
  Pencil,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import { HabitFormDialog } from "@/modules/habits/components/habit-form-dialog";
import { STATUS_META, streakMultiplier } from "@/modules/habits/lib/rules";
import type { HabitView } from "@/modules/habits/types";

export function HabitCard({ habit }: { habit: HabitView }) {
  const utils = trpc.useUtils();
  const meta = STATUS_META[habit.status];

  const invalidate = () => {
    void utils.habits.list.invalidate();
    void utils.habits.stats.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
    void utils.gamification.achievements.invalidate();
  };

  const checkIn = trpc.habits.checkIn.useMutation({
    onSuccess: (result) => {
      if (result.status === "on-time") {
        showAwardToasts(result.award, { description: result.message });
      } else if (result.status === "late" && result.award) {
        showAwardToasts(result.award, { description: result.message });
      } else if (result.penaltyApplied > 0) {
        toast.error(result.message, {
          icon: <AlertTriangle className="size-4" />,
        });
      } else {
        toast.info(result.message);
      }
      if (result.allOnTimeBonus) {
        showAwardToasts(result.allOnTimeBonus, {
          description: "Perfect day — all habits on time! 🏆",
        });
      }
      invalidate();
    },
    onError: () => toast.error("Could not check in."),
  });

  const remove = trpc.habits.delete.useMutation({
    onSuccess: () => {
      toast.success("Habit deleted.");
      invalidate();
    },
  });

  const mult = streakMultiplier(habit.currentStreak);
  const canCheckIn = habit.status === "upcoming";
  const done = habit.status === "on-time" || habit.status === "late";

  return (
    <div className={cn("rounded-xl border bg-card p-4 ring-1", meta.ring)}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => canCheckIn && checkIn.mutate({ id: habit.id })}
          disabled={!canCheckIn || checkIn.isPending}
          aria-label="Check in"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done
              ? cn(meta.bg, meta.text, "border-transparent")
              : habit.status === "missed"
                ? "border-destructive/40 text-destructive"
                : "border-info/50 text-info hover:bg-info/10",
          )}
        >
          {checkIn.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : habit.status === "missed" ? (
            <AlertTriangle className="size-5" />
          ) : (
            <Check className="size-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{habit.title}</p>
            <Badge
              variant="outline"
              className={cn("h-5 px-1.5 text-[10px]", meta.text)}
            >
              {meta.label}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            {habit.scheduledTime ? (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {habit.scheduledTime}
                {habit.gracePeriodMin > 0 && (
                  <span className="text-muted-foreground/70">
                    (+{habit.gracePeriodMin}m)
                  </span>
                )}
              </span>
            ) : (
              <span>Anytime</span>
            )}
            <span className="flex items-center gap-1">
              <Flame
                className={cn(
                  "size-3.5",
                  habit.currentStreak > 0 ? "text-warning" : "",
                )}
              />
              {habit.currentStreak}d{mult > 1 ? ` ·×${mult}` : ""}
            </span>
            <span className="flex items-center gap-1 text-xp">
              <Zap className="size-3.5" />+{habit.xpReward}
            </span>
            <Badge variant="secondary" className="h-4 px-1 text-[10px] capitalize">
              {habit.difficulty}
            </Badge>
            {habit.skillName && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {habit.skillName}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-0.5">
          <HabitFormDialog
            habit={habit}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                aria-label="Edit habit"
              >
                <Pencil className="size-3.5" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id: habit.id })}
            aria-label="Delete habit"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <ContributionHeatmap entries={habit.recentEntries} weeks={26} />
      </div>
    </div>
  );
}
