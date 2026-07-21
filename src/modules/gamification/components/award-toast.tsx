import { toast } from "sonner";
import { Zap } from "lucide-react";
import { getSkill } from "@/modules/gamification/lib/skills";
import type { AwardResult } from "@/modules/gamification/types";

/**
 * Shows the standard celebration toasts for an XP award: XP gained, level-up,
 * skill level-up, and any newly unlocked achievements. Shared by all modules
 * that grant XP (tasks, habits, quests, boss battles).
 */
export function showAwardToasts(
  award: AwardResult | null,
  opts?: { description?: string },
): void {
  if (!award || award.amount <= 0) return;

  toast.success(`+${award.amount} XP`, {
    description: opts?.description,
    icon: <Zap className="size-4" />,
  });

  if (award.leveledUp) {
    toast.success(`Level up! You reached Level ${award.level} 🎉`);
  }

  if (award.skillLevelUp) {
    const skill = getSkill(award.skillLevelUp.skillId);
    toast.success(
      `${skill?.name ?? "Skill"} is now Level ${award.skillLevelUp.to} ⬆️`,
    );
  }

  for (const achievement of award.unlockedAchievements) {
    toast.success(`Achievement unlocked: ${achievement.name}`, {
      description: achievement.description,
    });
  }
}
