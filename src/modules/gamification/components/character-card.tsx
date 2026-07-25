import { Flame, Zap, Trophy, Coins, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ProfileView } from "@/modules/gamification/types";

export function CharacterCard({
  profile,
  action,
}: {
  profile: ProfileView;
  action?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">Your Character</CardTitle>
          <CardDescription>
            {profile.isMaxLevel
              ? "Maximum level reached — legendary."
              : "Level up by completing tasks, habits, and quests."}
          </CardDescription>
        </div>
        <Badge className="bg-xp text-xp-foreground hover:bg-xp">
          Level {profile.level}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold">
            {profile.level}
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{profile.title}</span>
              <span className="text-muted-foreground">
                {profile.xpIntoLevel} / {profile.xpForNextLevel} XP
              </span>
            </div>
            <Progress value={profile.progressPct} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {profile.isMaxLevel
                ? `${profile.totalXp.toLocaleString()} total XP`
                : `${
                    profile.xpForNextLevel - profile.xpIntoLevel
                  } XP until Level ${profile.level + 1}`}
            </p>
          </div>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export function StatCards({ profile }: { profile: ProfileView }) {
  const stats = [
    {
      label: "Current streak",
      value: `${profile.currentStreak} ${
        profile.currentStreak === 1 ? "day" : "days"
      }`,
      icon: Flame,
      tone: "warning",
    },
    {
      label: "Total XP",
      value: profile.totalXp.toLocaleString(),
      icon: Zap,
      tone: "xp",
    },
    {
      label: "Achievements",
      value: `${profile.achievementsUnlocked}/${profile.achievementsTotal}`,
      icon: Trophy,
      tone: "legendary",
    },
    {
      label: "Discipline",
      value: profile.disciplineScore,
      icon: Shield,
      tone:
        profile.disciplineScore >= 70
          ? "success"
          : profile.disciplineScore >= 40
            ? "warning"
            : "destructive",
    },
    {
      label: "Coins",
      value: profile.coins.toLocaleString(),
      icon: Coins,
      tone: "info",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div
                className="flex size-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `color-mix(in oklab, var(--${stat.tone}) 15%, transparent)`,
                  color: `var(--${stat.tone})`,
                }}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
