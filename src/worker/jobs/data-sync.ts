/**
 * Data Sync Jobs
 * 
 * Syncs reference data from cricket APIs:
 * - Teams
 * - Competitions
 * - Players (as encountered)
 */

import { prisma } from '@/lib/prisma';
import { getCricketApi } from '@/lib/cricket-api';

/**
 * Sync teams and competitions from the API
 */
export async function syncTeamsAndCompetitions() {
  console.log('[Sync] Starting data sync...');
  
  const api = getCricketApi();
  
  // Sync competitions
  try {
    const competitionsResponse = await api.getCompetitions();
    
    if (competitionsResponse.success && competitionsResponse.data) {
      console.log(`[Sync] Found ${competitionsResponse.data.length} competitions`);
      
      for (const comp of competitionsResponse.data) {
        const typeMap: Record<string, 'INTERNATIONAL' | 'DOMESTIC' | 'FRANCHISE'> = {
          international: 'INTERNATIONAL',
          domestic: 'DOMESTIC',
          franchise: 'FRANCHISE',
        };

        await prisma.competition.upsert({
          where: { externalId: comp.id },
          create: {
            externalId: comp.id,
            name: comp.name,
            shortName: comp.shortName,
            type: typeMap[comp.type] || 'INTERNATIONAL',
            country: comp.country,
            season: comp.season,
            startDate: comp.startDate ? new Date(comp.startDate) : null,
            endDate: comp.endDate ? new Date(comp.endDate) : null,
            logoUrl: comp.logoUrl,
          },
          update: {
            name: comp.name,
            shortName: comp.shortName,
            season: comp.season,
            startDate: comp.startDate ? new Date(comp.startDate) : null,
            endDate: comp.endDate ? new Date(comp.endDate) : null,
          },
        });
      }
      
      console.log(`[Sync] Synced ${competitionsResponse.data.length} competitions`);
    }
  } catch (error) {
    console.error('[Sync] Error syncing competitions:', error);
  }

  // Sync teams from recent matches
  try {
    const [liveResponse, upcomingResponse] = await Promise.all([
      api.getLiveMatches(),
      api.getUpcomingMatches(30),
    ]);

    const allMatches = [
      ...(liveResponse.success ? liveResponse.data || [] : []),
      ...(upcomingResponse.success ? upcomingResponse.data || [] : []),
    ];

    const teamsMap = new Map<string, { id: string; name: string; shortName?: string; logoUrl?: string }>();
    
    for (const match of allMatches) {
      if (!teamsMap.has(match.homeTeam.id)) {
        teamsMap.set(match.homeTeam.id, match.homeTeam);
      }
      if (!teamsMap.has(match.awayTeam.id)) {
        teamsMap.set(match.awayTeam.id, match.awayTeam);
      }
    }

    console.log(`[Sync] Found ${teamsMap.size} teams from matches`);

    for (const team of teamsMap.values()) {
      await prisma.team.upsert({
        where: { externalId: team.id },
        create: {
          externalId: team.id,
          name: team.name,
          shortName: team.shortName,
          logoUrl: team.logoUrl,
        },
        update: {
          name: team.name,
          shortName: team.shortName,
          logoUrl: team.logoUrl,
        },
      });
    }

    console.log(`[Sync] Synced ${teamsMap.size} teams`);
  } catch (error) {
    console.error('[Sync] Error syncing teams:', error);
  }

  // Log sync completion
  await prisma.apiSyncLog.create({
    data: {
      provider: 'cricketdata',
      endpoint: 'data-sync',
      status: 'success',
    },
  });

  console.log('[Sync] Data sync completed');
}

/**
 * Sync a specific player's data
 */
export async function syncPlayer(externalId: string) {
  const api = getCricketApi();
  
  try {
    const response = await api.getPlayerById(externalId);
    
    if (!response.success || !response.data) {
      console.error(`[Sync] Player not found: ${externalId}`);
      return null;
    }

    const player = response.data;
    
    const roleMap: Record<string, 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER'> = {
      batsman: 'BATSMAN',
      bowler: 'BOWLER',
      all_rounder: 'ALL_ROUNDER',
      wicket_keeper: 'WICKET_KEEPER',
    };

    const battingStyleMap: Record<string, 'RIGHT_HANDED' | 'LEFT_HANDED'> = {
      right_handed: 'RIGHT_HANDED',
      left_handed: 'LEFT_HANDED',
    };

    const bowlingStyleMap: Record<string, 'RIGHT_ARM_FAST' | 'RIGHT_ARM_MEDIUM' | 'RIGHT_ARM_OFFBREAK' | 'RIGHT_ARM_LEGBREAK' | 'LEFT_ARM_FAST' | 'LEFT_ARM_MEDIUM' | 'LEFT_ARM_ORTHODOX' | 'LEFT_ARM_CHINAMAN' | 'NONE'> = {
      right_arm_fast: 'RIGHT_ARM_FAST',
      right_arm_medium: 'RIGHT_ARM_MEDIUM',
      right_arm_offbreak: 'RIGHT_ARM_OFFBREAK',
      right_arm_legbreak: 'RIGHT_ARM_LEGBREAK',
      left_arm_fast: 'LEFT_ARM_FAST',
      left_arm_medium: 'LEFT_ARM_MEDIUM',
      left_arm_orthodox: 'LEFT_ARM_ORTHODOX',
      left_arm_chinaman: 'LEFT_ARM_CHINAMAN',
      none: 'NONE',
    };

    const dbPlayer = await prisma.player.upsert({
      where: { externalId: player.id },
      create: {
        externalId: player.id,
        name: player.name,
        fullName: player.fullName,
        country: player.country,
        dateOfBirth: player.dateOfBirth ? new Date(player.dateOfBirth) : null,
        role: player.role ? roleMap[player.role] : null,
        battingStyle: player.battingStyle ? battingStyleMap[player.battingStyle] : null,
        bowlingStyle: player.bowlingStyle ? bowlingStyleMap[player.bowlingStyle] : null,
        imageUrl: player.imageUrl,
      },
      update: {
        name: player.name,
        fullName: player.fullName,
        country: player.country,
        role: player.role ? roleMap[player.role] : null,
        imageUrl: player.imageUrl,
      },
    });

    console.log(`[Sync] Synced player: ${player.name}`);
    return dbPlayer;
  } catch (error) {
    console.error(`[Sync] Error syncing player ${externalId}:`, error);
    return null;
  }
}

