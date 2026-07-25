/**
 * Emotionally-flavored reminder copy. Reminders escalate in tone across the
 * stages — warm and encouraging early, urgent and heartfelt near the deadline —
 * with emojis and streak-aware lines so nudges feel personal, not robotic.
 */

import type { NotificationStage } from "@/modules/notifications/lib/schedule";

export type HabitMessageContext = {
  title: string;
  streak: number;
  minutesLeft: number;
};

export type BuiltMessage = { title: string; body: string };

type Template = (c: HabitMessageContext) => string;

const HEADS_UP: Template[] = [
  (c) => `“${c.title}” starts in ${c.minutesLeft} min. A little prep goes a long way 🌱`,
  (c) => `Get ready — “${c.title}” is almost here. You’ve got this 💪`,
  (c) => `Psst… “${c.title}” in ${c.minutesLeft} min. Future you will thank you 😊`,
];

const DUE: Template[] = [
  (c) => `“${c.title}” is due right now. Let’s make it happen ✨`,
  (c) => `Now’s the moment for “${c.title}”. Small step, big momentum 🚀`,
  (c) => `“${c.title}” is calling! Answer it and keep the fire alive 🔥`,
];

const DUE_STREAK: Template[] = [
  (c) => `“${c.title}” time! Protect that ${c.streak}-day streak 🔥 You’re on a roll.`,
  (c) => `${c.streak} days strong 💪 Keep it going — “${c.title}” is due now.`,
];

const GRACE: Template[] = [
  (c) => `“${c.title}” hasn’t been done yet. Don’t let it slip 😟`,
  (c) => `A gentle nudge: “${c.title}” is overdue but there’s still time ⏳`,
  (c) => `Hey, “${c.title}” is waiting for you 🥺 A few minutes is all it takes.`,
];

const GRACE_STREAK: Template[] = [
  (c) => `Your ${c.streak}-day streak is watching 🥺 “${c.title}” still needs you.`,
  (c) => `Don’t break the chain now! ${c.streak} days of “${c.title}” on the line ⛓️`,
];

const FINAL_CALL: Template[] = [
  (c) => `Only ${c.minutesLeft} min left for “${c.title}” before it’s missed 💔`,
  (c) => `This is it — ${c.minutesLeft} min to save “${c.title}”. You can do it! 🙌`,
];

const FINAL_CALL_STREAK: Template[] = [
  (c) => `🚨 ${c.minutesLeft} min left! Don’t let a ${c.streak}-day streak end here 😭🔥`,
  (c) => `Last chance for “${c.title}” — ${c.streak} days of effort deserve one more push 💥`,
];

const TITLES: Record<NotificationStage, string> = {
  "heads-up": "⏰ Coming up soon",
  due: "🔥 It’s time!",
  grace: "👀 Still waiting…",
  "final-call": "🚨 Last chance!",
};

function pick(pool: Template[], c: HabitMessageContext, rand: () => number): string {
  return pool[Math.floor(rand() * pool.length) % pool.length](c);
}

/**
 * Builds a habit reminder. When the user has a meaningful streak (>= 3), the
 * copy leans into streak-protection for extra emotional weight.
 */
export function buildHabitMessage(
  stage: NotificationStage,
  ctx: HabitMessageContext,
  rand: () => number = Math.random,
): BuiltMessage {
  const hasStreak = ctx.streak >= 3;
  let pool: Template[];
  switch (stage) {
    case "heads-up":
      pool = HEADS_UP;
      break;
    case "due":
      pool = hasStreak ? DUE_STREAK : DUE;
      break;
    case "grace":
      pool = hasStreak ? GRACE_STREAK : GRACE;
      break;
    case "final-call":
      pool = hasStreak ? FINAL_CALL_STREAK : FINAL_CALL;
      break;
  }
  return { title: TITLES[stage], body: pick(pool, ctx, rand) };
}

/** A once-a-day summary reminder for tasks due today. */
export function buildTasksDueMessage(count: number): BuiltMessage {
  return {
    title: "📋 Tasks on deck",
    body:
      count === 1
        ? "You’ve got 1 task due today. Clear it and earn some XP 💥"
        : `You’ve got ${count} tasks due today. Knock them out and level up 💥`,
  };
}

/** A once-a-day nudge for overdue tasks. */
export function buildTasksOverdueMessage(count: number): BuiltMessage {
  return {
    title: "⚠️ A little backlog",
    body:
      count === 1
        ? "1 task is overdue. A fresh start beats a growing pile 🌟"
        : `${count} tasks are overdue. Tackle one now — momentum feels great 🌟`,
  };
}
