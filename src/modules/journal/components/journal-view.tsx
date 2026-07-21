"use client";

import * as React from "react";
import { Loader2, Trash2, NotebookPen } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import { MOODS, getMood, type MoodLevel } from "@/modules/mood/lib/scale";
import type { JournalEntryView } from "@/modules/journal/types";

export function JournalView() {
  const entries = trpc.journal.list.useQuery();

  return (
    <div className="space-y-6">
      <JournalEditor />
      {entries.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (entries.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <NotebookPen className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No entries yet</p>
          <p className="text-sm text-muted-foreground">
            Write your first entry — earn XP for reflecting.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(entries.data ?? []).map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function JournalEditor() {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [mood, setMood] = React.useState<MoodLevel | null>(null);
  const [tags, setTags] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.journal.create.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: "Journal entry saved" });
      if (!result.award) toast.success("Entry saved.");
      setTitle("");
      setContent("");
      setMood(null);
      setTags("");
      void utils.journal.list.invalidate();
      void utils.gamification.profile.invalidate();
      void utils.gamification.recentActivity.invalidate();
    },
    onError: () => toast.error("Could not save the entry."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    create.mutate({
      title: title.trim() || null,
      content: content.trim(),
      mood,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What happened today? What are you thinking about?"
            rows={5}
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md border text-lg transition-colors",
                    mood === m.value
                      ? "border-primary bg-accent"
                      : "hover:bg-accent/50",
                  )}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tags, comma, separated"
              className="flex-1 min-w-40"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={create.isPending || !content.trim()}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Save entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function JournalEntryCard({ entry }: { entry: JournalEntryView }) {
  const utils = trpc.useUtils();
  const remove = trpc.journal.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted.");
      void utils.journal.list.invalidate();
    },
  });
  const mood = entry.mood ? getMood(entry.mood) : undefined;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {mood && <span className="text-lg">{mood.emoji}</span>}
              <p className="font-medium">
                {entry.title || format(new Date(entry.createdAt), "EEEE, MMM d")}
              </p>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {entry.content}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="h-5 px-1.5 text-[10px]">
                  #{tag}
                </Badge>
              ))}
              <span className="text-[11px] text-muted-foreground/70">
                {format(new Date(entry.createdAt), "MMM d, yyyy · h:mm a")}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id: entry.id })}
            aria-label="Delete entry"
          >
            {remove.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
