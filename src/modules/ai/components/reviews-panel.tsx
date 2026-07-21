"use client";

import * as React from "react";
import { Loader2, Sparkles, Trophy, TriangleAlert, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Period = "weekly" | "monthly";

export function ReviewsPanel() {
  const [period, setPeriod] = React.useState<Period>("weekly");
  const utils = trpc.useUtils();
  const latest = trpc.ai.reviews.latest.useQuery({ period });

  const generate = trpc.ai.reviews.generate.useMutation({
    onSuccess: () => {
      toast.success("Review generated.");
      void utils.ai.reviews.latest.invalidate({ period });
    },
    onError: (e) => toast.error(e.message || "Could not generate the review."),
  });

  const review = latest.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          size="sm"
          onClick={() => generate.mutate({ period })}
          disabled={generate.isPending}
        >
          {generate.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {review ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {latest.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !review ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No {period} review yet</p>
          <p className="text-sm text-muted-foreground">
            Generate an AI review of your {period} progress.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">Summary</CardTitle>
                <CardDescription>
                  {period === "weekly" ? "This week" : "This month"} ·{" "}
                  {review.stats.xpEarned} XP earned
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-xp">
                  {review.productivityScore}
                </p>
                <p className="text-xs text-muted-foreground">productivity</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{review.summary}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <ReviewList
              title="Wins"
              icon={<Trophy className="size-4 text-xp" />}
              items={review.wins}
            />
            <ReviewList
              title="Challenges"
              icon={<TriangleAlert className="size-4 text-warning" />}
              items={review.challenges}
            />
            <ReviewList
              title="Suggestions"
              icon={<Lightbulb className="size-4 text-info" />}
              items={review.suggestions}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
