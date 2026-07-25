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
import { notesRouter } from "@/modules/notes/router";
import { knowledgeRouter } from "@/modules/knowledge/router";
import { bookmarksRouter } from "@/modules/bookmarks/router";
import { learningRouter } from "@/modules/learning/router";
import { readingRouter } from "@/modules/reading/router";
import { roadmapsRouter } from "@/modules/roadmaps/router";

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
  notes: notesRouter,
  knowledge: knowledgeRouter,
  bookmarks: bookmarksRouter,
  learning: learningRouter,
  reading: readingRouter,
  roadmaps: roadmapsRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Server-side caller for React Server Components and background jobs.
 */
export const createCaller = createCallerFactory(appRouter);
