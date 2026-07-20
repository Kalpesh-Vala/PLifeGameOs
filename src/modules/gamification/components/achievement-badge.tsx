import { Lock } from "lucide-react";
import { DynamicIcon } from "@/components/dynamic-icon";
import { cn } from "@/lib/utils";
import type { AchievementView } from "@/modules/gamification/types";
import type { AchievementTier } from "@/modules/gamification/lib/achievements";

const TIER_STYLES: Record<
  AchievementTier,
  { ring: string; text: string; label: string }
> = {
  bronze: {
    ring: "ring-amber-700/40",
    text: "text-amber-600 dark:text-amber-500",
    label: "Bronze",
  },
  silver: {
    ring: "ring-zinc-400/40",
    text: "text-zinc-500 dark:text-zinc-300",
    label: "Silver",
  },
  gold: {
    ring: "ring-warning/50",
    text: "text-warning",
    label: "Gold",
  },
  legendary: {
    ring: "ring-legendary/50",
    text: "text-legendary",
    label: "Legendary",
  },
};

export function AchievementBadge({
  achievement,
}: {
  achievement: AchievementView;
}) {
  const tier = TIER_STYLES[achievement.tier];
  const locked = !achievement.unlocked;
  const hidden = locked && achievement.secret;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border bg-card p-4 transition-opacity",
        locked && "opacity-60",
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full ring-2",
          locked ? "bg-muted ring-border" : cn("bg-muted", tier.ring),
        )}
      >
        {hidden ? (
          <Lock className="size-5 text-muted-foreground" />
        ) : (
          <DynamicIcon
            name={achievement.icon}
            className={cn("size-5", locked ? "text-muted-foreground" : tier.text)}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {hidden ? "Hidden achievement" : achievement.name}
          </p>
          <span className={cn("text-[10px] font-semibold uppercase", tier.text)}>
            {tier.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {hidden ? "Keep playing to reveal this one." : achievement.description}
        </p>
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="mt-1 text-[11px] text-muted-foreground/80">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export function AchievementGrid({
  achievements,
}: {
  achievements: AchievementView[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((a) => (
        <AchievementBadge key={a.id} achievement={a} />
      ))}
    </div>
  );
}
