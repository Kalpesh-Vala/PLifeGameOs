import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { TRPCContext } from "@/server/trpc/context";
import { connectToDatabase } from "@/server/db/mongoose";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

/**
 * Ensures a Mongoose connection is available before the resolver runs.
 */
const dbMiddleware = t.middleware(async ({ next }) => {
  await connectToDatabase();
  return next();
});

/**
 * Protected procedure: requires an authenticated user and a live DB connection.
 * Narrows `ctx.userId` to a non-null string for downstream resolvers.
 */
export const protectedProcedure = t.procedure
  .use(dbMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.userId || !ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        userId: ctx.userId,
        session: ctx.session,
      },
    });
  });
