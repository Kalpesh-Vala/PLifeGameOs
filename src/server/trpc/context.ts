import { auth } from "@/server/auth";

/**
 * tRPC request context. Available to every procedure.
 * Holds the authenticated session (if any). Database connections are
 * established lazily inside procedures/services that need them.
 */
export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth();

  return {
    session,
    userId: session?.user?.id ?? null,
    headers: opts.headers,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
