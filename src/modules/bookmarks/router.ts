import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createBookmark,
  deleteBookmark,
  listBookmarks,
} from "@/modules/bookmarks/service";

export const bookmarksRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listBookmarks(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        url: z.string().url().max(2000),
        description: z.string().max(500).nullable().optional(),
        category: z.string().min(1).max(60),
        tags: z.array(z.string().min(1).max(40)).max(20).optional(),
      }),
    )
    .mutation(({ ctx, input }) => createBookmark(ctx.userId, input)),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteBookmark(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
