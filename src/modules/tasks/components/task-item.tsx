"use client";

import { Trash2, Loader2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import type { TaskPriority, TaskView } from "@/modules/tasks/types";

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "text-muted-foreground border-border",
  medium: "text-info border-info/40",
  high: "text-destructive border-destructive/40",
};

export function TaskItem({ task }: { task: TaskView }) {
  const utils = trpc.useUtils();

  const invalidate = () => {
    void utils.tasks.list.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
    void utils.gamification.achievements.invalidate();
  };

  const complete = trpc.tasks.complete.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: `Completed: ${task.title}` });
      invalidate();
    },
    onError: () => toast.error("Could not complete the task."),
  });

  const reopen = trpc.tasks.reopen.useMutation({ onSuccess: invalidate });
  const remove = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted.");
      invalidate();
    },
  });

  const done = task.status === "done";
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = due && !done && isPast(due) && !isToday(due);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Checkbox
        checked={done}
        disabled={complete.isPending || reopen.isPending}
        onCheckedChange={(checked) => {
          if (checked) complete.mutate({ id: task.id });
          else reopen.mutate({ id: task.id });
        }}
        className="size-5"
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("h-5 px-1.5 text-[10px]", PRIORITY_STYLE[task.priority])}
          >
            {task.priority}
          </Badge>
          {task.skillName && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {task.skillName}
            </Badge>
          )}
          {due && (
            <span
              className={cn(
                "text-[11px]",
                overdue ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {isToday(due) ? "Today" : format(due, "MMM d")}
            </span>
          )}
          <span className="text-[11px] text-xp">+{task.xpReward} XP</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground"
        disabled={remove.isPending}
        onClick={() => remove.mutate({ id: task.id })}
        aria-label="Delete task"
      >
        {remove.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
    </div>
  );
}
