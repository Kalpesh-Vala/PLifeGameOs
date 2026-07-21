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

const NO_SKILL = "__none__";

export function HabitCreateDialog() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [skillId, setSkillId] = React.useState<string>(NO_SKILL);

  const utils = trpc.useUtils();
  const create = trpc.habits.create.useMutation({
    onSuccess: () => {
      void utils.habits.list.invalidate();
      toast.success("Habit created.");
      setTitle("");
      setNotes("");
      setSkillId(NO_SKILL);
      setOpen(false);
    },
    onError: () => toast.error("Could not create the habit."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate({
      title: title.trim(),
      notes: notes.trim() || undefined,
      skillId: skillId === NO_SKILL ? null : skillId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New habit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-title">Habit</Label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read for 20 minutes"
              autoFocus
              required
            />
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
            <Label htmlFor="habit-notes">Notes (optional)</Label>
            <Textarea
              id="habit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Create habit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
