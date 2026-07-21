/**
 * Lightweight, typed in-process domain event bus.
 *
 * Modules publish domain events (e.g. `xp.awarded`) without knowing who reacts.
 * Reactions (analytics, notifications, future AI-memory ingestion) subscribe
 * here. Events are fire-and-forget: a failing handler never breaks the command
 * that emitted the event.
 *
 * Command results that the caller needs (e.g. the XP delta from a check-in) are
 * returned directly by the service — not routed through the bus.
 */

export type DomainEventMap = {
  "xp.awarded": {
    userId: string;
    amount: number;
    source: string;
    skillId?: string;
    totalXp: number;
  };
  "level.up": { userId: string; from: number; to: number };
  "skill.level.up": {
    userId: string;
    skillId: string;
    from: number;
    to: number;
  };
  "achievement.unlocked": { userId: string; achievementId: string };
  "user.checkedIn": { userId: string; streak: number };
  "task.completed": {
    userId: string;
    taskId: string;
    skillId?: string;
    xp: number;
  };
  "habit.completed": {
    userId: string;
    habitId: string;
    skillId?: string;
    xp: number;
  };
};

export type DomainEventName = keyof DomainEventMap;

type Handler<E extends DomainEventName> = (
  payload: DomainEventMap[E],
) => void | Promise<void>;

type AnyHandler = (payload: unknown) => void | Promise<void>;

type Bus = {
  handlers: Record<string, AnyHandler[]>;
  registered: boolean;
};

declare global {
  var _domainEventBus: Bus | undefined;
}

const bus: Bus = global._domainEventBus ?? {
  handlers: {},
  registered: false,
};
if (!global._domainEventBus) global._domainEventBus = bus;

export function on<E extends DomainEventName>(
  event: E,
  handler: Handler<E>,
): void {
  (bus.handlers[event] ??= []).push(handler as AnyHandler);
}

export async function dispatch<E extends DomainEventName>(
  event: E,
  payload: DomainEventMap[E],
): Promise<void> {
  ensureSubscribers();
  const handlers = bus.handlers[event];
  if (!handlers?.length) return;

  await Promise.all(
    handlers.map(async (handler) => {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`[events] handler for "${event}" failed:`, error);
      }
    }),
  );
}

/**
 * Registers default subscribers exactly once per runtime instance.
 * Currently logs in development; Phase 4 attaches AI-memory ingestion here.
 */
function ensureSubscribers(): void {
  if (bus.registered) return;
  bus.registered = true;

  if (process.env.NODE_ENV === "development") {
    on("level.up", ({ userId, to }) =>
      console.log(`[events] ${userId} reached level ${to}`),
    );
    on("achievement.unlocked", ({ userId, achievementId }) =>
      console.log(`[events] ${userId} unlocked "${achievementId}"`),
    );
  }
}
