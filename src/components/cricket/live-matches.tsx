'use client';

/**
 * Live Matches Component
 * 
 * Displays currently live matches with auto-refresh.
 */

import { trpc } from '@/lib/trpc';
import { MatchCard, MatchCardSkeleton } from './match-card';
import { AlertCircle, Radio } from 'lucide-react';

export function LiveMatches() {
  const { data: matches, isLoading, error } = trpc.match.getLive.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-500 animate-pulse" />
          <h2 className="text-xl font-semibold">Live Matches</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>Unable to load live matches</span>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="p-6 text-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">No live matches at the moment</p>
        <p className="text-sm text-muted-foreground mt-1">
          Check back later for live cricket action!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="h-5 w-5 text-red-500 animate-pulse" />
        <h2 className="text-xl font-semibold">Live Matches</h2>
        <span className="text-sm text-muted-foreground">({matches.length})</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            id={match.id}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            status={match.status}
            format={match.format}
            startTime={match.startTime}
            venue={match.venue}
            currentScore={match.score?.[0] ? `${match.score[0].runs}/${match.score[0].wickets}` : null}
            currentOvers={match.score?.[0]?.overs}
            competitionName={match.competition?.name}
          />
        ))}
      </div>
    </div>
  );
}

