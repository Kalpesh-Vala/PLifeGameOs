import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import {
  getSettings,
  updateSettings,
  completeOnboarding,
} from "@/modules/settings/service";

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) => getSettings(ctx.userId)),

  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().max(80).nullable().optional(),
        currency: z.string().min(1).max(4).optional(),
        aiContextEnabled: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => updateSettings(ctx.userId, input)),

  completeOnboarding: protectedProcedure
    .input(
      z
        .object({ displayName: z.string().max(80).nullable().optional() })
        .optional(),
    )
    .mutation(({ ctx, input }) =>
      completeOnboarding(ctx.userId, input?.displayName),
    ),
});
