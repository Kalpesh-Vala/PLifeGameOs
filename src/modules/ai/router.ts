import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { isAiConfigured } from "@/env";
import {
  clearChatHistory,
  generateNudge,
  getChatHistory,
  sendMessage,
} from "@/modules/ai/service";
import { generateReview, getLatestReview } from "@/modules/ai/reviews";

const period = z.enum(["weekly", "monthly"]);

export const aiRouter = createTRPCRouter({
  status: protectedProcedure.query(() => ({ configured: isAiConfigured })),

  chat: createTRPCRouter({
    history: protectedProcedure.query(({ ctx }) => getChatHistory(ctx.userId)),
    send: protectedProcedure
      .input(z.object({ message: z.string().min(1).max(4000) }))
      .mutation(({ ctx, input }) => sendMessage(ctx.userId, input.message)),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearChatHistory(ctx.userId);
      return { success: true };
    }),
  }),

  nudge: protectedProcedure.mutation(({ ctx }) => generateNudge(ctx.userId)),

  reviews: createTRPCRouter({
    latest: protectedProcedure
      .input(z.object({ period }))
      .query(({ ctx, input }) => getLatestReview(ctx.userId, input.period)),
    generate: protectedProcedure
      .input(z.object({ period }))
      .mutation(({ ctx, input }) => generateReview(ctx.userId, input.period)),
  }),
});
