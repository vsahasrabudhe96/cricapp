/**
 * Notification Router
 * 
 * tRPC procedures for notification management:
 * - Get user notifications
 * - Mark as read
 * - Manage notification preferences
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const notificationRouter = createTRPCRouter({
  /**
   * Get user's notifications
   */
  list: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;

      const where: Parameters<typeof ctx.prisma.notification.findMany>[0]['where'] = {
        userId: ctx.session.user.id,
      };

      if (input?.unreadOnly) {
        where.read = false;
      }

      const notifications = await ctx.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
    });

    return count;
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification || notification.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      await ctx.prisma.notification.update({
        where: { id: input.id },
        data: { read: true },
      });

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await ctx.prisma.notificationPreference.findMany({
      where: { userId: ctx.session.user.id },
    });

    // Group by type
    const grouped = preferences.reduce(
      (acc, pref) => {
        if (!acc[pref.type]) {
          acc[pref.type] = {};
        }
        acc[pref.type][pref.channel] = pref.enabled;
        return acc;
      },
      {} as Record<string, Record<string, boolean>>
    );

    return grouped;
  }),

  /**
   * Update notification preference
   */
  updatePreference: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          'MATCH_START',
          'TOSS_RESULT',
          'PLAYING_XI',
          'MATCH_RESULT',
          'INNINGS_BREAK',
          'MILESTONE',
        ]),
        channel: z.enum(['EMAIL', 'IN_APP', 'PUSH']),
        enabled: z.boolean(),
        teamId: z.string().optional(), // For team-specific preferences
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notificationPreference.upsert({
        where: {
          userId_teamId_type_channel: {
            userId: ctx.session.user.id,
            teamId: input.teamId ?? null,
            type: input.type,
            channel: input.channel,
          },
        },
        create: {
          userId: ctx.session.user.id,
          teamId: input.teamId,
          type: input.type,
          channel: input.channel,
          enabled: input.enabled,
        },
        update: {
          enabled: input.enabled,
        },
      });

      return { success: true };
    }),

  /**
   * Bulk update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        preferences: z.array(
          z.object({
            type: z.enum([
              'MATCH_START',
              'TOSS_RESULT',
              'PLAYING_XI',
              'MATCH_RESULT',
              'INNINGS_BREAK',
              'MILESTONE',
            ]),
            channel: z.enum(['EMAIL', 'IN_APP', 'PUSH']),
            enabled: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update all preferences in a transaction
      await ctx.prisma.$transaction(
        input.preferences.map((pref) =>
          ctx.prisma.notificationPreference.upsert({
            where: {
              userId_teamId_type_channel: {
                userId: ctx.session.user.id,
                teamId: null,
                type: pref.type,
                channel: pref.channel,
              },
            },
            create: {
              userId: ctx.session.user.id,
              type: pref.type,
              channel: pref.channel,
              enabled: pref.enabled,
            },
            update: {
              enabled: pref.enabled,
            },
          })
        )
      );

      return { success: true };
    }),
});

