"use client";

import * as React from "react";
import { Map, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { RoadmapView } from "@/modules/roadmaps/types";

export function RoadmapsView() {
  const list = trpc.roadmaps.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {(list.data ?? []).length} roadmap
          {(list.data ?? []).length === 1 ? "" : "s"}
        </p>
        <CreateRoadmap />
      </div>

      {list.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : (list.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Map className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No roadmaps yet</p>
          <p className="text-sm text-muted-foreground">
            Break a learning path into steps and check them off.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {(list.data ?? []).map((r) => (
            <RoadmapCard key={r.id} roadmap={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapCard({ roadmap }: { roadmap: RoadmapView }) {
  const utils = trpc.useUtils();
  const invalidate = () => {
    void utils.roadmaps.list.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
  };

  const toggle = trpc.roadmaps.toggleStep.useMutation({
    onSuccess: (r) => {
      if (r.award) showAwardToasts(r.award);
      invalidate();
    },
  });
  const remove = trpc.roadmaps.delete.useMutation({ onSuccess: invalidate });

  const complete = roadmap.progressPct >= 100;

  return (
    <div className={cn("rounded-xl border bg-card p-5", complete && "border-xp/40")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{roadmap.title}</p>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {roadmap.category}
            </Badge>
          </div>
          {roadmap.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {roadmap.description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ id: roadmap.id })}
          aria-label="Delete roadmap"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {roadmap.doneSteps} / {roadmap.totalSteps} steps
          </span>
          <span>{roadmap.progressPct}%</span>
        </div>
        <Progress value={roadmap.progressPct} className="h-2" />
      </div>

      <ul className="mt-4 space-y-2">
        {roadmap.steps.map((s) => (
          <li key={s.id} className="flex items-center gap-2.5">
            <Checkbox
              checked={s.done}
              disabled={toggle.isPending}
              onCheckedChange={() =>
                toggle.mutate({ roadmapId: roadmap.id, stepId: s.id })
              }
            />
            <span
              className={cn(
                "text-sm",
                s.done && "text-muted-foreground line-through",
              )}
            >
              {s.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateRoadmap() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [steps, setSteps] = React.useState<string[]>(["", "", ""]);

  const utils = trpc.useUtils();
  const create = trpc.roadmaps.create.useMutation({
    onSuccess: () => {
      toast.success("Roadmap created.");
      setTitle("");
      setDescription("");
      setCategory("");
      setSteps(["", "", ""]);
      setOpen(false);
      void utils.roadmaps.list.invalidate();
    },
    onError: () => toast.error("Could not create the roadmap."),
  });

  const setStep = (i: number, v: string) =>
    setSteps((p) => p.map((s, idx) => (idx === i ? v : s)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New roadmap
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New roadmap</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const cleaned = steps.map((s) => s.trim()).filter(Boolean);
            if (!title.trim() || cleaned.length === 0) {
              toast.error("Add a title and at least one step.");
              return;
            }
            create.mutate({
              title: title.trim(),
              description: description.trim() || null,
              category: category.trim() || "General",
              steps: cleaned,
            });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Roadmap title (e.g. Backend Mastery)"
            autoFocus
            required
          />
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Backend)"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          <div className="space-y-2">
            <Label>Steps</Label>
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={s}
                  onChange={(e) => setStep(i, e.target.value)}
                  placeholder={`Step ${i + 1}`}
                />
                {steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={() =>
                      setSteps((p) => p.filter((_, idx) => idx !== i))
                    }
                    aria-label="Remove step"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSteps((p) => [...p, ""])}
            >
              <Plus className="size-4" />
              Add step
            </Button>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Create roadmap
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
