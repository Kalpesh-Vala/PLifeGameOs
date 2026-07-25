"use client";

import * as React from "react";
import {
  Dumbbell,
  Droplet,
  Loader2,
  Plus,
  Trash2,
  Moon,
  Scale,
  Flame,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  WORKOUT_TYPES,
  WATER_GOAL_ML,
  WATER_STEP_ML,
  type WorkoutType,
} from "@/modules/fitness/types";

export function FitnessView() {
  const today = trpc.fitness.today.useQuery();
  const weight = trpc.fitness.weightTrend.useQuery();

  if (today.isLoading || !today.data) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <WaterCard waterMl={today.data.day.waterMl} />
        <WorkoutAdd />
      </div>
      <MetricsCard
        weightKg={today.data.day.weightKg}
        sleepHours={today.data.day.sleepHours}
        calories={today.data.day.calories}
      />
      <WeightTrendCard points={weight.data ?? []} />
      <WorkoutList workouts={today.data.workouts} />
    </div>
  );
}

function WaterCard({ waterMl }: { waterMl: number }) {
  const utils = trpc.useUtils();
  const mutate = trpc.fitness.addWater.useMutation({
    onSuccess: () => void utils.fitness.today.invalidate(),
  });
  const pct = Math.min(100, Math.round((waterMl / WATER_GOAL_ML) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Droplet className="size-4 text-info" />
          Water
        </CardTitle>
        <CardDescription>
          {waterMl} / {WATER_GOAL_ML} ml
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={mutate.isPending}
            onClick={() => mutate.mutate({ deltaMl: WATER_STEP_ML })}
          >
            <Plus className="size-4" />
            {WATER_STEP_ML} ml
          </Button>
          <Button
            variant="ghost"
            disabled={mutate.isPending || waterMl <= 0}
            onClick={() => mutate.mutate({ deltaMl: -WATER_STEP_ML })}
          >
            Undo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutAdd() {
  const [type, setType] = React.useState<WorkoutType>("Strength");
  const [duration, setDuration] = React.useState("30");

  const utils = trpc.useUtils();
  const add = trpc.fitness.addWorkout.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: `${type} workout logged` });
      void utils.fitness.today.invalidate();
      void utils.fitness.recentWorkouts.invalidate();
      void utils.gamification.profile.invalidate();
      void utils.gamification.recentActivity.invalidate();
    },
    onError: () => toast.error("Could not log the workout."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dumbbell className="size-4 text-success" />
          Log a workout
        </CardTitle>
        <CardDescription>Earn {20} XP per workout.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const min = Number(duration);
            if (!min || min < 1) return;
            add.mutate({ type, durationMin: min });
          }}
        >
          <div className="min-w-32 flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as WorkoutType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24 space-y-1">
            <Label className="text-xs text-muted-foreground">Minutes</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={add.isPending}>
            {add.isPending ? (
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

function MetricsCard({
  weightKg,
  sleepHours,
  calories,
}: {
  weightKg: number | null;
  sleepHours: number | null;
  calories: number | null;
}) {
  const [weight, setWeight] = React.useState(weightKg?.toString() ?? "");
  const [sleep, setSleep] = React.useState(sleepHours?.toString() ?? "");
  const [cals, setCals] = React.useState(calories?.toString() ?? "");

  const utils = trpc.useUtils();
  const save = trpc.fitness.saveMetrics.useMutation({
    onSuccess: () => {
      toast.success("Metrics saved.");
      void utils.fitness.today.invalidate();
      void utils.fitness.weightTrend.invalidate();
    },
    onError: () => toast.error("Could not save metrics."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              weightKg: weight ? Number(weight) : null,
              sleepHours: sleep ? Number(sleep) : null,
              calories: cals ? Number(cals) : null,
            });
          }}
        >
          <Field icon={<Scale className="size-4" />} label="Weight (kg)">
            <Input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="—"
            />
          </Field>
          <Field icon={<Moon className="size-4" />} label="Sleep (hrs)">
            <Input
              type="number"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              placeholder="—"
            />
          </Field>
          <Field icon={<Flame className="size-4" />} label="Calories">
            <Input
              type="number"
              value={cals}
              onChange={(e) => setCals(e.target.value)}
              placeholder="—"
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={save.isPending} className="w-full">
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Save metrics
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

function WeightTrendCard({
  points,
}: {
  points: { date: string; weightKg: number }[];
}) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Weight trend</CardTitle>
          <CardDescription>Latest {points.length} logs</CardDescription>
        </div>
        <p className="text-2xl font-semibold">
          {values[values.length - 1]}
          <span className="text-sm text-muted-foreground"> kg</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex h-24 items-end gap-1">
          {points.map((p) => (
            <div
              key={p.date}
              className="flex-1"
              title={`${p.date} · ${p.weightKg} kg`}
            >
              <div
                className="rounded-sm bg-xp"
                style={{
                  height: `${20 + ((p.weightKg - min) / range) * 80}%`,
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutList({
  workouts,
}: {
  workouts: {
    id: string;
    type: string;
    durationMin: number;
    createdAt: string;
  }[];
}) {
  const utils = trpc.useUtils();
  const remove = trpc.fitness.deleteWorkout.useMutation({
    onSuccess: () => {
      void utils.fitness.today.invalidate();
      void utils.fitness.recentWorkouts.invalidate();
    },
  });

  if (workouts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s workouts</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {workouts.map((w) => (
            <li
              key={w.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-success/15 text-success">
                <Dumbbell className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{w.type}</p>
                <p className="text-xs text-muted-foreground">
                  {w.durationMin} min · {format(new Date(w.createdAt), "h:mm a")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: w.id })}
                aria-label="Delete workout"
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
