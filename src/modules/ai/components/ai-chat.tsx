"use client";

import * as React from "react";
import { Send, Loader2, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export function AiChat() {
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const history = trpc.ai.chat.history.useQuery();

  const send = trpc.ai.chat.send.useMutation({
    onSuccess: () => {
      void utils.ai.chat.history.invalidate();
    },
    onError: (e) => toast.error(e.message || "The assistant is unavailable."),
    onSettled: () => setPending(null),
  });

  const nudge = trpc.ai.nudge.useMutation({
    onSuccess: (text) => toast(text, { icon: <Wand2 className="size-4" />, duration: 8000 }),
    onError: () => toast.error("Could not fetch a nudge right now."),
  });

  const clear = trpc.ai.chat.clear.useMutation({
    onSuccess: () => {
      toast.success("Conversation cleared.");
      void utils.ai.chat.history.invalidate();
    },
  });

  const messages = history.data ?? [];

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, pending, send.isPending]);

  const submit = () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    setInput("");
    setPending(text);
    send.mutate({ message: text });
  };

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-medium">Life OS Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nudge.mutate()}
            disabled={nudge.isPending}
          >
            {nudge.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
            Nudge me
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={() => clear.mutate()}
              aria-label="Clear conversation"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {history.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4 rounded-lg" />
            <Skeleton className="ml-auto h-12 w-1/2 rounded-lg" />
          </div>
        ) : messages.length === 0 && !pending ? (
          <EmptyState />
        ) : (
          messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))
        )}
        {pending && <Bubble role="user" content={pending} />}
        {send.isPending && <TypingBubble />}
      </div>

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask your coach anything… (Enter to send)"
            rows={1}
            className="max-h-32 min-h-10 resize-none"
          />
          <Button
            size="icon"
            className="size-10 shrink-0"
            onClick={submit}
            disabled={!input.trim() || send.isPending}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  const prompts = [
    "How am I doing this week?",
    "What should I focus on today?",
    "Help me plan my interview prep.",
    "Why do I keep skipping my habits?",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Sparkles className="size-8 text-primary" />
      <p className="mt-3 font-medium">Your AI life coach</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        I can see your tasks, habits, streaks, mood, and memories. Ask me
        anything about your progress.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {prompts.map((p) => (
          <span
            key={p}
            className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
