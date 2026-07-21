"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { SKILLS } from "@/modules/gamification/lib/skills";
import type { TaskPriority } from "@/modules/tasks/types";

const NO_SKILL = "__none__";

export function TaskCreateDialog() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [skillId, setSkillId] = React.useState<string>(NO_SKILL);
  const [dueDate, setDueDate] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.tasks.create.useMutation({
    onSuccess: () => {
      void utils.tasks.list.invalidate();
      toast.success("Task added.");
      setTitle("");
      setNotes("");
      setPriority("medium");
      setSkillId(NO_SKILL);
      setDueDate("");
      setOpen(false);
    },
    onError: () => toast.error("Could not create the task."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate({
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      skillId: skillId === NO_SKILL ? null : skillId,
      dueDate: dueDate ? new Date(dueDate) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low · +10 XP</SelectItem>
                  <SelectItem value="medium">Medium · +20 XP</SelectItem>
                  <SelectItem value="high">High · +40 XP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skill (optional)</Label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger>
                <SelectValue placeholder="Link a skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SKILL}>No skill</SelectItem>
                {SKILLS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-notes">Notes (optional)</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details…"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Add task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
