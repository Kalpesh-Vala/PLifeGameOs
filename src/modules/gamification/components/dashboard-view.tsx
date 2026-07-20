"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CharacterCard,
  StatCards,
} from "@/modules/gamification/components/character-card";
import { SkillGrid } from "@/modules/gamification/components/skill-card";
import { AchievementBadge } from "@/modules/gamification/components/achievement-badge";
import { ActivityFeed } from "@/modules/gamification/components/activity-feed";
import { CheckInButton } from "@/modules/gamification/components/check-in-button";

function SectionHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
        <Link href={href}>
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

export function DashboardView() {
  const profile = trpc.gamification.profile.useQuery();
  const activity = trpc.gamification.recentActivity.useQuery();
  const achievements = trpc.gamification.achievements.useQuery();

  if (profile.isLoading || !profile.data) {
    return <DashboardSkeleton />;
  }

  if (profile.isError) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Could not load your profile. Make sure the database is configured,
          then refresh.
        </CardContent>
      </Card>
    );
  }

  const data = profile.data;
  const previewSkills = data.skills.slice(0, 6);
  const previewAchievements = [...(achievements.data ?? [])]
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CharacterCard
            profile={data}
            action={
              <CheckInButton
                checkedInToday={data.checkedInToday}
                currentStreak={data.currentStreak}
              />
            }
          />
        </div>
        <ActivityFeed items={activity.data ?? []} />
      </div>

      <StatCards profile={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader title="Skill Tree" href="/skills" />
          <SkillGrid skills={previewSkills} className="lg:grid-cols-2" />
        </section>
        <section>
          <SectionHeader title="Achievements" href="/achievements" />
          {achievements.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {previewAchievements.map((a) => (
                <AchievementBadge key={a.id} achievement={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-52 rounded-xl lg:col-span-2" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// Header card used on the achievements/skills pages to show a summary.
export function GamificationSummaryCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
