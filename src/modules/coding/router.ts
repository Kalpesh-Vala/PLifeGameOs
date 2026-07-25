import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { CODING_PLATFORMS, DIFFICULTIES } from "@/modules/coding/types";
import {
  createProblem,
  deleteProblem,
  getCodingStats,
  listProblems,
} from "@/modules/coding/service";

export const codingRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listProblems(ctx.userId)),

  stats: protectedProcedure.query(({ ctx }) => getCodingStats(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        platform: z.enum(CODING_PLATFORMS),
        difficulty: z.enum(DIFFICULTIES),
        topic: z.string().max(80).nullable().optional(),
        url: z.string().url().max(500).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => createProblem(ctx.userId, input)),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteProblem(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
