import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  createNote,
  deleteNote,
  listNotes,
  togglePin,
  updateNote,
} from "@/modules/notes/service";

const baseInput = z.object({
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(20000),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
});

export const notesRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listNotes(ctx.userId)),

  create: protectedProcedure
    .input(baseInput)
    .mutation(({ ctx, input }) => createNote(ctx.userId, input)),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).and(baseInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const note = await updateNote(ctx.userId, id, rest);
      if (!note) throw new TRPCError({ code: "NOT_FOUND" });
      return note;
    }),

  togglePin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await togglePin(ctx.userId, input.id);
      if (!note) throw new TRPCError({ code: "NOT_FOUND" });
      return note;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteNote(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
