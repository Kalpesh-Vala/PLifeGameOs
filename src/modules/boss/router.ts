import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { SKILL_IDS } from "@/modules/gamification/lib/skills";
import {
  createBoss,
  deleteBoss,
  listBosses,
  toggleMilestone,
} from "@/modules/boss/service";

const skillId = z.enum(SKILL_IDS as [string, ...string[]]);

export const bossRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listBosses(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        milestones: z.array(z.string().min(1).max(200)).min(1).max(30),
        skillId: skillId.nullable().optional(),
        deadline: z.date().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => createBoss(ctx.userId, input)),

  toggleMilestone: protectedProcedure
    .input(z.object({ battleId: z.string(), milestoneId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await toggleMilestone(
        ctx.userId,
        input.battleId,
        input.milestoneId,
      );
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteBoss(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
