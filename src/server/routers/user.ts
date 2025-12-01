/**
 * User Router
 * 
 * tRPC procedures for user account management:
 * - Get current user
 * - Update profile
 * - Get subscription status
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';

export const userRouter = createTRPCRouter({
  /**
   * Get current user with subscription info
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        subscription: true,
        _count: {
          select: {
            favoriteTeams: true,
            notifications: { where: { read: false } },
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
      subscription: user.subscription,
      stats: {
        favoriteTeams: user._count.favoriteTeams,
        unreadNotifications: user._count.notifications,
      },
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          image: input.image,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    }),

  /**
   * Change password (for credential-based auth)
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user?.passwordHash) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password change not available for OAuth accounts',
        });
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      const newHash = await bcrypt.hash(input.newPassword, 12);

      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { passwordHash: newHash },
      });

      return { success: true };
    }),

  /**
   * Get subscription status
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription) {
      // Create a free subscription if none exists
      const newSub = await ctx.prisma.subscription.create({
        data: {
          userId: ctx.session.user.id,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });
      return newSub;
    }

    return subscription;
  }),

  /**
   * Delete account
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmation: z.literal('DELETE MY ACCOUNT'),
      })
    )
    .mutation(async ({ ctx }) => {
      // This will cascade delete all related data
      await ctx.prisma.user.delete({
        where: { id: ctx.session.user.id },
      });

      return { success: true };
    }),
});

