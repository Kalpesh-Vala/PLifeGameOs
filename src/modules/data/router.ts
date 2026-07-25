import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { enforceRateLimit } from "@/server/rate-limit";
import {
  deleteAllUserData,
  exportUserData,
  importUserData,
  resetProgress,
} from "@/modules/data/service";

export const dataRouter = createTRPCRouter({
  export: protectedProcedure.query(({ ctx }) => {
    enforceRateLimit(ctx.userId, "data:export", 5, 60_000);
    return exportUserData(ctx.userId);
  }),

  import: protectedProcedure
    .input(
      z.object({
        confirm: z.literal("IMPORT"),
        bundle: z.object({
          version: z.number().optional(),
          exportedAt: z.string().optional(),
          userId: z.string().optional(),
          collections: z.record(z.string(), z.array(z.unknown())),
        }),
      }),
    )
    .mutation(({ ctx, input }) => {
      enforceRateLimit(ctx.userId, "data:import", 3, 60_000);
      return importUserData(ctx.userId, input.bundle);
    }),

  resetProgress: protectedProcedure
    .input(z.object({ confirm: z.literal("RESET") }))
    .mutation(async ({ ctx, input }) => {
      if (input.confirm !== "RESET") {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      await resetProgress(ctx.userId);
      return { success: true };
    }),

  deleteAll: protectedProcedure
    .input(z.object({ confirm: z.literal("DELETE") }))
    .mutation(async ({ ctx, input }) => {
      if (input.confirm !== "DELETE") {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      return deleteAllUserData(ctx.userId);
    }),
});
