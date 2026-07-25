import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { WORKOUT_TYPES } from "@/modules/fitness/types";
import {
  addWater,
  addWorkout,
  deleteWorkout,
  getFitnessToday,
  getRecentWorkouts,
  getWeightTrend,
  upsertMetrics,
} from "@/modules/fitness/service";

export const fitnessRouter = createTRPCRouter({
  today: protectedProcedure.query(({ ctx }) => getFitnessToday(ctx.userId)),

  weightTrend: protectedProcedure.query(({ ctx }) =>
    getWeightTrend(ctx.userId),
  ),

  recentWorkouts: protectedProcedure.query(({ ctx }) =>
    getRecentWorkouts(ctx.userId),
  ),

  saveMetrics: protectedProcedure
    .input(
      z.object({
        weightKg: z.number().min(20).max(400).nullable().optional(),
        sleepHours: z.number().min(0).max(24).nullable().optional(),
        calories: z.number().min(0).max(20000).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => upsertMetrics(ctx.userId, input)),

  addWater: protectedProcedure
    .input(z.object({ deltaMl: z.number().int().min(-1000).max(2000) }))
    .mutation(({ ctx, input }) => addWater(ctx.userId, input.deltaMl)),

  addWorkout: protectedProcedure
    .input(
      z.object({
        type: z.enum(WORKOUT_TYPES),
        durationMin: z.number().int().min(1).max(600),
        note: z.string().max(500).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => addWorkout(ctx.userId, input)),

  deleteWorkout: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteWorkout(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
