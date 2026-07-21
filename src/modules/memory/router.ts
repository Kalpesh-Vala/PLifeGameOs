import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  addMemory,
  deleteMemory,
  listMemories,
} from "@/modules/memory/service";

const kind = z.enum([
  "fact",
  "event",
  "insight",
  "journal",
  "review",
  "preference",
]);

export const memoryRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listMemories(ctx.userId)),

  add: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(2000),
        kind: kind.optional(),
        importance: z.number().int().min(1).max(5).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      addMemory(ctx.userId, { ...input, source: "user" }),
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteMemory(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
