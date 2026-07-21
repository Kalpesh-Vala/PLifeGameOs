import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { getAnalyticsOverview } from "@/modules/analytics/service";

export const analyticsRouter = createTRPCRouter({
  overview: protectedProcedure.query(({ ctx }) =>
    getAnalyticsOverview(ctx.userId),
  ),
});
