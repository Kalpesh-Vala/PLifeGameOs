"use client";

import * as React from "react";
import { GraduationCap, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import {
  INTERVIEW_CATEGORIES,
  INTERVIEW_STATUSES,
  type InterviewCategory,
  type InterviewStatus,
  type InterviewTopicView,
} from "@/modules/interview/types";

const STATUS_STYLE: Record<InterviewStatus, string> = {
  todo: "text-muted-foreground",
  learning: "text-info",
  confident: "text-success",
};

export function InterviewView() {
  const stats = trpc.interview.stats.useQuery();
  const list = trpc.interview.list.useQuery();

  return (
    <div className="space-y-4">
      {stats.isLoading || !stats.data ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Interview readiness</CardTitle>
              <CardDescription>
                {stats.data.confident} confident · {stats.data.learning}{" "}
                learning · {stats.data.todo} to do
              </CardDescription>
            </div>
            <p className="text-3xl font-bold text-xp">{stats.data.readiness}%</p>
          </CardHeader>
          <CardContent>
            <Progress value={stats.data.readiness} className="h-2" />
          </CardContent>
        </Card>
      )}

      <AddTopic />

      <TopicList topics={list.data ?? []} loading={list.isLoading} />
    </div>
  );
}

function AddTopic() {
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<InterviewCategory>("DSA");

  const utils = trpc.useUtils();
  const create = trpc.interview.create.useMutation({
    onSuccess: () => {
      toast.success("Topic added.");
      setTitle("");
      void utils.interview.list.invalidate();
      void utils.interview.stats.invalidate();
    },
    onError: () => toast.error("Could not add the topic."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add a prep topic</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({ title: title.trim(), category });
          }}
        >
          <div className="min-w-40 flex-1 space-y-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sliding window, Consistent hashing"
              required
            />
          </div>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as InterviewCategory)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TopicList({
  topics,
  loading,
}: {
  topics: InterviewTopicView[];
  loading: boolean;
}) {
  const utils = trpc.useUtils();
  const invalidate = () => {
    void utils.interview.list.invalidate();
    void utils.interview.stats.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
  };

  const setStatus = trpc.interview.setStatus.useMutation({
    onSuccess: (result) => {
      if (result.award) showAwardToasts(result.award, { description: result.topic.title });
      invalidate();
    },
    onError: () => toast.error("Could not update status."),
  });

  const remove = trpc.interview.delete.useMutation({ onSuccess: invalidate });

  if (loading) return <Skeleton className="h-40 rounded-xl" />;
  if (topics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <GraduationCap className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No prep topics yet. Add what you need to master.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="py-2">
        <ul className="divide-y">
          {topics.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.category}</p>
              </div>
              <Select
                value={t.status}
                onValueChange={(v) =>
                  setStatus.mutate({ id: t.id, status: v as InterviewStatus })
                }
              >
                <SelectTrigger
                  className={cn("w-32 capitalize", STATUS_STYLE[t.status])}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: t.id })}
                aria-label="Delete topic"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
