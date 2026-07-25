import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createVision,
  deleteVision,
  listVision,
} from "@/modules/vision/service";

export const visionRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listVision(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        imageUrl: z.string().url().max(2000).nullable().optional(),
        caption: z.string().max(500).nullable().optional(),
        category: z.string().max(60).optional(),
      }),
    )
    .mutation(({ ctx, input }) => createVision(ctx.userId, input)),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteVision(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
