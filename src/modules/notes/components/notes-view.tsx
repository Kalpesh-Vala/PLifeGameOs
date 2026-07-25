"use client";

import * as React from "react";
import {
  StickyNote,
  Loader2,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Search,
  Pencil,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import type { NoteView } from "@/modules/notes/types";

export function NotesView() {
  const [query, setQuery] = React.useState("");
  const notes = trpc.notes.list.useQuery();

  const filtered = (notes.data ?? []).filter((n) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (n.title ?? "").toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
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
            placeholder="Search notes…"
            className="pl-9"
          />
        </div>
        <NoteDialog />
      </div>

      {notes.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <StickyNote className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">
            {query ? "No matching notes" : "No notes yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            Capture ideas — your AI can recall them later.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note }: { note: NoteView }) {
  const utils = trpc.useUtils();
  const invalidate = () => void utils.notes.list.invalidate();

  const pin = trpc.notes.togglePin.useMutation({ onSuccess: invalidate });
  const remove = trpc.notes.delete.useMutation({
    onSuccess: () => {
      toast.success("Note deleted.");
      invalidate();
    },
  });

  return (
    <div className="flex flex-col rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">
          {note.title || <span className="text-muted-foreground">Untitled</span>}
        </p>
        <div className="flex shrink-0 gap-0.5">
          <NoteDialog note={note} trigger={
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
              <Pencil className="size-3.5" />
            </Button>
          } />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            onClick={() => pin.mutate({ id: note.id })}
            aria-label={note.pinned ? "Unpin" : "Pin"}
          >
            {note.pinned ? (
              <PinOff className="size-3.5" />
            ) : (
              <Pin className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id: note.id })}
            aria-label="Delete note"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-sm text-muted-foreground">
        {note.content}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {note.pinned && (
          <Badge className="h-5 gap-1 px-1.5 text-[10px]">
            <Pin className="size-2.5" /> Pinned
          </Badge>
        )}
        {note.tags.map((t) => (
          <Badge key={t} variant="secondary" className="h-5 px-1.5 text-[10px]">
            #{t}
          </Badge>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground/70">
        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </p>
    </div>
  );
}

function NoteDialog({
  note,
  trigger,
}: {
  note?: NoteView;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState(note?.title ?? "");
  const [content, setContent] = React.useState(note?.content ?? "");
  const [tags, setTags] = React.useState(note?.tags.join(", ") ?? "");

  const utils = trpc.useUtils();
  const invalidate = () => void utils.notes.list.invalidate();

  const create = trpc.notes.create.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: "Note saved" });
      if (!result.award) toast.success("Note saved.");
      reset();
      setOpen(false);
      invalidate();
      void utils.gamification.profile.invalidate();
    },
    onError: () => toast.error("Could not save the note."),
  });

  const update = trpc.notes.update.useMutation({
    onSuccess: () => {
      toast.success("Note updated.");
      setOpen(false);
      invalidate();
    },
    onError: () => toast.error("Could not update the note."),
  });

  const reset = () => {
    if (!note) {
      setTitle("");
      setContent("");
      setTags("");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (note) {
      update.mutate({
        id: note.id,
        title: title.trim() || null,
        content: content.trim(),
        tags: tagList,
      });
    } else {
      create.mutate({
        title: title.trim() || null,
        content: content.trim(),
        tags: tagList,
      });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            New note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write anything…"
            rows={6}
            required
          />
          <div className="space-y-1">
            <Label htmlFor="note-tags" className="text-xs text-muted-foreground">
              Tags
            </Label>
            <Input
              id="note-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="idea, react, life"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !content.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {note ? "Save changes" : "Save note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
