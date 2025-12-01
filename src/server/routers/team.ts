/**
 * Team Router
 * 
 * tRPC procedures for team data and favorites:
 * - List teams
 * - Search teams
 * - Manage favorite teams
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure, proProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Free plan limit for favorite teams
const FREE_FAVORITES_LIMIT = 3;

export const teamRouter = createTRPCRouter({
  /**
   * List all teams
   */
  list: publicProcedure
    .input(
      z.object({
        competitionType: z.enum(['INTERNATIONAL', 'DOMESTIC', 'FRANCHISE']).optional(),
        country: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const skip = (page - 1) * limit;

      const where: Parameters<typeof ctx.prisma.team.findMany>[0]['where'] = {};

      if (input?.country) {
        where.country = input.country;
      }

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { shortName: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      if (input?.competitionType) {
        where.competitions = {
          some: {
            competition: { type: input.competitionType },
          },
        };
      }

      const [teams, total] = await Promise.all([
        ctx.prisma.team.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
        ctx.prisma.team.count({ where }),
      ]);

      return {
        teams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Get team by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.prisma.team.findUnique({
        where: { id: input.id },
        include: {
          players: {
            where: { isActive: true },
            include: { player: true },
          },
          competitions: {
            include: { competition: true },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      return team;
    }),

  /**
   * Get user's favorite teams
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const favorites = await ctx.prisma.favoriteTeam.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        team: {
          include: {
            competitions: {
              include: { competition: true },
              take: 3,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => f.team);
  }),

  /**
   * Add team to favorites
   */
  addFavorite: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check subscription and current favorites count
      const [subscription, favoritesCount] = await Promise.all([
        ctx.prisma.subscription.findUnique({
          where: { userId: ctx.session.user.id },
        }),
        ctx.prisma.favoriteTeam.count({
          where: { userId: ctx.session.user.id },
        }),
      ]);

      const isPro = subscription?.plan === 'PRO' && subscription?.status === 'ACTIVE';

      if (!isPro && favoritesCount >= FREE_FAVORITES_LIMIT) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Free plan limited to ${FREE_FAVORITES_LIMIT} favorite teams. Upgrade to Pro for unlimited.`,
        });
      }

      // Check if team exists
      const team = await ctx.prisma.team.findUnique({
        where: { id: input.teamId },
      });

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      // Check if already favorited
      const existing = await ctx.prisma.favoriteTeam.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.session.user.id,
            teamId: input.teamId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Team already in favorites',
        });
      }

      await ctx.prisma.favoriteTeam.create({
        data: {
          userId: ctx.session.user.id,
          teamId: input.teamId,
        },
      });

      return { success: true };
    }),

  /**
   * Remove team from favorites
   */
  removeFavorite: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.favoriteTeam.delete({
        where: {
          userId_teamId: {
            userId: ctx.session.user.id,
            teamId: input.teamId,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Check if a team is favorited
   */
  isFavorite: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const favorite = await ctx.prisma.favoriteTeam.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.session.user.id,
            teamId: input.teamId,
          },
        },
      });

      return !!favorite;
    }),
});

