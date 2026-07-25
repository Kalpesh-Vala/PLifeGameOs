import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createEntry,
  deleteEntry,
  listEntries,
  updateEntry,
} from "@/modules/knowledge/service";

const baseInput = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
  category: z.string().min(1).max(60),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
});

export const knowledgeRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listEntries(ctx.userId)),

  create: protectedProcedure
    .input(baseInput)
    .mutation(({ ctx, input }) => createEntry(ctx.userId, input)),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).and(baseInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const entry = await updateEntry(ctx.userId, id, rest);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      return entry;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteEntry(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
