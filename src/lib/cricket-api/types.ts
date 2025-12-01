/**
 * Cricket API Types
 * 
 * Normalized types for cricket data that work across different API providers.
 * The actual provider implementations map their specific responses to these types.
 */

// ===========================================
// Match Types
// ===========================================

export type MatchStatus = 
  | 'scheduled'
  | 'toss_done'
  | 'live'
  | 'innings_break'
  | 'stumps'
  | 'delayed'
  | 'abandoned'
  | 'completed'
  | 'no_result';

export type MatchFormat = 
  | 'test'
  | 'odi'
  | 't20i'
  | 't20'
  | 'list_a'
  | 'first_class';

export type CompetitionType = 
  | 'international'
  | 'domestic'
  | 'franchise';

export interface ApiMatch {
  id: string;
  name: string;
  status: MatchStatus;
  format: MatchFormat;
  venue?: string;
  city?: string;
  startTime: string; // ISO date string
  endTime?: string;
  
  // Teams
  homeTeam: ApiTeamBrief;
  awayTeam: ApiTeamBrief;
  
  // Competition
  competition?: ApiCompetitionBrief;
  matchNumber?: number;
  
  // Toss
  tossWinner?: string; // Team ID
  tossDecision?: 'bat' | 'field';
  
  // Result
  winner?: string; // Team ID
  result?: string; // Human-readable result
  manOfMatch?: string;
  
  // Live score
  currentInnings?: number;
  score?: ApiScore[];
}

export interface ApiScore {
  innings: number;
  teamId: string;
  runs: number;
  wickets: number;
  overs: string;
  runRate?: number;
  target?: number;
  requiredRunRate?: number;
}

// ===========================================
// Team Types
// ===========================================

export interface ApiTeam {
  id: string;
  name: string;
  shortName?: string;
  country?: string;
  logoUrl?: string;
  isNational: boolean;
}

export interface ApiTeamBrief {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

// ===========================================
// Competition Types
// ===========================================

export interface ApiCompetition {
  id: string;
  name: string;
  shortName?: string;
  type: CompetitionType;
  country?: string;
  season?: string;
  startDate?: string;
  endDate?: string;
  logoUrl?: string;
}

export interface ApiCompetitionBrief {
  id: string;
  name: string;
  type: CompetitionType;
}

// ===========================================
// Player Types
// ===========================================

export type PlayerRole = 
  | 'batsman'
  | 'bowler'
  | 'all_rounder'
  | 'wicket_keeper';

export type BattingStyle = 
  | 'right_handed'
  | 'left_handed';

export type BowlingStyle =
  | 'right_arm_fast'
  | 'right_arm_medium'
  | 'right_arm_offbreak'
  | 'right_arm_legbreak'
  | 'left_arm_fast'
  | 'left_arm_medium'
  | 'left_arm_orthodox'
  | 'left_arm_chinaman'
  | 'none';

export interface ApiPlayer {
  id: string;
  name: string;
  fullName?: string;
  country?: string;
  dateOfBirth?: string;
  role?: PlayerRole;
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  imageUrl?: string;
}

export interface ApiPlayerStats {
  format: MatchFormat;
  
  // Batting
  batting?: {
    matches: number;
    innings: number;
    runs: number;
    highScore?: string;
    average?: number;
    strikeRate?: number;
    centuries: number;
    fifties: number;
    fours: number;
    sixes: number;
    notOuts: number;
  };
  
  // Bowling
  bowling?: {
    matches: number;
    innings: number;
    wickets: number;
    runs: number;
    bestInnings?: string;
    bestMatch?: string;
    average?: number;
    economy?: number;
    strikeRate?: number;
    fiveWickets: number;
    tenWickets: number;
  };
  
  // Fielding
  fielding?: {
    catches: number;
    stumpings: number;
  };
}

// ===========================================
// API Response Types
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// ===========================================
// Provider Interface
// ===========================================

/**
 * Abstract interface that all cricket API providers must implement.
 * This allows swapping providers without changing application code.
 */
export interface CricketApiProvider {
  readonly name: string;
  
  // Matches
  getLiveMatches(): Promise<ApiResponse<ApiMatch[]>>;
  getUpcomingMatches(days?: number): Promise<ApiResponse<ApiMatch[]>>;
  getRecentMatches(days?: number): Promise<ApiResponse<ApiMatch[]>>;
  getMatchById(id: string): Promise<ApiResponse<ApiMatch>>;
  
  // Teams
  getTeams(): Promise<ApiResponse<ApiTeam[]>>;
  getTeamById(id: string): Promise<ApiResponse<ApiTeam>>;
  
  // Players
  searchPlayers(query: string): Promise<ApiResponse<ApiPlayer[]>>;
  getPlayerById(id: string): Promise<ApiResponse<ApiPlayer>>;
  getPlayerStats(id: string): Promise<ApiResponse<ApiPlayerStats[]>>;
  
  // Competitions
  getCompetitions(): Promise<ApiResponse<ApiCompetition[]>>;
}

