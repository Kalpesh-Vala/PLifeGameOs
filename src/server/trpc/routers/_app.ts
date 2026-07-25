import { createCallerFactory, createTRPCRouter } from "@/server/trpc/trpc";
import { systemRouter } from "@/server/trpc/routers/system";
import { gamificationRouter } from "@/modules/gamification/router";
import { tasksRouter } from "@/modules/tasks/router";
import { habitsRouter } from "@/modules/habits/router";
import { questsRouter } from "@/modules/quests/router";
import { bossRouter } from "@/modules/boss/router";
import { journalRouter } from "@/modules/journal/router";
import { moodRouter } from "@/modules/mood/router";
import { timelineRouter } from "@/modules/timeline/router";
import { memoryRouter } from "@/modules/memory/router";
import { aiRouter } from "@/modules/ai/router";
import { analyticsRouter } from "@/modules/analytics/router";
import { fitnessRouter } from "@/modules/fitness/router";
import { financeRouter } from "@/modules/finance/router";
import { codingRouter } from "@/modules/coding/router";
import { interviewRouter } from "@/modules/interview/router";
import { projectsRouter } from "@/modules/projects/router";

/**
 * Root application router. Module routers are merged here as the app grows.
 */
export const appRouter = createTRPCRouter({
  system: systemRouter,
  gamification: gamificationRouter,
  tasks: tasksRouter,
  habits: habitsRouter,
  quests: questsRouter,
  boss: bossRouter,
  journal: journalRouter,
  mood: moodRouter,
  timeline: timelineRouter,
  memory: memoryRouter,
  ai: aiRouter,
  analytics: analyticsRouter,
  fitness: fitnessRouter,
  finance: financeRouter,
  coding: codingRouter,
  interview: interviewRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Server-side caller for React Server Components and background jobs.
 */
export const createCaller = createCallerFactory(appRouter);
