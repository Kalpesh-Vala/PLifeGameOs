import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { SKILL_IDS } from "@/modules/gamification/lib/skills";
import {
  awardXp,
  checkIn,
  getAchievementsView,
  getProfileView,
  getRecentActivity,
} from "@/modules/gamification/service";

export const gamificationRouter = createTRPCRouter({
  profile: protectedProcedure.query(({ ctx }) => getProfileView(ctx.userId)),

  achievements: protectedProcedure.query(({ ctx }) =>
    getAchievementsView(ctx.userId),
  ),

  recentActivity: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(15) }).optional())
    .query(({ ctx, input }) =>
      getRecentActivity(ctx.userId, input?.limit ?? 15),
    ),

  checkIn: protectedProcedure.mutation(({ ctx }) => checkIn(ctx.userId)),

  /**
   * Dev-only helper to award XP for manual testing. Real XP is granted
   * server-side by module actions (tasks, habits, etc.) in later phases.
   */
  awardXp: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().min(1).max(1000),
        source: z.string().min(1).max(60).default("manual"),
        skillId: z.enum(SKILL_IDS as [string, ...string[]]).optional(),
        note: z.string().max(200).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (process.env.NODE_ENV !== "development") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return awardXp(ctx.userId, input);
    }),
});
