"use client";

import * as React from "react";
import { Loader2, Trash2, Database, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
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
import type { MemoryKind, MemoryView } from "@/modules/memory/types";

const KINDS: MemoryKind[] = [
  "fact",
  "preference",
  "insight",
  "event",
  "journal",
  "review",
];

export function MemoryBoard() {
  const memories = trpc.memory.list.useQuery();

  return (
    <div className="space-y-6">
      <AddMemory />
      {memories.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (memories.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Database className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No memories yet</p>
          <p className="text-sm text-muted-foreground">
            The AI builds memory from your journals and reviews. You can also add
            facts it should always remember.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(memories.data ?? []).map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddMemory() {
  const [content, setContent] = React.useState("");
  const [kind, setKind] = React.useState<MemoryKind>("fact");
  const [importance, setImportance] = React.useState("3");

  const utils = trpc.useUtils();
  const add = trpc.memory.add.useMutation({
    onSuccess: () => {
      toast.success("Memory saved.");
      setContent("");
      void utils.memory.list.invalidate();
    },
    onError: () => toast.error("Could not save the memory."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    add.mutate({
      content: content.trim(),
      kind,
      importance: Number(importance),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Teach the AI something</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. I focus best in the early morning before 9am."
            rows={2}
            required
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as MemoryKind)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k} className="capitalize">
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={importance} onValueChange={setImportance}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Importance {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="ml-auto"
              disabled={add.isPending || !content.trim()}
            >
              {add.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Remember
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MemoryCard({ memory }: { memory: MemoryView }) {
  const utils = trpc.useUtils();
  const remove = trpc.memory.delete.useMutation({
    onSuccess: () => {
      toast.success("Memory deleted.");
      void utils.memory.list.invalidate();
    },
  });

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm">{memory.content}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] capitalize">
              {memory.kind}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              importance {memory.importance} · {memory.source} ·{" "}
              {format(new Date(memory.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ id: memory.id })}
          aria-label="Delete memory"
        >
          {remove.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
