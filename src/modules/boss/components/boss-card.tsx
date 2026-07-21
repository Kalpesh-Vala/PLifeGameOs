"use client";

import { Swords, Skull, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import type { BossBattleView } from "@/modules/boss/types";

export function BossCard({ battle }: { battle: BossBattleView }) {
  const utils = trpc.useUtils();

  const invalidate = () => {
    void utils.boss.list.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
    void utils.gamification.achievements.invalidate();
  };

  const toggle = trpc.boss.toggleMilestone.useMutation({
    onSuccess: (result) => {
      if (result.defeated) {
        toast.success(`Boss defeated: ${battle.title} ⚔️`);
        showAwardToasts(result.award);
      }
      invalidate();
    },
    onError: () => toast.error("Could not update the milestone."),
  });

  const remove = trpc.boss.delete.useMutation({
    onSuccess: () => {
      toast.success("Boss battle removed.");
      invalidate();
    },
  });

  const defeated = battle.status === "defeated";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5",
        defeated && "border-xp/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            defeated ? "bg-xp/15 text-xp" : "bg-destructive/10 text-destructive",
          )}
        >
          {defeated ? <Skull className="size-5" /> : <Swords className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{battle.title}</p>
            <Badge
              variant={defeated ? "default" : "secondary"}
              className={cn("h-5 px-1.5 text-[10px]", defeated && "bg-xp text-xp-foreground")}
            >
              {defeated ? "Defeated" : "Active"}
            </Badge>
          </div>
          {battle.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {battle.description}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {battle.skillName && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {battle.skillName}
              </Badge>
            )}
            {battle.deadline && (
              <span>Due {format(new Date(battle.deadline), "MMM d, yyyy")}</span>
            )}
            <span className="text-xp">+{battle.xpReward} XP</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ id: battle.id })}
          aria-label="Delete boss battle"
        >
          {remove.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {battle.doneMilestones} / {battle.totalMilestones} milestones
          </span>
          <span>{battle.progressPct}%</span>
        </div>
        <Progress value={battle.progressPct} className="h-2" />
      </div>

      <ul className="mt-4 space-y-2">
        {battle.milestones.map((m) => (
          <li key={m.id} className="flex items-center gap-2.5">
            <Checkbox
              checked={m.done}
              disabled={toggle.isPending}
              onCheckedChange={() =>
                toggle.mutate({ battleId: battle.id, milestoneId: m.id })
              }
            />
            <span
              className={cn(
                "text-sm",
                m.done && "text-muted-foreground line-through",
              )}
            >
              {m.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
