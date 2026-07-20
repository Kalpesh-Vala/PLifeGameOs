"use client";

import { CheckCircle2, Loader2, Flame } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";

export function CheckInButton({
  checkedInToday,
  currentStreak,
}: {
  checkedInToday: boolean;
  currentStreak: number;
}) {
  const utils = trpc.useUtils();

  const checkIn = trpc.gamification.checkIn.useMutation({
    onSuccess: (result) => {
      if (result.alreadyCheckedIn) {
        toast.info("Already checked in today. See you tomorrow!");
        return;
      }

      toast.success(`+${result.amount} XP`, {
        description: `Daily check-in — ${result.currentStreak}-day streak 🔥`,
        icon: <Flame className="size-4" />,
      });

      if (result.leveledUp) {
        toast.success(`Level up! You reached Level ${result.level} 🎉`);
      }

      for (const achievement of result.unlockedAchievements) {
        toast.success(`Achievement unlocked: ${achievement.name}`, {
          description: achievement.description,
        });
      }

      void utils.gamification.profile.invalidate();
      void utils.gamification.achievements.invalidate();
      void utils.gamification.recentActivity.invalidate();
    },
    onError: () => toast.error("Could not check in. Please try again."),
  });

  return (
    <Button
      className="w-full"
      disabled={checkedInToday || checkIn.isPending}
      onClick={() => checkIn.mutate()}
    >
      {checkIn.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CheckCircle2 className="size-4" />
      )}
      {checkedInToday
        ? "Checked in today"
        : currentStreak > 0
          ? `Check in — continue ${currentStreak}-day streak`
          : "Check in for today"}
    </Button>
  );
}
