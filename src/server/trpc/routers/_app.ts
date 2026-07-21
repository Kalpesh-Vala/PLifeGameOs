import { createCallerFactory, createTRPCRouter } from "@/server/trpc/trpc";
import { systemRouter } from "@/server/trpc/routers/system";
import { gamificationRouter } from "@/modules/gamification/router";
import { tasksRouter } from "@/modules/tasks/router";
import { habitsRouter } from "@/modules/habits/router";

/**
 * Root application router. Module routers are merged here as the app grows.
 */
export const appRouter = createTRPCRouter({
  system: systemRouter,
  gamification: gamificationRouter,
  tasks: tasksRouter,
  habits: habitsRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Server-side caller for React Server Components and background jobs.
 */
export const createCaller = createCallerFactory(appRouter);
