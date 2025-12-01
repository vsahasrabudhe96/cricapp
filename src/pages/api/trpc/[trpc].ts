/**
 * tRPC API Handler
 * 
 * This is the main entry point for all tRPC API requests.
 * Handles /api/trpc/* routes.
 */

import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/routers/_app';
import { createTRPCContext } from '@/server/trpc';

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
        }
      : undefined,
});

