/**
 * tRPC Client Configuration for Next.js App Router
 */

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers/_app';

/**
 * tRPC React hooks
 * 
 * Usage:
 * ```tsx
 * import { trpc } from '@/lib/trpc';
 * 
 * // In a component:
 * const { data, isLoading } = trpc.match.getLive.useQuery();
 * const mutation = trpc.team.addFavorite.useMutation();
 * ```
 */
export const trpc = createTRPCReact<AppRouter>();

// Re-export types
export type { AppRouter };
