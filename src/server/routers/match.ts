/**
 * Match Router
 * 
 * tRPC procedures for cricket match data:
 * - List matches (live, upcoming, recent)
 * - Get match details
 * - Filter by competition type
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { cricketApi } from '@/lib/cricket-api';
import { TRPCError } from '@trpc/server';

export const matchRouter = createTRPCRouter({
  /**
   * Get live matches
   */
  getLive: publicProcedure.query(async () => {
    try {
      const matches = await cricketApi.getLiveMatches();
      return matches ?? [];
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch live matches',
      });
    }
  }),

  /**
   * Get upcoming matches
   */
  getUpcoming: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(30).default(7),
        competitionType: z.enum(['international', 'domestic', 'franchise']).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        const matches = await cricketApi.getUpcomingMatches(input?.days ?? 7);
        
        if (input?.competitionType && matches) {
          return matches.filter(
            (m) => m.competition?.type === input.competitionType
          );
        }
        
        return matches ?? [];
      } catch (error) {
        console.error('Failed to fetch upcoming matches:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch upcoming matches',
        });
      }
    }),

  /**
   * Get match by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const match = await cricketApi.getMatchById(input.id);
        return match;
      } catch (error) {
        console.error('Failed to fetch match:', error);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        });
      }
    }),

  /**
   * Get matches for user's favorite teams (requires auth)
   */
  getForFavorites: protectedProcedure.query(async ({ ctx }) => {
    // Get user's favorite teams
    const favorites = await ctx.prisma.favoriteTeam.findMany({
      where: { userId: ctx.session.user.id },
      include: { team: true },
    });

    if (favorites.length === 0) {
      return { live: [], upcoming: [], recent: [] };
    }

    const teamExternalIds = favorites.map((f) => f.team.externalId);

    // Get all matches from API
    const [liveMatches, upcomingMatches] = await Promise.all([
      cricketApi.getLiveMatches().catch(() => []),
      cricketApi.getUpcomingMatches(7).catch(() => []),
    ]);

    // Filter matches for favorite teams
    const filterByTeam = (matches: typeof liveMatches) =>
      (matches ?? []).filter(
        (m) =>
          teamExternalIds.includes(m.homeTeam.id) ||
          teamExternalIds.includes(m.awayTeam.id)
      );

    return {
      live: filterByTeam(liveMatches),
      upcoming: filterByTeam(upcomingMatches),
      recent: [], // Would need recent matches endpoint
    };
  }),

  /**
   * Get recent/completed matches from API
   */
  getRecent: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(30).default(7),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        const matches = await cricketApi.getRecentMatches(input?.days ?? 7);
        return matches ?? [];
      } catch (error) {
        console.error('Failed to fetch recent matches:', error);
        return [];
      }
    }),

  /**
   * Get matches from database (synced data)
   */
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED']).optional(),
        competitionType: z.enum(['INTERNATIONAL', 'DOMESTIC', 'FRANCHISE']).optional(),
        teamId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Parameters<typeof ctx.prisma.match.findMany>[0]['where'] = {};

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.competitionType) {
        where.competition = { type: input.competitionType };
      }

      if (input?.teamId) {
        where.OR = [
          { homeTeamId: input.teamId },
          { awayTeamId: input.teamId },
        ];
      }

      const [matches, total] = await Promise.all([
        ctx.prisma.match.findMany({
          where,
          include: {
            homeTeam: true,
            awayTeam: true,
            competition: true,
          },
          orderBy: { startTime: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.match.count({ where }),
      ]);

      return {
        matches,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),
});

