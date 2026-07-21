import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { SKILL_IDS } from "@/modules/gamification/lib/skills";
import {
  createHabit,
  deleteHabit,
  listHabits,
  toggleHabitToday,
  updateHabit,
} from "@/modules/habits/service";

const skillId = z.enum(SKILL_IDS as [string, ...string[]]);

const createInput = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  skillId: skillId.nullable().optional(),
});

export const habitsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listHabits(ctx.userId)),

  create: protectedProcedure
    .input(createInput)
    .mutation(({ ctx, input }) => createHabit(ctx.userId, input)),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).and(createInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const habit = await updateHabit(ctx.userId, id, rest);
      if (!habit) throw new TRPCError({ code: "NOT_FOUND" });
      return habit;
    }),

  toggleToday: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await toggleHabitToday(ctx.userId, input.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteHabit(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
