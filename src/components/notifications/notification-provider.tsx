"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/react";
import { dateKey } from "@/lib/date";
import { computeHabitStage } from "@/modules/notifications/lib/schedule";
import {
  buildHabitMessage,
  buildTasksDueMessage,
  buildTasksOverdueMessage,
  type BuiltMessage,
} from "@/modules/notifications/lib/messages";

const POLL_MS = 60_000;
const PERMISSION_POLL_MS = 15_000;
const STORAGE_KEY = "lifeos:notify:sent";

function currentPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return null;
  }
  return Notification.permission;
}

/** Loads the set of reminder keys already sent today (resets on a new day). */
function loadSent(today: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { date?: string; keys?: string[] };
    if (parsed.date !== today) return new Set();
    return new Set(parsed.keys ?? []);
  } catch {
    return new Set();
  }
}

function persistSent(today: string, keys: Set<string>): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, keys: [...keys] }),
    );
  } catch {
    /* storage unavailable — non-fatal */
  }
}

async function showNotification(
  msg: BuiltMessage,
  tag: string,
  url: string,
  requireInteraction: boolean,
): Promise<void> {
  const options: NotificationOptions = {
    body: msg.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag,
    data: { url },
    requireInteraction,
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(msg.title, options);
      return;
    }
  } catch {
    /* fall through to the page-level Notification */
  }
  try {
    new Notification(msg.title, options);
  } catch {
    /* permission revoked mid-session — ignore */
  }
}

/**
 * Foreground reminder engine. While the app is open (or installed as a PWA and
 * kept alive), it periodically evaluates scheduled habits and fires a small,
 * escalating series of emotional reminders — heads-up, due, grace, last-call —
 * plus a once-a-day summary for tasks due/overdue. De-duplicated per day so it
 * never spams.
 */
export function NotificationProvider() {
  const { status } = useSession();
  const authed = status === "authenticated";

  const settings = trpc.settings.get.useQuery(undefined, { enabled: authed });
  const enabledPref = settings.data?.notificationsEnabled ?? false;

  const [permission, setPermission] =
    React.useState<NotificationPermission | null>(null);

  // Keep the permission state fresh (the user may grant it from Settings).
  React.useEffect(() => {
    if (!authed) return;
    const check = () => setPermission(currentPermission());
    check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    const id = window.setInterval(check, PERMISSION_POLL_MS);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(id);
    };
  }, [authed]);

  const active = authed && enabledPref && permission === "granted";

  const habits = trpc.habits.list.useQuery(undefined, {
    enabled: active,
    refetchInterval: active ? POLL_MS : false,
  });
  const tasks = trpc.tasks.list.useQuery(undefined, {
    enabled: active,
    refetchInterval: active ? POLL_MS * 5 : false,
  });

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), POLL_MS);
    return () => window.clearInterval(id);
  }, [active]);

  React.useEffect(() => {
    if (!active) return;

    const today = dateKey();
    const sent = loadSent(today);
    let changed = false;

    for (const h of habits.data ?? []) {
      if (!h.scheduledTime || !h.scheduledToday || h.completedToday) continue;
      if (h.status === "missed") continue;

      const res = computeHabitStage({
        scheduledTime: h.scheduledTime,
        gracePeriodMin: h.gracePeriodMin,
      });
      if (!res) continue;

      const key = `habit:${h.id}:${res.stage}`;
      if (sent.has(key)) continue;

      const msg = buildHabitMessage(res.stage, {
        title: h.title,
        streak: h.currentStreak,
        minutesLeft: res.minutesLeft,
      });
      void showNotification(
        msg,
        `habit-${h.id}`,
        "/habits",
        res.stage === "final-call",
      );
      sent.add(key);
      changed = true;
    }

    const list = tasks.data ?? [];
    const dueToday = list.filter(
      (t) => t.status === "todo" && t.dueDate?.slice(0, 10) === today,
    ).length;
    const overdue = list.filter(
      (t) =>
        t.status === "todo" && !!t.dueDate && t.dueDate.slice(0, 10) < today,
    ).length;

    if (dueToday > 0 && !sent.has("tasks:due")) {
      void showNotification(
        buildTasksDueMessage(dueToday),
        "tasks-due",
        "/tasks",
        false,
      );
      sent.add("tasks:due");
      changed = true;
    }
    if (overdue > 0 && !sent.has("tasks:overdue")) {
      void showNotification(
        buildTasksOverdueMessage(overdue),
        "tasks-overdue",
        "/tasks",
        false,
      );
      sent.add("tasks:overdue");
      changed = true;
    }

    if (changed) persistSent(today, sent);
  }, [active, tick, habits.data, tasks.data]);

  return null;
}
