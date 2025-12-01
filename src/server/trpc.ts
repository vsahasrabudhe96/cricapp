/**
 * tRPC Server Configuration
 * 
 * This file sets up the tRPC server with:
 * - Context creation (session, db access)
 * - Middleware for auth protection
 * - Base procedure builders
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { type Session } from 'next-auth';

/**
 * Context available to all tRPC procedures
 */
interface CreateContextOptions {
  session: Session | null;
}

/**
 * Creates context for incoming requests
 * Can be used for testing by passing in a mock session
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * Creates context for API requests
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, authOptions);
  return createInnerTRPCContext({
    session,
  });
};

/**
 * Initialize tRPC with superjson transformer for better type support
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Create a router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Middleware that enforces users are logged in
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Middleware to check subscription status
 */
const enforceProSubscription = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  const subscription = await ctx.prisma.subscription.findUnique({
    where: { userId: ctx.session.user.id },
  });
  
  if (!subscription || subscription.plan !== 'PRO' || subscription.status !== 'ACTIVE') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'This feature requires a Pro subscription',
    });
  }
  
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      subscription,
    },
  });
});

/**
 * Pro procedure - requires Pro subscription
 */
export const proProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceProSubscription);

