import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createRoadmap,
  deleteRoadmap,
  listRoadmaps,
  toggleStep,
} from "@/modules/roadmaps/service";

export const roadmapsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listRoadmaps(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).nullable().optional(),
        category: z.string().max(60).optional(),
        steps: z.array(z.string().min(1).max(200)).min(1).max(50),
      }),
    )
    .mutation(({ ctx, input }) => createRoadmap(ctx.userId, input)),

  toggleStep: protectedProcedure
    .input(z.object({ roadmapId: z.string(), stepId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await toggleStep(
        ctx.userId,
        input.roadmapId,
        input.stepId,
      );
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteRoadmap(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
