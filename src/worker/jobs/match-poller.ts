/**
 * Match Polling Jobs
 * 
 * Polls cricket APIs for:
 * - Live match updates
 * - Upcoming matches
 * - Match state changes (for notifications)
 */

import { prisma } from '@/lib/prisma';
import { cricketApi } from '@/lib/cricket-api';
import type { ApiMatch } from '@/lib/cricket-api/types';
import { createMatchNotification } from './notification-sender';

// Map API status to DB status
function mapStatus(status: string): 'SCHEDULED' | 'TOSS_DONE' | 'LIVE' | 'INNINGS_BREAK' | 'STUMPS' | 'DELAYED' | 'ABANDONED' | 'COMPLETED' | 'NO_RESULT' {
  const statusMap: Record<string, 'SCHEDULED' | 'TOSS_DONE' | 'LIVE' | 'INNINGS_BREAK' | 'STUMPS' | 'DELAYED' | 'ABANDONED' | 'COMPLETED' | 'NO_RESULT'> = {
    scheduled: 'SCHEDULED',
    toss_done: 'TOSS_DONE',
    live: 'LIVE',
    innings_break: 'INNINGS_BREAK',
    stumps: 'STUMPS',
    delayed: 'DELAYED',
    abandoned: 'ABANDONED',
    completed: 'COMPLETED',
    no_result: 'NO_RESULT',
  };
  return statusMap[status] || 'SCHEDULED';
}

// Map API format to DB format
function mapFormat(format: string): 'TEST' | 'ODI' | 'T20I' | 'T20' | 'LIST_A' | 'FIRST_CLASS' {
  const formatMap: Record<string, 'TEST' | 'ODI' | 'T20I' | 'T20' | 'LIST_A' | 'FIRST_CLASS'> = {
    test: 'TEST',
    odi: 'ODI',
    t20i: 'T20I',
    t20: 'T20',
    list_a: 'LIST_A',
    first_class: 'FIRST_CLASS',
  };
  return formatMap[format] || 'T20';
}

/**
 * Poll live matches and update database
 */
export async function pollLiveMatches() {
  console.log('[Poller] Polling live matches...');
  
  try {
    const matches = await cricketApi.getLiveMatches();
    
    if (!matches || matches.length === 0) {
      console.log('[Poller] No live matches found');
      return;
    }

    console.log(`[Poller] Found ${matches.length} live matches`);

    for (const match of matches) {
      await processMatch(match);
    }

    // Log sync
    await prisma.apiSyncLog.create({
      data: {
        provider: 'cricketdata',
        endpoint: 'live-matches',
        status: 'success',
        recordsCount: matches.length,
      },
    });
  } catch (error) {
    console.error('[Poller] Error polling live matches:', error);
    
    await prisma.apiSyncLog.create({
      data: {
        provider: 'cricketdata',
        endpoint: 'live-matches',
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Poll upcoming matches
 */
export async function pollUpcomingMatches() {
  console.log('[Poller] Polling upcoming matches...');
  
  try {
    const matches = await cricketApi.getUpcomingMatches(7);
    
    if (!matches || matches.length === 0) {
      console.log('[Poller] No upcoming matches found');
      return;
    }

    console.log(`[Poller] Found ${matches.length} upcoming matches`);

    for (const match of matches) {
      await processMatch(match);
    }

    await prisma.apiSyncLog.create({
      data: {
        provider: 'cricketdata',
        endpoint: 'upcoming-matches',
        status: 'success',
        recordsCount: matches.length,
      },
    });
  } catch (error) {
    console.error('[Poller] Error polling upcoming matches:', error);
    
    await prisma.apiSyncLog.create({
      data: {
        provider: 'cricketdata',
        endpoint: 'upcoming-matches',
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Process a single match and check for state changes
 */
async function processMatch(apiMatch: ApiMatch) {
  // Ensure teams exist
  const homeTeam = await ensureTeam(apiMatch.homeTeam);
  const awayTeam = await ensureTeam(apiMatch.awayTeam);
  
  // Ensure competition exists (if provided)
  let competitionId: string | undefined;
  if (apiMatch.competition) {
    const competition = await ensureCompetition(apiMatch.competition);
    competitionId = competition.id;
  }

  // If no competition, create a default one
  if (!competitionId) {
    const defaultCompetition = await prisma.competition.upsert({
      where: { externalId: 'default' },
      create: {
        externalId: 'default',
        name: 'Other Matches',
        type: 'INTERNATIONAL',
      },
      update: {},
    });
    competitionId = defaultCompetition.id;
  }

  // Get current state from database
  const existingMatch = await prisma.match.findUnique({
    where: { externalId: apiMatch.id },
  });

  const newStatus = mapStatus(apiMatch.status);
  const newFormat = mapFormat(apiMatch.format);
  
  // Prepare live score data
  const currentScore = apiMatch.score?.[0];
  const scoreString = currentScore 
    ? `${currentScore.runs}/${currentScore.wickets}` 
    : null;

  // Upsert the match
  const match = await prisma.match.upsert({
    where: { externalId: apiMatch.id },
    create: {
      externalId: apiMatch.id,
      competitionId,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      format: newFormat,
      status: newStatus,
      venue: apiMatch.venue,
      city: apiMatch.city,
      startTime: new Date(apiMatch.startTime),
      tossWinnerId: apiMatch.tossWinner 
        ? (apiMatch.tossWinner === apiMatch.homeTeam.id ? homeTeam.id : awayTeam.id)
        : null,
      tossDecision: apiMatch.tossDecision,
      winnerId: apiMatch.winner
        ? (apiMatch.winner === apiMatch.homeTeam.id ? homeTeam.id : awayTeam.id)
        : null,
      result: apiMatch.result,
      currentScore: scoreString,
      currentOvers: currentScore?.overs,
      lastPolledAt: new Date(),
    },
    update: {
      status: newStatus,
      tossWinnerId: apiMatch.tossWinner
        ? (apiMatch.tossWinner === apiMatch.homeTeam.id ? homeTeam.id : awayTeam.id)
        : null,
      tossDecision: apiMatch.tossDecision,
      winnerId: apiMatch.winner
        ? (apiMatch.winner === apiMatch.homeTeam.id ? homeTeam.id : awayTeam.id)
        : null,
      result: apiMatch.result,
      currentScore: scoreString,
      currentOvers: currentScore?.overs,
      currentRR: currentScore?.runRate,
      lastPolledAt: new Date(),
    },
  });

  // Check for state changes and create notifications
  if (existingMatch) {
    await checkForStateChanges(existingMatch, match, homeTeam, awayTeam, apiMatch);
  }
}

/**
 * Check for match state changes and create notifications
 */
async function checkForStateChanges(
  oldMatch: { status: string; tossWinnerId: string | null; winnerId: string | null },
  newMatch: { id: string; status: string; tossWinnerId: string | null; winnerId: string | null },
  homeTeam: { id: string; name: string },
  awayTeam: { id: string; name: string },
  apiMatch: ApiMatch
) {
  // Match started (SCHEDULED -> LIVE)
  if (oldMatch.status === 'SCHEDULED' && newMatch.status === 'LIVE') {
    await createMatchNotification({
      matchId: newMatch.id,
      type: 'MATCH_START',
      title: `${homeTeam.name} vs ${awayTeam.name} - Match Started!`,
      body: `The match has begun. Follow live updates!`,
      teamIds: [homeTeam.id, awayTeam.id],
    });
  }

  // Toss completed
  if (!oldMatch.tossWinnerId && newMatch.tossWinnerId) {
    const tossWinner = newMatch.tossWinnerId === homeTeam.id ? homeTeam.name : awayTeam.name;
    await createMatchNotification({
      matchId: newMatch.id,
      type: 'TOSS_RESULT',
      title: `Toss Result: ${tossWinner} won`,
      body: `${tossWinner} won the toss and chose to ${apiMatch.tossDecision}`,
      teamIds: [homeTeam.id, awayTeam.id],
    });
  }

  // Match completed
  if (oldMatch.status !== 'COMPLETED' && newMatch.status === 'COMPLETED' && newMatch.winnerId) {
    const winner = newMatch.winnerId === homeTeam.id ? homeTeam.name : awayTeam.name;
    await createMatchNotification({
      matchId: newMatch.id,
      type: 'MATCH_RESULT',
      title: `Match Result: ${winner} won!`,
      body: apiMatch.result || `${winner} has won the match`,
      teamIds: [homeTeam.id, awayTeam.id],
    });
  }

  // Innings break
  if (oldMatch.status !== 'INNINGS_BREAK' && newMatch.status === 'INNINGS_BREAK') {
    await createMatchNotification({
      matchId: newMatch.id,
      type: 'INNINGS_BREAK',
      title: `Innings Break`,
      body: `First innings completed. Second innings to follow.`,
      teamIds: [homeTeam.id, awayTeam.id],
    });
  }
}

/**
 * Ensure a team exists in the database
 */
async function ensureTeam(apiTeam: { id: string; name: string; shortName?: string; logoUrl?: string }) {
  return prisma.team.upsert({
    where: { externalId: apiTeam.id },
    create: {
      externalId: apiTeam.id,
      name: apiTeam.name,
      shortName: apiTeam.shortName,
      logoUrl: apiTeam.logoUrl,
    },
    update: {
      name: apiTeam.name,
      shortName: apiTeam.shortName,
      logoUrl: apiTeam.logoUrl,
    },
  });
}

/**
 * Ensure a competition exists in the database
 */
async function ensureCompetition(apiCompetition: { id: string; name: string; type: string }) {
  const typeMap: Record<string, 'INTERNATIONAL' | 'DOMESTIC' | 'FRANCHISE'> = {
    international: 'INTERNATIONAL',
    domestic: 'DOMESTIC',
    franchise: 'FRANCHISE',
  };

  return prisma.competition.upsert({
    where: { externalId: apiCompetition.id },
    create: {
      externalId: apiCompetition.id,
      name: apiCompetition.name,
      type: typeMap[apiCompetition.type] || 'INTERNATIONAL',
    },
    update: {
      name: apiCompetition.name,
    },
  });
}

