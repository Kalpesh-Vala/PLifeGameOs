"use client";

import * as React from "react";
import { Plus, Loader2, X } from "lucide-react";
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

export function BossCreateDialog() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [milestones, setMilestones] = React.useState<string[]>([""]);
  const [skillId, setSkillId] = React.useState<string>(NO_SKILL);
  const [deadline, setDeadline] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.boss.create.useMutation({
    onSuccess: () => {
      void utils.boss.list.invalidate();
      toast.success("Boss battle created. Go defeat it! ⚔️");
      setTitle("");
      setDescription("");
      setMilestones([""]);
      setSkillId(NO_SKILL);
      setDeadline("");
      setOpen(false);
    },
    onError: () => toast.error("Could not create the boss battle."),
  });

  const setMilestone = (i: number, value: string) =>
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? value : m)));
  const addMilestone = () => setMilestones((prev) => [...prev, ""]);
  const removeMilestone = (i: number) =>
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = milestones.map((m) => m.trim()).filter(Boolean);
    if (!title.trim() || cleaned.length === 0) {
      toast.error("Add a title and at least one milestone.");
      return;
    }
    create.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      milestones: cleaned,
      skillId: skillId === NO_SKILL ? null : skillId,
      deadline: deadline ? new Date(deadline) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New boss battle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New boss battle</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="boss-title">Goal</Label>
            <Input
              id="boss-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Crack the Google interview"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boss-desc">Description (optional)</Label>
            <Textarea
              id="boss-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Milestones</Label>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={m}
                    onChange={(e) => setMilestone(i, e.target.value)}
                    placeholder={`Milestone ${i + 1}`}
                  />
                  {milestones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() => removeMilestone(i)}
                      aria-label="Remove milestone"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMilestone}
            >
              <Plus className="size-4" />
              Add milestone
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Skill (optional)</Label>
              <Select value={skillId} onValueChange={setSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Skill" />
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
              <Label htmlFor="boss-deadline">Deadline (optional)</Label>
              <Input
                id="boss-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Create battle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
