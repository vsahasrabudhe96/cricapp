/**
 * Player Router
 * 
 * tRPC procedures for player data:
 * - Search players
 * - Get player details
 * - Get player statistics
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { cricketApi } from '@/lib/cricket-api';
import { TRPCError } from '@trpc/server';

export const playerRouter = createTRPCRouter({
  /**
   * Search players by name
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // First try database
      const dbPlayers = await ctx.prisma.player.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { fullName: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: input.limit,
      });

      if (dbPlayers.length > 0) {
        return dbPlayers;
      }

      // Fall back to API
      try {
        const response = await cricketApi.searchPlayers(input.query);
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to search players:', error);
        return [];
      }
    }),

  /**
   * Get player by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Try database first
      const dbPlayer = await ctx.prisma.player.findUnique({
        where: { id: input.id },
        include: {
          teams: {
            where: { isActive: true },
            include: { team: true },
          },
          stats: true,
        },
      });

      if (dbPlayer) {
        return dbPlayer;
      }

      // Try by external ID
      const dbPlayerByExternal = await ctx.prisma.player.findUnique({
        where: { externalId: input.id },
        include: {
          teams: {
            where: { isActive: true },
            include: { team: true },
          },
          stats: true,
        },
      });

      if (dbPlayerByExternal) {
        return dbPlayerByExternal;
      }

      // Fall back to API
      try {
        const player = await cricketApi.getPlayerById(input.id);
        return player;
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Player not found',
        });
      }
    }),

  /**
   * Get player statistics
   */
  getStats: publicProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Try database first
      const stats = await ctx.prisma.playerStats.findMany({
        where: { playerId: input.playerId },
      });

      if (stats.length > 0) {
        return stats;
      }

      // Try by external ID
      const player = await ctx.prisma.player.findUnique({
        where: { externalId: input.playerId },
        include: { stats: true },
      });

      if (player?.stats.length) {
        return player.stats;
      }

      // Fall back to API
      try {
        const apiStats = await cricketApi.getPlayerStats(input.playerId);
        return apiStats;
      } catch (error) {
        console.error('Failed to fetch player stats:', error);
        return [];
      }
    }),

  /**
   * List players from database
   */
  list: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
        role: z.enum(['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER']).optional(),
        teamId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const skip = (page - 1) * limit;

      const where: Parameters<typeof ctx.prisma.player.findMany>[0]['where'] = {};

      if (input?.country) {
        where.country = input.country;
      }

      if (input?.role) {
        where.role = input.role;
      }

      if (input?.teamId) {
        where.teams = {
          some: {
            teamId: input.teamId,
            isActive: true,
          },
        };
      }

      const [players, total] = await Promise.all([
        ctx.prisma.player.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
        ctx.prisma.player.count({ where }),
      ]);

      return {
        players,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),
});

