/**
 * Redis Client Configuration
 * 
 * Used for:
 * - Caching cricket API responses
 * - Rate limiting
 * - Session storage (optional)
 * - BullMQ job queues
 * 
 * Falls back to in-memory cache if Redis is not available.
 */

import Redis from 'ioredis';

// Check if Redis is configured
const redisUrl = process.env.REDIS_URL;
const isRedisConfigured = !!redisUrl && redisUrl !== 'redis://localhost:6379';

// Singleton pattern for Redis client
const globalForRedis = globalThis as unknown as {
  redis: Redis | null;
  memoryCache: Map<string, { value: string; expiry: number | null }>;
};

function createRedisClient(): Redis | null {
  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL not set - using in-memory cache (not suitable for production)');
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️  Redis connection failed - falling back to in-memory cache');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });

    client.on('error', (err) => {
      console.warn('⚠️  Redis error:', err.message);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    return client;
  } catch (error) {
    console.warn('⚠️  Failed to create Redis client - using in-memory cache');
    return null;
  }
}

// Initialize memory cache for fallback
if (!globalForRedis.memoryCache) {
  globalForRedis.memoryCache = new Map();
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// In-memory cache fallback
const memoryCache = globalForRedis.memoryCache;

function isExpired(expiry: number | null): boolean {
  if (expiry === null) return false;
  return Date.now() > expiry;
}

/**
 * Cache helper functions
 * Works with Redis if available, falls back to in-memory cache
 */
export const cache = {
  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (redis) {
      try {
        const value = await redis.get(key);
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      } catch {
        // Fall through to memory cache
      }
    }

    // Memory cache fallback
    const cached = memoryCache.get(key);
    if (!cached || isExpired(cached.expiry)) {
      memoryCache.delete(key);
      return null;
    }
    try {
      return JSON.parse(cached.value) as T;
    } catch {
      return cached.value as T;
    }
  },

  /**
   * Set a cached value with optional TTL (in seconds)
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    // Try Redis first
    if (redis) {
      try {
        if (ttlSeconds) {
          await redis.setex(key, ttlSeconds, stringValue);
        } else {
          await redis.set(key, stringValue);
        }
        return;
      } catch {
        // Fall through to memory cache
      }
    }

    // Memory cache fallback
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    memoryCache.set(key, { value: stringValue, expiry });
  },

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(key);
      } catch {
        // Ignore
      }
    }
    memoryCache.delete(key);
  },

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (redis) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch {
        // Ignore
      }
    }

    // Memory cache - simple pattern matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  },

  /**
   * Get or set a cached value
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  },
};

// Cache key prefixes for organization
export const CACHE_KEYS = {
  LIVE_MATCHES: 'cricket:matches:live',
  UPCOMING_MATCHES: 'cricket:matches:upcoming',
  MATCH_DETAIL: (id: string) => `cricket:match:${id}`,
  TEAM: (id: string) => `cricket:team:${id}`,
  PLAYER: (id: string) => `cricket:player:${id}`,
  PLAYER_STATS: (id: string) => `cricket:player:${id}:stats`,
  USER_FAVORITES: (userId: string) => `user:${userId}:favorites`,
};

// Default TTLs (in seconds)
export const CACHE_TTL = {
  LIVE_MATCH: 30,        // 30 seconds for live data
  UPCOMING_MATCH: 300,   // 5 minutes for upcoming
  COMPLETED_MATCH: 3600, // 1 hour for completed
  TEAM: 86400,           // 24 hours
  PLAYER: 3600,          // 1 hour
  PLAYER_STATS: 3600,    // 1 hour
};

export default redis;
