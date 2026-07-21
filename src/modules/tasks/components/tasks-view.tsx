"use client";

import { ListChecks } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskItem } from "@/modules/tasks/components/task-item";
import { TaskCreateDialog } from "@/modules/tasks/components/task-create-dialog";

export function TasksView() {
  const tasks = trpc.tasks.list.useQuery();

  if (tasks.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const all = tasks.data ?? [];
  const todo = all.filter((t) => t.status === "todo");
  const done = all.filter((t) => t.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {todo.length} active · {done.length} completed
        </p>
        <TaskCreateDialog />
      </div>

      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <ListChecks className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No tasks yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first task and earn XP when you complete it.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-2">
            {todo.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                All caught up! 🎉
              </p>
            ) : (
              todo.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </section>

          {done.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed
              </h2>
              {done.slice(0, 20).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
