import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { getMonth, getDay } from "@/modules/calendar/service";

export const calendarRouter = createTRPCRouter({
  month: protectedProcedure
    .input(z.object({ monthKey: z.string().regex(/^\d{4}-\d{2}$/) }))
    .query(({ ctx, input }) => getMonth(ctx.userId, input.monthKey)),

  day: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(({ ctx, input }) => getDay(ctx.userId, input.date)),
});
