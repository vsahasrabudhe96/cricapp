/**
 * Environment Variable Validation
 * 
 * Using Zod to validate environment variables at build time.
 * This ensures all required variables are present and correctly typed.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  
  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
  
  // Cricket API
  CRICKET_API_KEY: z.string().optional(),
  CRICKET_API_BASE_URL: z.string().url().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  
  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  
  // App
  APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Feature flags
  ENABLE_NOTIFICATIONS: z.string().transform((v) => v === 'true').default('true'),
  ENABLE_STRIPE: z.string().transform((v) => v === 'true').default('true'),
  
  // Polling config
  LIVE_MATCH_POLL_INTERVAL: z.string().transform(Number).default('30000'),
  UPCOMING_MATCH_POLL_INTERVAL: z.string().transform(Number).default('300000'),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

