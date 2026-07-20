import { createCallerFactory, createTRPCRouter } from "@/server/trpc/trpc";
import { systemRouter } from "@/server/trpc/routers/system";

/**
 * Root application router. Module routers are merged here as the app grows.
 */
export const appRouter = createTRPCRouter({
  system: systemRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Server-side caller for React Server Components and background jobs.
 */
export const createCaller = createCallerFactory(appRouter);
