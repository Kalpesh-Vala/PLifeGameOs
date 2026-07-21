import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { getMoodTrend, getTodayMood, logMood } from "@/modules/mood/service";

export const moodRouter = createTRPCRouter({
  today: protectedProcedure.query(({ ctx }) => getTodayMood(ctx.userId)),

  trend: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(90).default(30) }).optional())
    .query(({ ctx, input }) => getMoodTrend(ctx.userId, input?.days ?? 30)),

  log: protectedProcedure
    .input(
      z.object({
        mood: z.number().int().min(1).max(5),
        energy: z.number().int().min(1).max(5).nullable().optional(),
        note: z.string().max(1000).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      logMood(ctx.userId, {
        mood: input.mood as 1 | 2 | 3 | 4 | 5,
        energy: input.energy ?? null,
        note: input.note ?? null,
      }),
    ),
});
