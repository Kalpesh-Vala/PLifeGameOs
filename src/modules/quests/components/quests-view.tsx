"use client";

import { Swords } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuestCard } from "@/modules/quests/components/quest-card";
import type { QuestPeriod } from "@/modules/quests/lib/definitions";

function Board({ period }: { period: QuestPeriod }) {
  const board = trpc.quests.board.useQuery({ period });

  if (board.isLoading || !board.data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    );
  }

  if (board.data.quests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <Swords className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No quests available.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {board.data.quests.map((quest) => (
        <QuestCard key={quest.defId} quest={quest} period={period} />
      ))}
    </div>
  );
}

export function QuestsView() {
  return (
    <Tabs defaultValue="daily">
      <TabsList>
        <TabsTrigger value="daily">Daily Quests</TabsTrigger>
        <TabsTrigger value="weekly">Weekly Missions</TabsTrigger>
      </TabsList>
      <TabsContent value="daily" className="mt-4">
        <Board period="daily" />
      </TabsContent>
      <TabsContent value="weekly" className="mt-4">
        <Board period="weekly" />
      </TabsContent>
    </Tabs>
  );
}
