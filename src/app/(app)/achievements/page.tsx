"use client";

import { PageHeader } from "@/components/layout/page-header";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AchievementGrid } from "@/modules/gamification/components/achievement-badge";
import { GamificationSummaryCard } from "@/modules/gamification/components/dashboard-view";
import type { AchievementView } from "@/modules/gamification/types";

export default function AchievementsPage() {
  const achievements = trpc.gamification.achievements.useQuery();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Achievements"
        description="Milestones you unlock as you build momentum."
      />

      {achievements.isLoading || !achievements.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <AchievementsContent achievements={achievements.data} />
      )}
    </div>
  );
}

function AchievementsContent({
  achievements,
}: {
  achievements: AchievementView[];
}) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);
  const legendary = unlocked.filter((a) => a.tier === "legendary").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <GamificationSummaryCard
          title="Unlocked"
          value={`${unlocked.length}/${achievements.length}`}
        />
        <GamificationSummaryCard
          title="Completion"
          value={`${Math.round(
            (unlocked.length / achievements.length) * 100,
          )}%`}
        />
        <GamificationSummaryCard
          title="Legendary earned"
          value={String(legendary)}
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({achievements.length})</TabsTrigger>
          <TabsTrigger value="unlocked">
            Unlocked ({unlocked.length})
          </TabsTrigger>
          <TabsTrigger value="locked">Locked ({locked.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <AchievementGrid achievements={achievements} />
        </TabsContent>
        <TabsContent value="unlocked" className="mt-4">
          {unlocked.length ? (
            <AchievementGrid achievements={unlocked} />
          ) : (
            <EmptyState />
          )}
        </TabsContent>
        <TabsContent value="locked" className="mt-4">
          <AchievementGrid achievements={locked} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      No achievements unlocked yet. Check in and complete actions to earn your
      first badge.
    </p>
  );
}
