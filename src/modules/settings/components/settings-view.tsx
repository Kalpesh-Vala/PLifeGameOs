"use client";

import * as React from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Loader2,
  Download,
  LogOut,
  RotateCcw,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { CURRENCY_OPTIONS } from "@/modules/settings/types";

export function SettingsView() {
  const settings = trpc.settings.get.useQuery();

  if (settings.isLoading || !settings.data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProfileCard displayName={settings.data.displayName} />
      <PreferencesCard
        currency={settings.data.currency}
        aiContextEnabled={settings.data.aiContextEnabled}
      />
      <DataCard />
      <AccountCard />
    </div>
  );
}

function ProfileCard({ displayName }: { displayName: string | null }) {
  const { data: session } = useSession();
  const [name, setName] = React.useState(displayName ?? "");
  const utils = trpc.useUtils();

  const update = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated.");
      void utils.settings.get.invalidate();
    },
  });

  const user = session?.user;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            {user?.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback>
              {(name || user?.name || user?.email || "?")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium">{user?.name ?? "Adventurer"}</p>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <div className="flex gap-2">
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How the AI should address you"
            />
            <Button
              disabled={update.isPending}
              onClick={() => update.mutate({ displayName: name.trim() || null })}
            >
              {update.isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesCard({
  currency,
  aiContextEnabled,
}: {
  currency: string;
  aiContextEnabled: boolean;
}) {
  const utils = trpc.useUtils();
  const update = trpc.settings.update.useMutation({
    onSuccess: () => {
      void utils.settings.get.invalidate();
      void utils.finance.summary.invalidate();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Light or dark mode.</p>
          </div>
          <ThemeToggle />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Currency</p>
            <p className="text-xs text-muted-foreground">
              Used across the Finance module.
            </p>
          </div>
          <Select
            value={currency}
            onValueChange={(v) => update.mutate({ currency: v })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium">AI data access</p>
            <p className="text-xs text-muted-foreground">
              Allow the AI assistant to read your Life OS data (tasks, habits,
              mood, memories) to give grounded advice.
            </p>
          </div>
          <Switch
            checked={aiContextEnabled}
            onCheckedChange={(v) => update.mutate({ aiContextEnabled: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DataCard() {
  const utils = trpc.useUtils();
  const [exporting, setExporting] = React.useState(false);

  const resetProgress = trpc.data.resetProgress.useMutation();
  const deleteAll = trpc.data.deleteAll.useMutation();

  const onExport = async () => {
    setExporting(true);
    try {
      const bundle = await utils.data.export.fetch();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-os-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded.");
    } catch {
      toast.error("Could not export your data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Data & privacy</CardTitle>
        <CardDescription>
          Export a full backup or manage your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" onClick={onExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Export all data (JSON)
        </Button>

        <Separator />

        <div className="rounded-lg border border-destructive/30 p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <ShieldAlert className="size-4" />
            Danger zone
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm">
                  <RotateCcw className="size-4" />
                  Reset progress
                </Button>
              }
              title="Reset all progress?"
              description="This deletes your XP, levels, streaks, achievements, and quests. Your tasks, notes, journals and other content are kept. This cannot be undone."
              confirmWord="RESET"
              onConfirm={async () => {
                await resetProgress.mutateAsync({ confirm: "RESET" });
                await utils.invalidate();
                toast.success("Progress reset.");
              }}
            />
            <ConfirmDialog
              trigger={
                <Button variant="destructive" size="sm">
                  <Trash2 className="size-4" />
                  Delete all data
                </Button>
              }
              title="Delete everything?"
              description="This permanently deletes ALL your Life OS data across every module. Export a backup first. This cannot be undone."
              confirmWord="DELETE"
              onConfirm={async () => {
                await deleteAll.mutateAsync({ confirm: "DELETE" });
                await utils.invalidate();
                toast.success("All data deleted.");
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}

function ConfirmDialog({
  trigger,
  title,
  description,
  confirmWord,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmWord: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const run = async () => {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
      setValue("");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm">
            Type <span className="font-mono font-semibold">{confirmWord}</span> to
            confirm
          </Label>
          <Input
            id="confirm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={value !== confirmWord || pending}
            onClick={run}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
