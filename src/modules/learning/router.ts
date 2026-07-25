import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createLearning,
  deleteLearning,
  listLearning,
  updateProgress,
} from "@/modules/learning/service";

export const learningRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listLearning(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        provider: z.string().max(80).nullable().optional(),
        url: z.string().url().max(500).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => createLearning(ctx.userId, input)),

  setProgress: protectedProcedure
    .input(z.object({ id: z.string(), progress: z.number().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const result = await updateProgress(ctx.userId, input.id, input.progress);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteLearning(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
