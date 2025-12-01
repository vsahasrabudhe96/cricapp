/**
 * Cricket API Factory
 * 
 * This module provides a unified interface to cricket data APIs.
 * The actual provider is abstracted, allowing easy swapping between:
 * - CricketData.org
 * - CricAPI
 * - Other providers
 * 
 * To add a new provider:
 * 1. Create a new file in ./providers/
 * 2. Implement the CricketApiProvider interface
 * 3. Add it to the provider factory below
 */

import { CricketDataProvider } from './providers/cricketdata';
import type { CricketApiProvider } from './types';

// Re-export types for convenience
export * from './types';

// Provider type for configuration
export type ProviderType = 'cricketdata' | 'cricapi' | 'mock';

/**
 * Create a cricket API provider instance
 */
export function createCricketApiProvider(type: ProviderType = 'cricketdata'): CricketApiProvider {
  switch (type) {
    case 'cricketdata':
      return new CricketDataProvider();
    case 'cricapi':
      // TODO: Implement CricAPI provider
      throw new Error('CricAPI provider not yet implemented');
    case 'mock':
      // TODO: Implement mock provider for testing
      throw new Error('Mock provider not yet implemented');
    default:
      return new CricketDataProvider();
  }
}

// Default provider instance
let defaultProvider: CricketApiProvider | null = null;

/**
 * Get the default cricket API provider
 */
export function getCricketApi(): CricketApiProvider {
  if (!defaultProvider) {
    defaultProvider = createCricketApiProvider();
  }
  return defaultProvider;
}

/**
 * Cricket API singleton with caching layer
 * 
 * This wraps the provider with Redis caching to:
 * - Reduce API calls (stay within rate limits)
 * - Improve response times
 * - Handle API downtime gracefully
 */
import { cache, CACHE_KEYS, CACHE_TTL } from '../redis';

export const cricketApi = {
  /**
   * Get live matches with caching
   */
  async getLiveMatches() {
    return cache.getOrSet(
      CACHE_KEYS.LIVE_MATCHES,
      async () => {
        const api = getCricketApi();
        const response = await api.getLiveMatches();
        if (!response.success) throw new Error(response.error);
        return response.data;
      },
      CACHE_TTL.LIVE_MATCH
    );
  },

  /**
   * Get upcoming matches with caching
   */
  async getUpcomingMatches(days = 7) {
    return cache.getOrSet(
      CACHE_KEYS.UPCOMING_MATCHES,
      async () => {
        const api = getCricketApi();
        const response = await api.getUpcomingMatches(days);
        if (!response.success) throw new Error(response.error);
        return response.data;
      },
      CACHE_TTL.UPCOMING_MATCH
    );
  },

  /**
   * Get match by ID with caching
   */
  async getMatchById(id: string) {
    return cache.getOrSet(
      CACHE_KEYS.MATCH_DETAIL(id),
      async () => {
        const api = getCricketApi();
        const response = await api.getMatchById(id);
        if (!response.success) throw new Error(response.error);
        return response.data;
      },
      CACHE_TTL.LIVE_MATCH // Short TTL as it might be live
    );
  },

  /**
   * Search players (no caching - search varies)
   */
  async searchPlayers(query: string) {
    const api = getCricketApi();
    return api.searchPlayers(query);
  },

  /**
   * Get player by ID with caching
   */
  async getPlayerById(id: string) {
    return cache.getOrSet(
      CACHE_KEYS.PLAYER(id),
      async () => {
        const api = getCricketApi();
        const response = await api.getPlayerById(id);
        if (!response.success) throw new Error(response.error);
        return response.data;
      },
      CACHE_TTL.PLAYER
    );
  },

  /**
   * Get player stats with caching
   */
  async getPlayerStats(id: string) {
    return cache.getOrSet(
      CACHE_KEYS.PLAYER_STATS(id),
      async () => {
        const api = getCricketApi();
        const response = await api.getPlayerStats(id);
        if (!response.success) throw new Error(response.error);
        return response.data;
      },
      CACHE_TTL.PLAYER_STATS
    );
  },

  /**
   * Get recent/completed matches
   */
  async getRecentMatches(days = 7) {
    return cache.getOrSet(
      'cricket:matches:recent',
      async () => {
        const api = getCricketApi();
        const response = await api.getRecentMatches(days);
        if (!response.success) throw new Error(response.error);
        return response.data;
      },
      CACHE_TTL.COMPLETED_MATCH
    );
  },

  /**
   * Get competitions (cached for longer)
   */
  async getCompetitions() {
    const api = getCricketApi();
    return api.getCompetitions();
  },

  /**
   * Clear all cricket caches
   */
  async clearCache() {
    await cache.delPattern('cricket:*');
  },
};

