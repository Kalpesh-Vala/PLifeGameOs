"use client";

import { Swords } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { BossCard } from "@/modules/boss/components/boss-card";
import { BossCreateDialog } from "@/modules/boss/components/boss-create-dialog";

export function BossView() {
  const bosses = trpc.boss.list.useQuery();

  if (bosses.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    );
  }

  const all = bosses.data ?? [];
  const active = all.filter((b) => b.status === "active");
  const defeated = all.filter((b) => b.status === "defeated");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {active.length} active · {defeated.length} defeated
        </p>
        <BossCreateDialog />
      </div>

      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Swords className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No boss battles yet</p>
          <p className="text-sm text-muted-foreground">
            Turn a big goal into a boss battle and defeat it milestone by
            milestone.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[...active, ...defeated].map((battle) => (
            <BossCard key={battle.id} battle={battle} />
          ))}
        </div>
      )}
    </div>
  );
}
