"use client";

import * as React from "react";
import { Image as ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
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
import type { VisionItemView } from "@/modules/vision/types";

export function VisionView() {
  const list = trpc.vision.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {(list.data ?? []).length} vision
          {(list.data ?? []).length === 1 ? "" : "s"}
        </p>
        <CreateVision />
      </div>

      {list.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (list.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <ImageIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Your vision board is empty</p>
          <p className="text-sm text-muted-foreground">
            Add images and captions of the life you&apos;re building toward.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(list.data ?? []).map((item) => (
            <VisionCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function VisionCard({ item }: { item: VisionItemView }) {
  const utils = trpc.useUtils();
  const remove = trpc.vision.delete.useMutation({
    onSuccess: () => {
      toast.success("Removed.");
      void utils.vision.list.invalidate();
    },
  });

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card">
      <div
        className="h-40 w-full bg-cover bg-center"
        style={
          item.imageUrl
            ? { backgroundImage: `url(${item.imageUrl})` }
            : {
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--primary) 25%, transparent), color-mix(in oklab, var(--legendary) 25%, transparent))",
              }
        }
      >
        {!item.imageUrl && (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/60" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{item.title}</p>
          <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px]">
            {item.category}
          </Badge>
        </div>
        {item.caption && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.caption}
          </p>
        )}
      </div>
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-2 top-2 size-8 opacity-0 transition-opacity group-hover:opacity-100"
        disabled={remove.isPending}
        onClick={() => remove.mutate({ id: item.id })}
        aria-label="Remove vision"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function CreateVision() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [category, setCategory] = React.useState("");

  const utils = trpc.useUtils();
  const create = trpc.vision.create.useMutation({
    onSuccess: () => {
      toast.success("Added to your vision board.");
      setTitle("");
      setImageUrl("");
      setCaption("");
      setCategory("");
      setOpen(false);
      void utils.vision.list.invalidate();
    },
    onError: () => toast.error("Could not add. Check the image URL."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New vision
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to vision board</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({
              title: title.trim(),
              imageUrl: imageUrl.trim() || null,
              caption: caption.trim() || null,
              category: category.trim() || "Life",
            });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you working toward?"
            autoFocus
            required
          />
          <div className="space-y-1">
            <Label htmlFor="v-img" className="text-xs text-muted-foreground">
              Image URL (optional)
            </Label>
            <Input
              id="v-img"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
          />
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Career, Health)"
          />
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
