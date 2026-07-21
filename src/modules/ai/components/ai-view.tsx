"use client";

import { Sparkles, KeyRound } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AiChat } from "@/modules/ai/components/ai-chat";
import { ReviewsPanel } from "@/modules/ai/components/reviews-panel";

export function AiView() {
  const status = trpc.ai.status.useQuery();

  if (status.isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  if (!status.data?.configured) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <KeyRound className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">AI is not configured</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Add a{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              GITHUB_MODELS_TOKEN
            </code>{" "}
            (a GitHub PAT with the <strong>Models: read</strong> permission) to
            your <code className="font-mono text-xs">.env.local</code> and
            restart the app to unlock your AI coach.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="chat">
      <TabsList>
        <TabsTrigger value="chat">
          <Sparkles className="size-4" />
          Chat
        </TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      <TabsContent value="chat" className="mt-4">
        <AiChat />
      </TabsContent>
      <TabsContent value="reviews" className="mt-4">
        <ReviewsPanel />
      </TabsContent>
    </Tabs>
  );
}
