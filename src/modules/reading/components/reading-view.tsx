"use client";

import * as React from "react";
import { Library, Loader2, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import type { BookStatus, BookView } from "@/modules/reading/types";

const SHELVES: { status: BookStatus; label: string }[] = [
  { status: "reading", label: "Reading" },
  { status: "want", label: "Want to read" },
  { status: "finished", label: "Finished" },
];

export function ReadingView() {
  const list = trpc.reading.list.useQuery();
  const all = list.data ?? [];
  const finished = all.filter((b) => b.status === "finished").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {finished} finished · {all.length} on your shelves
        </p>
        <AddBook />
      </div>

      {list.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Library className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No books yet</p>
          <p className="text-sm text-muted-foreground">
            Add a book and earn {50} XP when you finish it.
          </p>
        </div>
      ) : (
        SHELVES.map(({ status, label }) => {
          const books = all.filter((b) => b.status === status);
          if (books.length === 0) return null;
          return (
            <section key={status}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {label} ({books.length})
              </h2>
              <div className="space-y-2">
                {books.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function BookCard({ book }: { book: BookView }) {
  const [page, setPage] = React.useState(String(book.currentPage));
  const utils = trpc.useUtils();
  const invalidate = () => {
    void utils.reading.list.invalidate();
    void utils.gamification.profile.invalidate();
    void utils.gamification.recentActivity.invalidate();
  };

  const setStatus = trpc.reading.setStatus.useMutation({
    onSuccess: (r) => {
      if (r.award) {
        toast.success(`Finished: ${r.book.title} 📚`);
        showAwardToasts(r.award);
      }
      invalidate();
    },
  });
  const setProgress = trpc.reading.setProgress.useMutation({
    onSuccess: (r) => {
      if (r.award) {
        toast.success(`Finished: ${r.book.title} 📚`);
        showAwardToasts(r.award);
      }
      invalidate();
    },
  });
  const rate = trpc.reading.rate.useMutation({ onSuccess: invalidate });
  const remove = trpc.reading.delete.useMutation({ onSuccess: invalidate });

  const pct =
    book.totalPages && book.totalPages > 0
      ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
      : 0;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{book.title}</p>
          {book.author && (
            <p className="text-xs text-muted-foreground">{book.author}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Select
            value={book.status}
            onValueChange={(v) =>
              setStatus.mutate({ id: book.id, status: v as BookStatus })
            }
          >
            <SelectTrigger className="h-8 w-28 text-xs capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="want">Want</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id: book.id })}
            aria-label="Delete book"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {book.status === "reading" && book.totalPages && (
        <div className="mt-3 space-y-2">
          <Progress value={pct} className="h-2" />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="h-8 w-24"
              min={0}
              max={book.totalPages}
            />
            <span className="text-xs text-muted-foreground">
              / {book.totalPages} pages
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              disabled={setProgress.isPending}
              onClick={() =>
                setProgress.mutate({
                  id: book.id,
                  currentPage: Number(page) || 0,
                })
              }
            >
              Update
            </Button>
          </div>
        </div>
      )}

      {book.status === "finished" && (
        <div className="mt-2 flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => rate.mutate({ id: book.id, rating: n })}
              aria-label={`Rate ${n} stars`}
            >
              <Star
                className={cn(
                  "size-4",
                  book.rating && n <= book.rating
                    ? "fill-warning text-warning"
                    : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddBook() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [pages, setPages] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.reading.create.useMutation({
    onSuccess: () => {
      toast.success("Book added.");
      setTitle("");
      setAuthor("");
      setPages("");
      setOpen(false);
      void utils.reading.list.invalidate();
    },
    onError: () => toast.error("Could not add the book."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a book</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({
              title: title.trim(),
              author: author.trim() || null,
              totalPages: pages ? Number(pages) : null,
            });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            autoFocus
            required
          />
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
          />
          <div className="space-y-1">
            <Label htmlFor="b-pages" className="text-xs text-muted-foreground">
              Total pages (optional)
            </Label>
            <Input
              id="b-pages"
              type="number"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="e.g. 320"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending || !title.trim()}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
