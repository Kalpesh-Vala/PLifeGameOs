import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { getQuestBoard, claimQuest } from "@/modules/quests/service";

const period = z.enum(["daily", "weekly"]);

export const questsRouter = createTRPCRouter({
  board: protectedProcedure
    .input(z.object({ period }))
    .query(({ ctx, input }) => getQuestBoard(ctx.userId, input.period)),

  claim: protectedProcedure
    .input(z.object({ period, defId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await claimQuest(ctx.userId, input.period, input.defId);
      if (result === null) throw new TRPCError({ code: "NOT_FOUND" });
      if (result === "already-claimed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reward already claimed.",
        });
      }
      if (result === "not-ready") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest is not complete yet.",
        });
      }
      return result;
    }),
});
