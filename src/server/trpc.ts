import { initTRPC } from "@trpc/server";

// Add authenticated user data and request-scoped services here when needed.
export const createTRPCContext = async (_options?: { headers?: Headers }) => ({});

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
