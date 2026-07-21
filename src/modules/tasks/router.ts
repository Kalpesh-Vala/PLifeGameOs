import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { SKILL_IDS } from "@/modules/gamification/lib/skills";
import {
  completeTask,
  createTask,
  deleteTask,
  listTasks,
  reopenTask,
  updateTask,
} from "@/modules/tasks/service";

const skillId = z.enum(SKILL_IDS as [string, ...string[]]);

const createInput = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.date().nullable().optional(),
  skillId: skillId.nullable().optional(),
});

export const tasksRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listTasks(ctx.userId)),

  create: protectedProcedure
    .input(createInput)
    .mutation(({ ctx, input }) => createTask(ctx.userId, input)),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).and(createInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const task = await updateTask(ctx.userId, id, rest);
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      return task;
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await completeTask(ctx.userId, input.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  reopen: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await reopenTask(ctx.userId, input.id);
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      return task;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteTask(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
