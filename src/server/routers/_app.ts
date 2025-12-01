/**
 * Root tRPC Router
 * 
 * Combines all domain routers into a single app router.
 * This is the entry point for the tRPC API.
 */

import { createTRPCRouter } from '../trpc';
import { matchRouter } from './match';
import { teamRouter } from './team';
import { playerRouter } from './player';
import { notificationRouter } from './notification';
import { userRouter } from './user';
import { billingRouter } from './billing';

/**
 * The root router containing all sub-routers
 */
export const appRouter = createTRPCRouter({
  match: matchRouter,
  team: teamRouter,
  player: playerRouter,
  notification: notificationRouter,
  user: userRouter,
  billing: billingRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

