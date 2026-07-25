"use client";

import * as React from "react";
import {
  FolderKanban,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import {
  PROJECT_STATUSES,
  type ProjectStatus,
  type ProjectView,
} from "@/modules/projects/types";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  idea: "text-muted-foreground",
  building: "text-info",
  shipped: "text-success",
  paused: "text-warning",
};

export function ProjectsView() {
  const list = trpc.projects.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {(list.data ?? []).length} project
          {(list.data ?? []).length === 1 ? "" : "s"}
        </p>
        <CreateProject />
      </div>

      {list.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (list.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <FolderKanban className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            Add a project and earn {60} XP when you ship it.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(list.data ?? []).map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectView }) {
  const utils = trpc.useUtils();
  const invalidate = () => {
    void utils.projects.list.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
  };

  const setStatus = trpc.projects.setStatus.useMutation({
    onSuccess: (result) => {
      if (result.award) {
        toast.success(`Shipped: ${result.project.title} 🚀`);
        showAwardToasts(result.award);
      }
      invalidate();
    },
    onError: () => toast.error("Could not update status."),
  });

  const remove = trpc.projects.delete.useMutation({ onSuccess: invalidate });

  return (
    <div className="flex flex-col rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{project.title}</p>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ id: project.id })}
          aria-label="Delete project"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {project.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {project.description}
        </p>
      )}

      {project.techStack.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {project.techStack.map((t) => (
            <Badge key={t} variant="secondary" className="h-5 px-1.5 text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Live URL"
          >
            <ExternalLink className="size-4" />
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Repository"
          >
            <GitBranch className="size-4" />
          </a>
        )}
      </div>

      <div className="mt-auto pt-3">
        <Select
          value={project.status}
          onValueChange={(v) =>
            setStatus.mutate({ id: project.id, status: v as ProjectStatus })
          }
        >
          <SelectTrigger
            className={cn("w-full capitalize", STATUS_STYLE[project.status])}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CreateProject() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tech, setTech] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [repoUrl, setRepoUrl] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatus>("building");

  const utils = trpc.useUtils();
  const create = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Project added.");
      setTitle("");
      setDescription("");
      setTech("");
      setUrl("");
      setRepoUrl("");
      setStatus("building");
      setOpen(false);
      void utils.projects.list.invalidate();
    },
    onError: () => toast.error("Could not create the project."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({
              title: title.trim(),
              description: description.trim() || null,
              status,
              techStack: tech
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              url: url.trim() || null,
              repoUrl: repoUrl.trim() || null,
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="p-title">Title</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="p-tech">Tech stack (comma separated)</Label>
            <Input
              id="p-tech"
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              placeholder="Next.js, MongoDB, tRPC"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="p-url">Live URL</Label>
              <Input
                id="p-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-repo">Repo URL</Label>
              <Input
                id="p-repo"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ProjectStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Add project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
