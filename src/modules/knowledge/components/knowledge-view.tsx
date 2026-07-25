"use client";

import * as React from "react";
import { Library, Loader2, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import type { KnowledgeEntryView } from "@/modules/knowledge/types";

export function KnowledgeView() {
  const [query, setQuery] = React.useState("");
  const entries = trpc.knowledge.list.useQuery();

  const all = entries.data ?? [];
  const categories = [...new Set(all.map((e) => e.category))];

  const filtered = all.filter((e) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge…"
            className="pl-9"
          />
        </div>
        <EntryDialog categories={categories} />
      </div>

      {entries.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Library className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">
            {query ? "No matching entries" : "Your knowledge base is empty"}
          </p>
          <p className="text-sm text-muted-foreground">
            Save concepts you learn — organized and AI-searchable.
          </p>
        </div>
      ) : (
        [...new Set(filtered.map((e) => e.category))].map((category) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h2>
            <div className="space-y-2">
              {filtered
                .filter((e) => e.category === category)
                .map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function EntryCard({ entry }: { entry: KnowledgeEntryView }) {
  const [expanded, setExpanded] = React.useState(false);
  const utils = trpc.useUtils();
  const remove = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted.");
      void utils.knowledge.list.invalidate();
    },
  });

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="font-medium">{entry.title}</p>
          <p
            className={
              expanded
                ? "mt-1 whitespace-pre-wrap text-sm text-muted-foreground"
                : "mt-1 line-clamp-2 text-sm text-muted-foreground"
            }
          >
            {entry.content}
          </p>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ id: entry.id })}
          aria-label="Delete entry"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {entry.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.tags.map((t) => (
            <Badge key={t} variant="secondary" className="h-5 px-1.5 text-[10px]">
              #{t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryDialog({ categories }: { categories: string[] }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.knowledge.create.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: "Knowledge saved" });
      if (!result.award) toast.success("Saved to knowledge base.");
      setTitle("");
      setCategory("");
      setContent("");
      setTags("");
      setOpen(false);
      void utils.knowledge.list.invalidate();
      void utils.gamification.profile.invalidate();
    },
    onError: () => toast.error("Could not save the entry."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New knowledge entry</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !content.trim()) return;
            create.mutate({
              title: title.trim(),
              content: content.trim(),
              category: category.trim() || "General",
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Concept (e.g. Consistent hashing)"
            required
          />
          <div className="space-y-1">
            <Label htmlFor="kb-cat" className="text-xs text-muted-foreground">
              Category
            </Label>
            <Input
              id="kb-cat"
              list="kb-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. System Design"
            />
            <datalist id="kb-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Explain it in your own words…"
            rows={5}
            required
          />
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tags, comma, separated"
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={create.isPending || !title.trim() || !content.trim()}
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Save entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
