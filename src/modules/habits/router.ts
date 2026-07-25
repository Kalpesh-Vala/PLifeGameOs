import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { SKILL_IDS } from "@/modules/gamification/lib/skills";
import {
  checkInHabit,
  createHabit,
  deleteHabit,
  getHabitStats,
  listHabits,
  settleHabits,
  updateHabit,
} from "@/modules/habits/service";

const skillId = z.enum(SKILL_IDS as [string, ...string[]]);
const time = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .nullable();

const configInput = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).nullable().optional(),
  skillId: skillId.nullable().optional(),
  scheduledTime: time.optional(),
  gracePeriodMin: z.number().int().min(0).max(720).optional(),
  recurrence: z.enum(["daily", "weekly"]).optional(),
  weeklyDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  xpReward: z.number().int().min(0).max(1000).optional(),
  penaltyXp: z.number().int().min(0).max(1000).optional(),
  penaltyCoins: z.number().int().min(0).max(1000).optional(),
});

export const habitsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listHabits(ctx.userId)),

  stats: protectedProcedure.query(({ ctx }) => getHabitStats(ctx.userId)),

  create: protectedProcedure
    .input(configInput)
    .mutation(({ ctx, input }) => createHabit(ctx.userId, input)),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).and(configInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const habit = await updateHabit(ctx.userId, id, rest);
      if (!habit) throw new TRPCError({ code: "NOT_FOUND" });
      return habit;
    }),

  checkIn: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await checkInHabit(ctx.userId, input.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  settle: protectedProcedure.mutation(({ ctx }) => settleHabits(ctx.userId)),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteHabit(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
