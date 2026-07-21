import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { TIMELINE_CATEGORY_IDS } from "@/modules/timeline/lib/categories";
import {
  createTimelineEvent,
  deleteTimelineEvent,
  listTimeline,
} from "@/modules/timeline/service";

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);
const category = z.enum(TIMELINE_CATEGORY_IDS as [string, ...string[]]);

export const timelineRouter = createTRPCRouter({
  byDate: protectedProcedure
    .input(z.object({ date: dateKeySchema }))
    .query(({ ctx, input }) => listTimeline(ctx.userId, input.date)),

  create: protectedProcedure
    .input(
      z.object({
        date: dateKeySchema,
        time: timeSchema,
        title: z.string().min(1).max(200),
        category,
        note: z.string().max(1000).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createTimelineEvent(ctx.userId, {
        ...input,
        category: input.category as (typeof TIMELINE_CATEGORY_IDS)[number],
      }),
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteTimelineEvent(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
