'use client';

/**
 * Matches Page
 * 
 * Lists all matches - live, upcoming, and recent with results.
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchCard, MatchCardSkeleton } from '@/components/cricket/match-card';
import { LiveMatches } from '@/components/cricket/live-matches';
import { Radio, Calendar, Trophy, History } from 'lucide-react';

export default function MatchesPage() {
  const [filter, setFilter] = useState<'all' | 'international' | 'domestic' | 'franchise'>('all');

  const { data: upcomingMatches, isLoading: loadingUpcoming } = trpc.match.getUpcoming.useQuery({
    days: 14,
    competitionType: filter === 'all' ? undefined : filter,
  });

  // Get recent/completed matches from API
  const { data: recentApiMatches, isLoading: loadingRecentApi } = trpc.match.getRecent.useQuery({
    days: 14,
  });

  // Also get from database for synced matches
  const { data: recentData, isLoading: loadingRecentDb } = trpc.match.list.useQuery({
    status: 'COMPLETED',
    competitionType: filter === 'all' ? undefined : filter.toUpperCase() as any,
    limit: 20,
  });

  const loadingRecent = loadingRecentApi || loadingRecentDb;

  // Combine API and DB results, prefer API for fresher data
  const recentMatches = recentApiMatches && recentApiMatches.length > 0 
    ? recentApiMatches 
    : recentData?.matches;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Matches</h1>
        <p className="text-muted-foreground">
          Live scores, upcoming fixtures, and recent results
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Matches
        </Button>
        <Button
          variant={filter === 'international' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('international')}
        >
          International
        </Button>
        <Button
          variant={filter === 'domestic' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('domestic')}
        >
          Domestic
        </Button>
        <Button
          variant={filter === 'franchise' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('franchise')}
        >
          Franchise/League
        </Button>
      </div>

      {/* Match Sections */}
      <Tabs defaultValue="live" className="space-y-8">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Live
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Live Matches Tab */}
        <TabsContent value="live">
          <LiveMatches />
        </TabsContent>

        {/* Upcoming Matches Tab */}
        <TabsContent value="upcoming">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Upcoming Matches</h2>
              {upcomingMatches && (
                <span className="text-sm text-muted-foreground">
                  ({upcomingMatches.length})
                </span>
              )}
            </div>

            {loadingUpcoming ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MatchCardSkeleton key={i} />
                ))}
              </div>
            ) : upcomingMatches && upcomingMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    id={match.id}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    status={match.status}
                    format={match.format}
                    startTime={match.startTime}
                    venue={match.venue}
                    competitionName={match.competition?.name}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming matches found for this filter
                </CardContent>
              </Card>
            )}
          </section>
        </TabsContent>

        {/* Results/Recent Matches Tab */}
        <TabsContent value="results">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold">Recent Results</h2>
              {recentMatches && (
                <span className="text-sm text-muted-foreground">
                  ({recentMatches.length})
                </span>
              )}
            </div>

            {loadingRecent ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MatchCardSkeleton key={i} />
                ))}
              </div>
            ) : recentMatches && recentMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentMatches.map((match: any) => (
                  <RecentMatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent results found</p>
                  <p className="text-sm mt-1">
                    Results will appear here as matches are completed
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Recent Match Card with Result - supports both API and DB formats
function RecentMatchCard({ match }: { match: any }) {
  const formatDisplay: Record<string, string> = {
    TEST: 'Test',
    test: 'Test',
    ODI: 'ODI',
    odi: 'ODI',
    T20I: 'T20I',
    t20i: 'T20I',
    T20: 'T20',
    t20: 'T20',
    LIST_A: 'List A',
    list_a: 'List A',
    FIRST_CLASS: 'First Class',
    first_class: 'First Class',
  };

  // Handle both API format (homeTeam/awayTeam) and raw API format (teams array)
  const homeTeam = match.homeTeam || { name: match.teams?.[0] || 'Team 1', id: '1' };
  const awayTeam = match.awayTeam || { name: match.teams?.[1] || 'Team 2', id: '2' };
  const result = match.result || match.status;
  const competitionName = match.competition?.name || match.series || null;
  const format = match.format || match.matchType || 'T20';
  const winner = match.winnerId || match.winner;

  // Check if a team is winner (by name or ID)
  const isWinner = (team: any) => {
    if (!winner) return false;
    return winner === team.id || winner === team.name || 
           (typeof winner === 'string' && team.name?.toLowerCase().includes(winner.toLowerCase()));
  };

  // Get score from various formats
  const getScore = (teamIndex: number) => {
    if (match.score && match.score[teamIndex]) {
      const s = match.score[teamIndex];
      return `${s.r || s.runs || 0}/${s.w || s.wickets || 0}`;
    }
    return null;
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {competitionName && (
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {competitionName}
              </span>
            )}
            <Badge variant="outline" className="text-xs">
              {formatDisplay[format] || format}
            </Badge>
          </div>
          <Badge variant="completed" className="text-xs">
            Completed
          </Badge>
        </div>

        {/* Teams with Scores */}
        <div className="space-y-2">
          <TeamRowWithScore
            team={homeTeam}
            score={getScore(0)}
            isWinner={isWinner(homeTeam)}
          />
          <TeamRowWithScore
            team={awayTeam}
            score={getScore(1)}
            isWinner={isWinner(awayTeam)}
          />
        </div>

        {/* Result */}
        {result && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium text-green-600 line-clamp-2">
              {result}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamRowWithScore({ 
  team, 
  score,
  isWinner 
}: { 
  team: { name: string; shortName?: string | null; logoUrl?: string | null };
  score?: string | null;
  isWinner: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-1 h-6 rounded ${isWinner ? 'bg-green-500' : 'bg-transparent'}`} />
        <span className={`font-medium ${isWinner ? 'text-foreground' : 'text-muted-foreground'}`}>
          {team.shortName || team.name}
        </span>
        {isWinner && (
          <Badge variant="default" className="text-xs bg-green-500">
            Won
          </Badge>
        )}
      </div>
      {score && (
        <span className="font-mono text-sm font-semibold">{score}</span>
      )}
    </div>
  );
}
