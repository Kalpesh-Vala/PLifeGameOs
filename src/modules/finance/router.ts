import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createTransaction,
  deleteTransaction,
  getMonthSummary,
  listTransactions,
} from "@/modules/finance/service";

export const financeRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listTransactions(ctx.userId)),

  summary: protectedProcedure
    .input(
      z
        .object({ monthKey: z.string().regex(/^\d{4}-\d{2}$/) })
        .optional(),
    )
    .query(({ ctx, input }) =>
      getMonthSummary(ctx.userId, input?.monthKey),
    ),

  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["income", "expense"]),
        amount: z.number().positive().max(1_000_000_000),
        category: z.string().min(1).max(40),
        note: z.string().max(300).nullable().optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }),
    )
    .mutation(({ ctx, input }) => createTransaction(ctx.userId, input)),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteTransaction(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
