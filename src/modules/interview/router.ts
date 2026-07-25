import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  INTERVIEW_CATEGORIES,
  INTERVIEW_STATUSES,
} from "@/modules/interview/types";
import {
  createTopic,
  deleteTopic,
  getInterviewStats,
  listTopics,
  updateStatus,
} from "@/modules/interview/service";

export const interviewRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listTopics(ctx.userId)),

  stats: protectedProcedure.query(({ ctx }) => getInterviewStats(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        category: z.enum(INTERVIEW_CATEGORIES),
        note: z.string().max(500).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => createTopic(ctx.userId, input)),

  setStatus: protectedProcedure
    .input(
      z.object({ id: z.string(), status: z.enum(INTERVIEW_STATUSES) }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await updateStatus(ctx.userId, input.id, input.status);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteTopic(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
