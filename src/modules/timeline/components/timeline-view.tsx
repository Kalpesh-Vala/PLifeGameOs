"use client";

import * as React from "react";
import { Loader2, Trash2, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { dateKey } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicIcon } from "@/components/dynamic-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import {
  TIMELINE_CATEGORIES,
  getTimelineCategory,
  type TimelineCategory,
} from "@/modules/timeline/lib/categories";
import type { TimelineEventView } from "@/modules/timeline/types";

export function TimelineView() {
  const [date, setDate] = React.useState(() => dateKey());
  const events = trpc.timeline.byDate.useQuery({ date });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={date}
          max={dateKey()}
          onChange={(e) => setDate(e.target.value || dateKey())}
          className="w-auto"
        />
        {date !== dateKey() && (
          <Button variant="ghost" size="sm" onClick={() => setDate(dateKey())}>
            Today
          </Button>
        )}
      </div>

      <TimelineForm date={date} />

      {events.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : (events.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <Clock className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No events logged for this day yet.
          </p>
        </div>
      ) : (
        <ol className="space-y-1">
          {(events.data ?? []).map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </ol>
      )}
    </div>
  );
}

function TimelineForm({ date }: { date: string }) {
  const [time, setTime] = React.useState(() => format(new Date(), "HH:mm"));
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<TimelineCategory>("work");

  const utils = trpc.useUtils();
  const create = trpc.timeline.create.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: "Day logged" });
      setTitle("");
      void utils.timeline.byDate.invalidate({ date });
      void utils.gamification.profile.invalidate();
      void utils.gamification.recentActivity.invalidate();
    },
    onError: () => toast.error("Could not add the event."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate({ date, time, title: title.trim(), category });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-3"
    >
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Time</Label>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-28"
        />
      </div>
      <div className="min-w-40 flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">Event</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Gym session"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Category</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as TimelineCategory)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMELINE_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={create.isPending || !title.trim()}>
        {create.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Add
      </Button>
    </form>
  );
}

function TimelineItem({ event }: { event: TimelineEventView }) {
  const utils = trpc.useUtils();
  const remove = trpc.timeline.delete.useMutation({
    onSuccess: () => {
      void utils.timeline.byDate.invalidate({ date: event.date });
      toast.success("Event removed.");
    },
  });
  const meta = getTimelineCategory(event.category);

  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/40">
      <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
        {event.time}
      </span>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border bg-card",
          meta?.color,
        )}
      >
        <DynamicIcon name={meta?.icon ?? "Circle"} className="size-4" />
      </div>
      <span className="flex-1 text-sm">{event.title}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
        disabled={remove.isPending}
        onClick={() => remove.mutate({ id: event.id })}
        aria-label="Remove event"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}
