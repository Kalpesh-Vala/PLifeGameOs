import Link from "next/link";
import {
  Flame,
  Zap,
  Trophy,
  Target,
  ListChecks,
  Repeat,
  Swords,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Phase 0 dashboard: static preview of the character + overview surface.
 * Phase 1 wires this to the real XP/level engine and live user data.
 */
export default function DashboardPage() {
  const level = 1;
  const levelTitle = "Beginner";
  const xp = 120;
  const xpForNext = 300;
  const xpPercent = Math.round((xp / xpForNext) * 100);

  const stats = [
    { label: "Current streak", value: "0 days", icon: Flame, tone: "warning" },
    { label: "XP today", value: "120", icon: Zap, tone: "xp" },
    { label: "Achievements", value: "0", icon: Trophy, tone: "legendary" },
    { label: "Active goals", value: "0", icon: Target, tone: "info" },
  ] as const;

  const quickActions = [
    { title: "Add a task", href: "/tasks", icon: ListChecks },
    { title: "Check a habit", href: "/habits", icon: Repeat },
    { title: "View daily quests", href: "/quests", icon: Swords },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Dashboard"
        description="Your life at a glance. Every action levels up your character."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Character card */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Character</CardTitle>
              <CardDescription>
                Level up by completing tasks, habits, and quests.
              </CardDescription>
            </div>
            <Badge className="bg-xp text-xp-foreground hover:bg-xp">
              Level {level}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold">
                {level}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{levelTitle}</span>
                  <span className="text-muted-foreground">
                    {xp} / {xpForNext} XP
                  </span>
                </div>
                <Progress value={xpPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {xpForNext - xp} XP until Level {level + 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <CardDescription>Jump straight into your day.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  asChild
                  variant="outline"
                  className="justify-between"
                >
                  <Link href={action.href}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {action.title}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Stat cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Foundation ready. Modules unlock as we build each phase.
      </p>
    </div>
  );
}
