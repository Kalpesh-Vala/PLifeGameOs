import { createTRPCRouter, publicProcedure } from "@/server/trpc/trpc";
import { env, isDbConfigured, isAiConfigured } from "@/env";

/**
 * System-level diagnostics and configuration status.
 */
export const systemRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    ok: true,
    time: new Date().toISOString(),
    env: env.NODE_ENV,
  })),

  status: publicProcedure.query(() => ({
    database: isDbConfigured,
    ai: isAiConfigured,
  })),
});
