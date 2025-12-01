/**
 * CricketData.org API Provider
 * 
 * Implementation of the CricketApiProvider interface for CricketData.org.
 * This is a popular free API with good coverage of international and major tournaments.
 * 
 * API Documentation: https://cricketdata.org/
 * 
 * Free tier limits:
 * - 100 requests/day
 * - Limited to current matches and recent data
 */

import {
  type CricketApiProvider,
  type ApiResponse,
  type ApiMatch,
  type ApiTeam,
  type ApiPlayer,
  type ApiPlayerStats,
  type ApiCompetition,
  type MatchStatus,
  type MatchFormat,
  type CompetitionType,
} from '../types';

// ===========================================
// CricketData.org Response Types
// ===========================================

interface CricDataMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo?: Array<{
    name: string;
    shortname: string;
    img: string;
  }>;
  score?: Array<{
    r: number;
    w: number;
    o: number;
    inning: string;
  }>;
  series_id?: string;
  fantasyEnabled?: boolean;
  bbbEnabled?: boolean;
  hasSquad?: boolean;
  matchStarted?: boolean;
  matchEnded?: boolean;
}

interface CricDataPlayer {
  id: string;
  name: string;
  country: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  role?: string;
}

// ===========================================
// Status & Format Mappings
// ===========================================

function mapStatus(status: string, matchStarted?: boolean, matchEnded?: boolean): MatchStatus {
  const statusLower = status.toLowerCase();
  
  if (matchEnded) return 'completed';
  if (statusLower.includes('live') || statusLower.includes('in progress')) return 'live';
  if (statusLower.includes('innings break')) return 'innings_break';
  if (statusLower.includes('stumps')) return 'stumps';
  if (statusLower.includes('delayed') || statusLower.includes('rain')) return 'delayed';
  if (statusLower.includes('abandoned')) return 'abandoned';
  if (statusLower.includes('no result')) return 'no_result';
  if (statusLower.includes('toss')) return 'toss_done';
  if (!matchStarted) return 'scheduled';
  
  return 'scheduled';
}

function mapFormat(matchType: string): MatchFormat {
  const typeLower = matchType.toLowerCase();
  
  if (typeLower === 'test') return 'test';
  if (typeLower === 'odi') return 'odi';
  if (typeLower === 't20i') return 't20i';
  if (typeLower === 't20') return 't20';
  if (typeLower.includes('list a')) return 'list_a';
  if (typeLower.includes('first class') || typeLower.includes('fc')) return 'first_class';
  
  return 't20'; // Default to T20 for franchise leagues
}

// ===========================================
// CricketData Provider Implementation
// ===========================================

export class CricketDataProvider implements CricketApiProvider {
  readonly name = 'cricketdata';
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.CRICKET_API_BASE_URL || 'https://api.cricapi.com/v1';
    this.apiKey = process.env.CRICKET_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('CRICKET_API_KEY not set. API calls will fail.');
    }
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('apikey', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'failure') {
      throw new Error(data.reason || 'API request failed');
    }

    return data;
  }

  private mapMatch(match: CricDataMatch): ApiMatch {
    const homeTeam = match.teamInfo?.[0] || { name: match.teams[0], shortname: match.teams[0], img: '' };
    const awayTeam = match.teamInfo?.[1] || { name: match.teams[1], shortname: match.teams[1], img: '' };
    
    const scores = match.score?.map((s, i) => ({
      innings: i + 1,
      teamId: s.inning.includes(homeTeam.name) ? 'home' : 'away',
      runs: s.r,
      wickets: s.w,
      overs: s.o.toString(),
    }));

    return {
      id: match.id,
      name: match.name,
      status: mapStatus(match.status, match.matchStarted, match.matchEnded),
      format: mapFormat(match.matchType),
      venue: match.venue,
      startTime: match.dateTimeGMT,
      homeTeam: {
        id: `team_${homeTeam.shortname}`,
        name: homeTeam.name,
        shortName: homeTeam.shortname,
        logoUrl: homeTeam.img,
      },
      awayTeam: {
        id: `team_${awayTeam.shortname}`,
        name: awayTeam.name,
        shortName: awayTeam.shortname,
        logoUrl: awayTeam.img,
      },
      score: scores,
      result: match.matchEnded ? match.status : undefined,
    };
  }

  async getLiveMatches(): Promise<ApiResponse<ApiMatch[]>> {
    try {
      const data = await this.fetch<{ data: CricDataMatch[] }>('/currentMatches');
      const liveMatches = data.data
        .filter((m) => m.matchStarted && !m.matchEnded)
        .map((m) => this.mapMatch(m));
      
      return { success: true, data: liveMatches };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch live matches' 
      };
    }
  }

  async getUpcomingMatches(days: number = 7): Promise<ApiResponse<ApiMatch[]>> {
    try {
      const data = await this.fetch<{ data: CricDataMatch[] }>('/matches', {
        offset: '0',
      });
      
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      const upcomingMatches = data.data
        .filter((m) => {
          const matchDate = new Date(m.dateTimeGMT);
          return !m.matchStarted && matchDate >= now && matchDate <= futureDate;
        })
        .map((m) => this.mapMatch(m));
      
      return { success: true, data: upcomingMatches };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming matches' 
      };
    }
  }

  async getRecentMatches(days: number = 7): Promise<ApiResponse<ApiMatch[]>> {
    try {
      const data = await this.fetch<{ data: CricDataMatch[] }>('/matches', {
        offset: '0',
      });
      
      const now = new Date();
      const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      const recentMatches = data.data
        .filter((m) => {
          const matchDate = new Date(m.dateTimeGMT);
          return m.matchEnded && matchDate >= pastDate && matchDate <= now;
        })
        .map((m) => this.mapMatch(m));
      
      return { success: true, data: recentMatches };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch recent matches' 
      };
    }
  }

  async getMatchById(id: string): Promise<ApiResponse<ApiMatch>> {
    try {
      const data = await this.fetch<{ data: CricDataMatch }>('/match_info', { id });
      return { success: true, data: this.mapMatch(data.data) };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch match' 
      };
    }
  }

  async getTeams(): Promise<ApiResponse<ApiTeam[]>> {
    // CricketData.org doesn't have a dedicated teams endpoint
    // We'd typically cache teams from match data
    return { 
      success: false, 
      error: 'Teams endpoint not available in this provider. Use match data to get teams.' 
    };
  }

  async getTeamById(id: string): Promise<ApiResponse<ApiTeam>> {
    return { 
      success: false, 
      error: `Team endpoint not available for ID: ${id}` 
    };
  }

  async searchPlayers(query: string): Promise<ApiResponse<ApiPlayer[]>> {
    try {
      const data = await this.fetch<{ data: CricDataPlayer[] }>('/players', {
        search: query,
      });
      
      const players = data.data.map((p) => ({
        id: p.id,
        name: p.name,
        country: p.country,
        dateOfBirth: p.dateOfBirth,
        role: this.mapPlayerRole(p.role),
        battingStyle: this.mapBattingStyle(p.battingStyle),
        bowlingStyle: this.mapBowlingStyle(p.bowlingStyle),
      }));
      
      return { success: true, data: players };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search players' 
      };
    }
  }

  async getPlayerById(id: string): Promise<ApiResponse<ApiPlayer>> {
    try {
      const data = await this.fetch<{ data: CricDataPlayer }>('/players_info', { id });
      const p = data.data;
      
      return {
        success: true,
        data: {
          id: p.id,
          name: p.name,
          country: p.country,
          dateOfBirth: p.dateOfBirth,
          role: this.mapPlayerRole(p.role),
          battingStyle: this.mapBattingStyle(p.battingStyle),
          bowlingStyle: this.mapBowlingStyle(p.bowlingStyle),
        },
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch player' 
      };
    }
  }

  async getPlayerStats(id: string): Promise<ApiResponse<ApiPlayerStats[]>> {
    // CricketData.org provides limited stats in player_info
    // For detailed stats, you'd need a different provider or scraping
    return { 
      success: false, 
      error: `Detailed stats not available for player: ${id}` 
    };
  }

  async getCompetitions(): Promise<ApiResponse<ApiCompetition[]>> {
    try {
      const data = await this.fetch<{ data: Array<{ id: string; name: string; startDate: string; endDate: string }> }>('/series');
      
      const competitions = data.data.map((s) => ({
        id: s.id,
        name: s.name,
        type: this.inferCompetitionType(s.name),
        startDate: s.startDate,
        endDate: s.endDate,
      }));
      
      return { success: true, data: competitions };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch competitions' 
      };
    }
  }

  // Helper methods for mapping
  private mapPlayerRole(role?: string): ApiPlayer['role'] {
    if (!role) return undefined;
    const roleLower = role.toLowerCase();
    if (roleLower.includes('bat')) return 'batsman';
    if (roleLower.includes('bowl')) return 'bowler';
    if (roleLower.includes('all')) return 'all_rounder';
    if (roleLower.includes('keeper') || roleLower.includes('wk')) return 'wicket_keeper';
    return undefined;
  }

  private mapBattingStyle(style?: string): ApiPlayer['battingStyle'] {
    if (!style) return undefined;
    return style.toLowerCase().includes('left') ? 'left_handed' : 'right_handed';
  }

  private mapBowlingStyle(style?: string): ApiPlayer['bowlingStyle'] {
    if (!style) return 'none';
    const styleLower = style.toLowerCase();
    
    if (styleLower.includes('right') && styleLower.includes('fast')) return 'right_arm_fast';
    if (styleLower.includes('right') && styleLower.includes('medium')) return 'right_arm_medium';
    if (styleLower.includes('right') && styleLower.includes('off')) return 'right_arm_offbreak';
    if (styleLower.includes('right') && styleLower.includes('leg')) return 'right_arm_legbreak';
    if (styleLower.includes('left') && styleLower.includes('fast')) return 'left_arm_fast';
    if (styleLower.includes('left') && styleLower.includes('medium')) return 'left_arm_medium';
    if (styleLower.includes('left') && styleLower.includes('orthodox')) return 'left_arm_orthodox';
    if (styleLower.includes('chinaman')) return 'left_arm_chinaman';
    
    return 'none';
  }

  private inferCompetitionType(name: string): CompetitionType {
    const nameLower = name.toLowerCase();
    
    // International competitions
    if (nameLower.includes('world cup') || 
        nameLower.includes('test') || 
        nameLower.includes('trophy') ||
        nameLower.includes('tour')) {
      return 'international';
    }
    
    // Franchise leagues
    if (nameLower.includes('ipl') || 
        nameLower.includes('bbl') || 
        nameLower.includes('cpl') ||
        nameLower.includes('psl') ||
        nameLower.includes('premier league') ||
        nameLower.includes('t20 league')) {
      return 'franchise';
    }
    
    return 'domestic';
  }
}

