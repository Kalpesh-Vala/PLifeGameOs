import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createBook,
  deleteBook,
  listBooks,
  rateBook,
  setProgress,
  setStatus,
} from "@/modules/reading/service";

const status = z.enum(["want", "reading", "finished"]);

export const readingRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listBooks(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        author: z.string().max(120).nullable().optional(),
        totalPages: z.number().int().min(1).max(100000).nullable().optional(),
        status: status.optional(),
      }),
    )
    .mutation(({ ctx, input }) => createBook(ctx.userId, input)),

  setStatus: protectedProcedure
    .input(z.object({ id: z.string(), status }))
    .mutation(async ({ ctx, input }) => {
      const result = await setStatus(ctx.userId, input.id, input.status);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  setProgress: protectedProcedure
    .input(z.object({ id: z.string(), currentPage: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const result = await setProgress(ctx.userId, input.id, input.currentPage);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  rate: protectedProcedure
    .input(z.object({ id: z.string(), rating: z.number().int().min(1).max(5) }))
    .mutation(async ({ ctx, input }) => {
      const book = await rateBook(ctx.userId, input.id, input.rating);
      if (!book) throw new TRPCError({ code: "NOT_FOUND" });
      return book;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteBook(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
