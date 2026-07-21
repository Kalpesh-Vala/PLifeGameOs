import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createJournal,
  deleteJournal,
  listJournal,
  updateJournal,
} from "@/modules/journal/service";

const baseInput = z.object({
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(20000),
  mood: z.number().int().min(1).max(5).nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
});

export const journalRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(({ ctx, input }) => listJournal(ctx.userId, input?.limit ?? 50)),

  create: protectedProcedure
    .input(baseInput)
    .mutation(({ ctx, input }) => createJournal(ctx.userId, input)),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).and(baseInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const entry = await updateJournal(ctx.userId, id, rest);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      return entry;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteJournal(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
