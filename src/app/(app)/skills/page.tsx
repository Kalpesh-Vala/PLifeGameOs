"use client";

import { PageHeader } from "@/components/layout/page-header";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillGrid } from "@/modules/gamification/components/skill-card";
import { GamificationSummaryCard } from "@/modules/gamification/components/dashboard-view";
import type { SkillView } from "@/modules/gamification/types";

export default function SkillsPage() {
  const profile = trpc.gamification.profile.useQuery();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Skill Tree"
        description="Every skill levels up independently as you invest in it."
      />

      {profile.isLoading || !profile.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <SkillsContent skills={profile.data.skills} />
      )}
    </div>
  );
}

function SkillsContent({ skills }: { skills: SkillView[] }) {
  const totalLevels = skills.reduce((sum, s) => sum + s.level, 0);
  const avgLevel = skills.length
    ? (totalLevels / skills.length).toFixed(1)
    : "0";
  const top = [...skills].sort((a, b) => b.xp - a.xp)[0];

  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <GamificationSummaryCard
          title="Skills tracked"
          value={String(skills.length)}
        />
        <GamificationSummaryCard title="Average level" value={avgLevel} />
        <GamificationSummaryCard
          title="Top skill"
          value={top?.name ?? "—"}
          sub={top ? `Level ${top.level}` : undefined}
        />
      </div>

      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {category}
          </h2>
          <SkillGrid skills={skills.filter((s) => s.category === category)} />
        </section>
      ))}
    </div>
  );
}
