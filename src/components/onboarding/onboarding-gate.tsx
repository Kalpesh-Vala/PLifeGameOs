"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Target,
  CalendarClock,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QUICK_STARTS = [
  {
    href: "/habits",
    icon: CalendarClock,
    title: "Build a habit",
    desc: "Set a scheduled habit and earn XP for staying disciplined.",
  },
  {
    href: "/quests",
    icon: Target,
    title: "Take on a quest",
    desc: "Turn goals into daily and weekly quests with rewards.",
  },
  {
    href: "/tasks",
    icon: ListChecks,
    title: "Add a task",
    desc: "Capture what needs doing and level up as you complete them.",
  },
];

export function OnboardingGate() {
  const settings = trpc.settings.get.useQuery();
  const profile = trpc.gamification.profile.useQuery();
  const utils = trpc.useUtils();
  const router = useRouter();

  const [dismissed, setDismissed] = React.useState(false);
  const [name, setName] = React.useState("");

  const complete = trpc.settings.completeOnboarding.useMutation({
    onSuccess: () => {
      void utils.settings.get.invalidate();
    },
  });

  const isNewUser =
    !!settings.data &&
    !!profile.data &&
    settings.data.onboardedAt === null &&
    profile.data.totalXp === 0 &&
    profile.data.checkInCount === 0;

  const open = isNewUser && !dismissed;

  function finish(navigateTo?: string) {
    const displayName = name.trim() ? name.trim() : undefined;
    complete.mutate(displayName ? { displayName } : undefined);
    setDismissed(true);
    if (navigateTo) router.push(navigateTo);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) finish();
      }}
    >
      <DialogContent className="max-h-[90dvh] gap-4 overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader className="min-w-0">
          <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <DialogTitle className="text-xl">Welcome to Life OS</DialogTitle>
          <DialogDescription>
            Your gamified second brain. Turn everyday actions into XP, levels,
            streaks, and achievements. Let&apos;s get you started.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="onboarding-name">What should we call you?</Label>
            <Input
              id="onboarding-name"
              placeholder="Your display name (optional)"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pick a first move
            </p>
            <div className="grid gap-2">
              {QUICK_STARTS.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.href}
                    type="button"
                    onClick={() => finish(q.href)}
                    className="group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.desc}
                      </p>
                    </div>
                    <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground transition-opacity group-hover:opacity-100 sm:block sm:opacity-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => finish()}
          >
            Skip for now
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => finish()}>
            Start exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
