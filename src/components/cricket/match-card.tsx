'use client';

/**
 * Match Card Component
 * 
 * Displays a single cricket match in a card format.
 * Shows teams, score, status, and venue information.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatMatchFormat, getRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { TeamLogo } from './team-logo';

interface MatchScore {
  runs: number;
  wickets: number;
  overs: string;
}

interface MatchTeam {
  id: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
}

interface MatchCardProps {
  id: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  status: string;
  format: string;
  startTime: Date | string;
  venue?: string | null;
  currentScore?: string | null;
  currentOvers?: string | null;
  result?: string | null;
  competitionName?: string | null;
}

export function MatchCard({
  id,
  homeTeam,
  awayTeam,
  status,
  format,
  startTime,
  venue,
  currentScore,
  currentOvers,
  result,
  competitionName,
}: MatchCardProps) {
  const isLive = status === 'LIVE' || status === 'INNINGS_BREAK';
  const isUpcoming = status === 'SCHEDULED' || status === 'TOSS_DONE';
  const isCompleted = status === 'COMPLETED' || status === 'NO_RESULT' || status === 'ABANDONED';

  const statusBadgeVariant = isLive ? 'live' : isUpcoming ? 'upcoming' : 'completed';
  const statusText = status.replace('_', ' ');

  return (
    <Link href={`/matches/${id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          {/* Header: Competition & Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {competitionName && (
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {competitionName}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {formatMatchFormat(format)}
              </Badge>
            </div>
            <Badge variant={statusBadgeVariant} className="text-xs">
              {isLive && <span className="mr-1">●</span>}
              {statusText}
            </Badge>
          </div>

          {/* Teams */}
          <div className="space-y-3">
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TeamLogo
                  name={homeTeam.name}
                  logoUrl={homeTeam.logoUrl}
                  size="sm"
                />
                <span className="font-medium">
                  {homeTeam.shortName || homeTeam.name}
                </span>
              </div>
              {(isLive || isCompleted) && currentScore && (
                <span className={cn(
                  "font-bold tabular-nums",
                  isLive && "text-primary"
                )}>
                  {currentScore}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TeamLogo
                  name={awayTeam.name}
                  logoUrl={awayTeam.logoUrl}
                  size="sm"
                />
                <span className="font-medium">
                  {awayTeam.shortName || awayTeam.name}
                </span>
              </div>
            </div>
          </div>

          {/* Footer: Time/Result & Venue */}
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            {isUpcoming ? (
              <div className="flex items-center justify-between">
                <span>{getRelativeTime(startTime)}</span>
                {venue && <span className="truncate max-w-[150px]">{venue}</span>}
              </div>
            ) : result ? (
              <p className="text-foreground">{result}</p>
            ) : currentOvers ? (
              <span>Overs: {currentOvers}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Loading skeleton
export function MatchCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

