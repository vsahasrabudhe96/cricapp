'use client';

/**
 * Player Detail Page
 * 
 * Shows player profile and statistics.
 */

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = (params?.id as string) || '';

  const { data: player, isLoading: loadingPlayer } = trpc.player.getById.useQuery({ id: playerId });
  const { data: stats, isLoading: loadingStats } = trpc.player.getStats.useQuery({ playerId });

  if (loadingPlayer) {
    return <PlayerSkeleton />;
  }

  if (!player) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Player not found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find the player you're looking for.
            </p>
            <Link href="/players" className="text-primary hover:underline">
              ← Back to search
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleDisplay: Record<string, string> = {
    batsman: 'Batsman',
    bowler: 'Bowler',
    all_rounder: 'All-Rounder',
    wicket_keeper: 'Wicket-Keeper',
    BATSMAN: 'Batsman',
    BOWLER: 'Bowler',
    ALL_ROUNDER: 'All-Rounder',
    WICKET_KEEPER: 'Wicket-Keeper',
  };

  const battingStyleDisplay: Record<string, string> = {
    right_handed: 'Right-handed',
    left_handed: 'Left-handed',
    RIGHT_HANDED: 'Right-handed',
    LEFT_HANDED: 'Left-handed',
  };

  return (
    <div className="container py-8">
      {/* Back Link */}
      <Link href="/players" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to players
      </Link>

      {/* Player Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              {player.imageUrl && <AvatarImage src={player.imageUrl} />}
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{player.name}</h1>
              {player.fullName && player.fullName !== player.name && (
                <p className="text-muted-foreground mb-2">{player.fullName}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {player.country && (
                  <Badge variant="secondary">{player.country}</Badge>
                )}
                {player.role && (
                  <Badge variant="outline">{roleDisplay[player.role] || player.role}</Badge>
                )}
                {player.battingStyle && (
                  <Badge variant="outline">
                    {battingStyleDisplay[player.battingStyle] || player.battingStyle}
                  </Badge>
                )}
              </div>
              {player.dateOfBirth && (
                <p className="text-sm text-muted-foreground mt-2">
                  Born: {formatDate(player.dateOfBirth)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Career Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : stats && Array.isArray(stats) && stats.length > 0 ? (
            <Tabs defaultValue={stats[0]?.format || 'test'}>
              <TabsList>
                {stats.map((s: any) => (
                  <TabsTrigger key={s.format} value={s.format}>
                    {s.format?.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {stats.map((s: any) => (
                <TabsContent key={s.format} value={s.format}>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Batting Stats */}
                    {s.batting && (
                      <div>
                        <h3 className="font-semibold mb-3">Batting</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <StatItem label="Matches" value={s.batting.matches} />
                          <StatItem label="Innings" value={s.batting.innings} />
                          <StatItem label="Runs" value={s.batting.runs} />
                          <StatItem label="High Score" value={s.batting.highScore || '-'} />
                          <StatItem label="Average" value={s.batting.average?.toFixed(2) || '-'} />
                          <StatItem label="Strike Rate" value={s.batting.strikeRate?.toFixed(2) || '-'} />
                          <StatItem label="100s" value={s.batting.centuries} />
                          <StatItem label="50s" value={s.batting.fifties} />
                        </div>
                      </div>
                    )}

                    {/* Bowling Stats */}
                    {s.bowling && (
                      <div>
                        <h3 className="font-semibold mb-3">Bowling</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <StatItem label="Matches" value={s.bowling.matches} />
                          <StatItem label="Innings" value={s.bowling.innings} />
                          <StatItem label="Wickets" value={s.bowling.wickets} />
                          <StatItem label="Best Innings" value={s.bowling.bestInnings || '-'} />
                          <StatItem label="Average" value={s.bowling.average?.toFixed(2) || '-'} />
                          <StatItem label="Economy" value={s.bowling.economy?.toFixed(2) || '-'} />
                          <StatItem label="5W" value={s.bowling.fiveWickets} />
                          <StatItem label="10W" value={s.bowling.tenWickets} />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Statistics not available for this player.
              <br />
              <span className="text-sm">Data depends on the cricket API provider.</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="container py-8">
      <Skeleton className="h-6 w-32 mb-6" />
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

