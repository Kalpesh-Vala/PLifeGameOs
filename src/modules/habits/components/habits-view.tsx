"use client";

import { Repeat } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitItem } from "@/modules/habits/components/habit-item";
import { HabitCreateDialog } from "@/modules/habits/components/habit-create-dialog";

export function HabitsView() {
  const habits = trpc.habits.list.useQuery();

  if (habits.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  const all = habits.data ?? [];
  const doneToday = all.filter((h) => h.completedToday).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {doneToday}/{all.length} done today
        </p>
        <HabitCreateDialog />
      </div>

      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Repeat className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No habits yet</p>
          <p className="text-sm text-muted-foreground">
            Build consistency — create a habit and keep the streak alive.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map((habit) => (
            <HabitItem key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  );
}
