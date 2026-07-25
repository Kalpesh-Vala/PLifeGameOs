"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DIFFICULTY_DEFAULTS,
  WEEKDAY_LABELS,
  type Difficulty,
  type Priority,
  type Recurrence,
} from "@/modules/habits/lib/rules";
import type { HabitView } from "@/modules/habits/types";

const NO_SKILL = "__none__";

export function HabitFormDialog({
  habit,
  trigger,
}: {
  habit?: HabitView;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState(habit?.title ?? "");
  const [skillId, setSkillId] = React.useState(habit?.skillId ?? NO_SKILL);
  const [recurrence, setRecurrence] = React.useState<Recurrence>(
    habit?.recurrence ?? "daily",
  );
  const [weeklyDays, setWeeklyDays] = React.useState<number[]>(
    habit?.weeklyDays ?? [1, 2, 3, 4, 5],
  );
  const [scheduledTime, setScheduledTime] = React.useState(
    habit?.scheduledTime ?? "",
  );
  const [grace, setGrace] = React.useState(String(habit?.gracePeriodMin ?? 30));
  const [difficulty, setDifficulty] = React.useState<Difficulty>(
    habit?.difficulty ?? "medium",
  );
  const [priority, setPriority] = React.useState<Priority>(
    habit?.priority ?? "medium",
  );
  const [xpReward, setXpReward] = React.useState(String(habit?.xpReward ?? 20));
  const [penaltyXp, setPenaltyXp] = React.useState(
    String(habit?.penaltyXp ?? 10),
  );
  const [penaltyCoins, setPenaltyCoins] = React.useState(
    String(habit?.penaltyCoins ?? 1),
  );

  const utils = trpc.useUtils();
  const invalidate = () => {
    void utils.habits.list.invalidate();
    void utils.habits.stats.invalidate();
  };

  const create = trpc.habits.create.useMutation({
    onSuccess: () => {
      toast.success("Habit created.");
      setOpen(false);
      invalidate();
    },
    onError: () => toast.error("Could not save the habit."),
  });
  const update = trpc.habits.update.useMutation({
    onSuccess: () => {
      toast.success("Habit updated.");
      setOpen(false);
      invalidate();
    },
    onError: () => toast.error("Could not update the habit."),
  });

  const onDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    setXpReward(String(DIFFICULTY_DEFAULTS[d].xp));
    setPenaltyXp(String(DIFFICULTY_DEFAULTS[d].penalty));
  };

  const toggleDay = (d: number) =>
    setWeeklyDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );

  const pending = create.isPending || update.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      skillId: skillId === NO_SKILL ? null : skillId,
      recurrence,
      weeklyDays: recurrence === "weekly" ? weeklyDays : [],
      scheduledTime: scheduledTime || null,
      gracePeriodMin: Number(grace) || 0,
      difficulty,
      priority,
      xpReward: Number(xpReward) || 0,
      penaltyXp: Number(penaltyXp) || 0,
      penaltyCoins: Number(penaltyCoins) || 0,
    };
    if (habit) update.mutate({ id: habit.id, ...payload });
    else create.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            New habit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="h-title">Habit</Label>
            <Input
              id="h-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wake up, Workout, Study DSA"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="h-time" className="text-xs text-muted-foreground">
                Scheduled time
              </Label>
              <Input
                id="h-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Leave empty for an anytime habit.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-grace" className="text-xs text-muted-foreground">
                Grace period (min)
              </Label>
              <Input
                id="h-grace"
                type="number"
                min={0}
                value={grace}
                onChange={(e) => setGrace(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Partial credit window after the deadline.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Recurrence</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={recurrence === "daily" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setRecurrence("daily")}
              >
                Daily
              </Button>
              <Button
                type="button"
                variant={recurrence === "weekly" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setRecurrence("weekly")}
              >
                Weekly
              </Button>
            </div>
            {recurrence === "weekly" && (
              <div className="flex gap-1 pt-1">
                {WEEKDAY_LABELS.map((label, d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "size-8 rounded-md border text-xs transition-colors",
                      weeklyDays.includes(d)
                        ? "border-primary bg-accent font-medium"
                        : "hover:bg-accent/50",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => onDifficulty(v as Difficulty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">XP reward</Label>
              <Input
                type="number"
                min={0}
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">XP penalty</Label>
              <Input
                type="number"
                min={0}
                value={penaltyXp}
                onChange={(e) => setPenaltyXp(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Coin penalty</Label>
              <Input
                type="number"
                min={0}
                value={penaltyCoins}
                onChange={(e) => setPenaltyCoins(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Skill (optional)</Label>
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

          <DialogFooter>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {habit ? "Save changes" : "Create habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
