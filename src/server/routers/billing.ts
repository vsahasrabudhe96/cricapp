/**
 * Billing Router
 * 
 * tRPC procedures for Stripe subscription management:
 * - Create checkout session
 * - Create portal session
 * - Get subscription status
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

export const billingRouter = createTRPCRouter({
  /**
   * Create a Stripe checkout session for subscription
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        plan: z.enum(['monthly', 'yearly']),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe is not configured',
        });
      }

      const priceId =
        input.plan === 'monthly'
          ? process.env.STRIPE_PRICE_PRO_MONTHLY
          : process.env.STRIPE_PRICE_PRO_YEARLY;

      if (!priceId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe price not configured',
        });
      }

      // Get or create Stripe customer
      let subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.session.user.id },
      });

      let customerId = subscription?.stripeCustomerId;

      if (!customerId) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
        });

        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          metadata: {
            userId: ctx.session.user.id,
          },
        });

        customerId = customer.id;

        // Update subscription with Stripe customer ID
        await ctx.prisma.subscription.update({
          where: { userId: ctx.session.user.id },
          data: { stripeCustomerId: customerId },
        });
      }

      const baseUrl = process.env.APP_URL || 'http://localhost:3000';

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: input.successUrl || `${baseUrl}/dashboard?upgraded=true`,
        cancel_url: input.cancelUrl || `${baseUrl}/billing?canceled=true`,
        metadata: {
          userId: ctx.session.user.id,
        },
      });

      return { url: session.url };
    }),

  /**
   * Create a Stripe billing portal session
   */
  createPortalSession: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url().optional(),
      }).optional()
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe is not configured',
        });
      }

      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!subscription?.stripeCustomerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No Stripe customer found. Please subscribe first.',
        });
      }

      const baseUrl = process.env.APP_URL || 'http://localhost:3000';

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: input?.returnUrl || `${baseUrl}/billing`,
      });

      return { url: session.url };
    }),

  /**
   * Get subscription details with plan features
   */
  getSubscriptionDetails: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    const isPro = subscription?.plan === 'PRO' && subscription?.status === 'ACTIVE';

    // Plan feature limits
    const features = {
      FREE: {
        maxFavoriteTeams: 3,
        emailNotifications: false,
        pushNotifications: false,
        advancedStats: false,
        prioritySupport: false,
      },
      PRO: {
        maxFavoriteTeams: Infinity,
        emailNotifications: true,
        pushNotifications: true,
        advancedStats: true,
        prioritySupport: true,
      },
    };

    return {
      subscription,
      isPro,
      features: isPro ? features.PRO : features.FREE,
      prices: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ? 9.99 : null,
        yearly: process.env.STRIPE_PRICE_PRO_YEARLY ? 99.99 : null,
      },
    };
  }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!stripe) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Stripe is not configured',
      });
    }

    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No active subscription found',
      });
    }

    // Cancel at period end (user keeps access until then)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await ctx.prisma.subscription.update({
      where: { userId: ctx.session.user.id },
      data: { cancelAtPeriodEnd: true },
    });

    return { success: true };
  }),
});

