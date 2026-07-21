"use client";

import { ListChecks, Repeat, CalendarCheck, Zap, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import type { QuestPeriod } from "@/modules/quests/lib/definitions";
import type { QuestView } from "@/modules/quests/types";

const METRIC_ICON = {
  tasks: ListChecks,
  habits: Repeat,
  checkin: CalendarCheck,
  xp: Zap,
} as const;

export function QuestCard({
  quest,
  period,
}: {
  quest: QuestView;
  period: QuestPeriod;
}) {
  const utils = trpc.useUtils();
  const Icon = METRIC_ICON[quest.metric];
  const pct = Math.round((quest.current / quest.target) * 100);

  const claim = trpc.quests.claim.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: quest.title });
      void utils.quests.board.invalidate();
      void utils.gamification.profile.invalidate();
      void utils.gamification.recentActivity.invalidate();
      void utils.gamification.achievements.invalidate();
    },
    onError: (e) => toast.error(e.message || "Could not claim reward."),
  });

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4",
        quest.claimed && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            quest.completed ? "bg-xp/15 text-xp" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{quest.title}</p>
            <span className="shrink-0 text-xs font-semibold text-xp">
              +{quest.xpReward} XP
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <Progress value={pct} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {quest.current} / {quest.target}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        {quest.claimed ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-xp">
            <Check className="size-3.5" />
            Reward claimed
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full"
            disabled={!quest.completed || claim.isPending}
            onClick={() => claim.mutate({ period, defId: quest.defId })}
          >
            {claim.isPending && <Loader2 className="size-4 animate-spin" />}
            {quest.completed ? "Claim reward" : "In progress"}
          </Button>
        )}
      </div>
    </div>
  );
}
