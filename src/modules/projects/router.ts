import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { PROJECT_STATUSES } from "@/modules/projects/types";
import {
  createProject,
  deleteProject,
  listProjects,
  setProjectStatus,
} from "@/modules/projects/service";

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => listProjects(ctx.userId)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).nullable().optional(),
        status: z.enum(PROJECT_STATUSES).optional(),
        techStack: z.array(z.string().min(1).max(30)).max(20).optional(),
        url: z.string().url().max(500).nullable().optional(),
        repoUrl: z.string().url().max(500).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => createProject(ctx.userId, input)),

  setStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.enum(PROJECT_STATUSES) }))
    .mutation(async ({ ctx, input }) => {
      const result = await setProjectStatus(ctx.userId, input.id, input.status);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteProject(ctx.userId, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
