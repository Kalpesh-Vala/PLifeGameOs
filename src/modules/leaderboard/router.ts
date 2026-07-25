import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { getLeaderboard } from "@/modules/leaderboard/service";

export const leaderboardRouter = createTRPCRouter({
  overview: protectedProcedure.query(({ ctx }) => getLeaderboard(ctx.userId)),
});
