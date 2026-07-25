"use client";

import * as React from "react";
import { Bookmark, Loader2, Plus, Trash2, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { BookmarkView } from "@/modules/bookmarks/types";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BookmarksView() {
  const [query, setQuery] = React.useState("");
  const bookmarks = trpc.bookmarks.list.useQuery();

  const all = bookmarks.data ?? [];
  const categories = [...new Set(all.map((b) => b.category))];

  const filtered = all.filter((b) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q))
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
            placeholder="Search bookmarks…"
            className="pl-9"
          />
        </div>
        <BookmarkDialog categories={categories} />
      </div>

      {bookmarks.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Bookmark className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">
            {query ? "No matching bookmarks" : "No bookmarks yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            Save links worth coming back to.
          </p>
        </div>
      ) : (
        [...new Set(filtered.map((b) => b.category))].map((category) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered
                .filter((b) => b.category === category)
                .map((b) => (
                  <BookmarkCard key={b.id} bookmark={b} />
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function BookmarkCard({ bookmark }: { bookmark: BookmarkView }) {
  const utils = trpc.useUtils();
  const remove = trpc.bookmarks.delete.useMutation({
    onSuccess: () => {
      toast.success("Bookmark deleted.");
      void utils.bookmarks.list.invalidate();
    },
  });

  return (
    <div className="group flex items-start gap-3 rounded-xl border bg-card p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Bookmark className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium hover:underline"
        >
          <span className="truncate">{bookmark.title}</span>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        </a>
        <p className="truncate text-xs text-muted-foreground">
          {hostname(bookmark.url)}
        </p>
        {bookmark.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {bookmark.description}
          </p>
        )}
        {bookmark.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {bookmark.tags.map((t) => (
              <Badge key={t} variant="secondary" className="h-4 px-1 text-[10px]">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        disabled={remove.isPending}
        onClick={() => remove.mutate({ id: bookmark.id })}
        aria-label="Delete bookmark"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function BookmarkDialog({ categories }: { categories: string[] }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.bookmarks.create.useMutation({
    onSuccess: () => {
      toast.success("Bookmark saved.");
      setTitle("");
      setUrl("");
      setCategory("");
      setDescription("");
      setTags("");
      setOpen(false);
      void utils.bookmarks.list.invalidate();
    },
    onError: () => toast.error("Could not save the bookmark. Check the URL."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New bookmark
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New bookmark</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !url.trim()) return;
            create.mutate({
              title: title.trim(),
              url: url.trim(),
              description: description.trim() || null,
              category: category.trim() || "General",
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            });
          }}
        >
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            required
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <div className="space-y-1">
            <Label htmlFor="bm-cat" className="text-xs text-muted-foreground">
              Category
            </Label>
            <Input
              id="bm-cat"
              list="bm-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Learning"
            />
            <datalist id="bm-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tags, comma, separated"
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={create.isPending || !title.trim() || !url.trim()}
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Save bookmark
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
