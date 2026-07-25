"use client";

import * as React from "react";
import {
  BookOpen,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import type { LearningItemView, LearningStatus } from "@/modules/learning/types";

const STATUS_STYLE: Record<LearningStatus, string> = {
  planned: "text-muted-foreground",
  "in-progress": "text-info",
  completed: "text-success",
};

export function LearningView() {
  const list = trpc.learning.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {(list.data ?? []).filter((i) => i.status === "completed").length}{" "}
          completed · {(list.data ?? []).length} total
        </p>
        <CreateLearning />
      </div>

      {list.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (list.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Nothing here yet</p>
          <p className="text-sm text-muted-foreground">
            Add a course or resource and track your progress.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(list.data ?? []).map((item) => (
            <LearningCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function LearningCard({ item }: { item: LearningItemView }) {
  const utils = trpc.useUtils();
  const invalidate = () => {
    void utils.learning.list.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
  };

  const setProgress = trpc.learning.setProgress.useMutation({
    onSuccess: (result) => {
      if (result.award) {
        toast.success(`Completed: ${result.item.title} 🎓`);
        showAwardToasts(result.award);
      }
      invalidate();
    },
    onError: () => toast.error("Could not update progress."),
  });
  const remove = trpc.learning.delete.useMutation({ onSuccess: invalidate });

  const bump = (delta: number) =>
    setProgress.mutate({
      id: item.id,
      progress: Math.max(0, Math.min(100, item.progress + delta)),
    });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{item.title}</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            {item.provider && (
              <span className="text-muted-foreground">{item.provider}</span>
            )}
            <Badge
              variant="outline"
              className={cn("h-5 px-1.5 text-[10px] capitalize", STATUS_STYLE[item.status])}
            >
              {item.status}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ id: item.id })}
          aria-label="Delete"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{item.progress}%</span>
        </div>
        <Progress value={item.progress} className="h-2" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={setProgress.isPending || item.progress <= 0}
          onClick={() => bump(-10)}
        >
          <Minus className="size-4" />
          10%
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={setProgress.isPending || item.progress >= 100}
          onClick={() => bump(10)}
        >
          <Plus className="size-4" />
          10%
        </Button>
        {item.progress < 100 && (
          <Button
            size="sm"
            className="ml-auto"
            disabled={setProgress.isPending}
            onClick={() => setProgress.mutate({ id: item.id, progress: 100 })}
          >
            {setProgress.isPending && <Loader2 className="size-4 animate-spin" />}
            Mark complete
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateLearning() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [provider, setProvider] = React.useState("");
  const [url, setUrl] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.learning.create.useMutation({
    onSuccess: () => {
      toast.success("Added.");
      setTitle("");
      setProvider("");
      setUrl("");
      setOpen(false);
      void utils.learning.list.invalidate();
    },
    onError: () => toast.error("Could not add the item."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New learning item</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({
              title: title.trim(),
              provider: provider.trim() || null,
              url: url.trim() || null,
            });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Course or topic (e.g. Advanced React)"
            autoFocus
            required
          />
          <div className="space-y-1">
            <Label htmlFor="l-provider" className="text-xs text-muted-foreground">
              Provider (optional)
            </Label>
            <Input
              id="l-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. Udemy, YouTube"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="l-url" className="text-xs text-muted-foreground">
              URL (optional)
            </Label>
            <Input
              id="l-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending || !title.trim()}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
