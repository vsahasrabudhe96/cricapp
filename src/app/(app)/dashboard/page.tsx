'use client';

/**
 * User Dashboard
 * 
 * Shows personalized content:
 * - Matches for favorite teams
 * - Quick access to favorites
 * - Recent notifications
 */

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatchCard, MatchCardSkeleton } from '@/components/cricket/match-card';
import { TeamLogo } from '@/components/cricket/team-logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Heart, Bell, Settings, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <DashboardSkeleton />;
  }
  
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="container py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user?.name?.split(' ')[0] || 'Cricket Fan'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your favorite teams
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <FavoriteTeamsMatches />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <FavoriteTeamsCard />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

function FavoriteTeamsMatches() {
  const { data, isLoading, error } = trpc.match.getForFavorites.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Matches</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load matches. Please try again later.
        </CardContent>
      </Card>
    );
  }

  const hasMatches = data && (data.live.length > 0 || data.upcoming.length > 0);

  if (!hasMatches) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No favorite teams yet</h3>
          <p className="text-muted-foreground mb-4">
            Follow teams to see their matches here
          </p>
          <Link href="/teams">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Favorite Teams
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="live" className="space-y-4">
      <TabsList>
        <TabsTrigger value="live" className="flex items-center gap-2">
          Live
          {data.live.length > 0 && (
            <Badge variant="live" className="ml-1">{data.live.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="upcoming">
          Upcoming ({data.upcoming.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="live" className="space-y-4">
        {data.live.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No live matches for your favorite teams right now
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.live.map((match) => (
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
        )}
      </TabsContent>

      <TabsContent value="upcoming" className="space-y-4">
        {data.upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No upcoming matches for your favorite teams
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.upcoming.map((match) => (
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
        )}
      </TabsContent>
    </Tabs>
  );
}

function FavoriteTeamsCard() {
  const { data: teams, isLoading } = trpc.team.getFavorites.useQuery();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Favorite Teams</CardTitle>
          <Link href="/favorites">
            <Button variant="ghost" size="sm">Edit</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="space-y-3">
            {teams.slice(0, 5).map((team) => (
              <Link 
                key={team.id}
                href={`/teams/${team.id}`}
                className="flex items-center gap-3 hover:bg-muted p-2 -mx-2 rounded-md"
              >
                <TeamLogo name={team.name} logoUrl={team.logoUrl} size="sm" />
                <span className="font-medium text-sm">{team.name}</span>
              </Link>
            ))}
            {teams.length > 5 && (
              <Link href="/favorites" className="text-sm text-primary hover:underline">
                +{teams.length - 5} more
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No favorite teams yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href="/teams" className="block">
          <Button variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Add Favorite Team
          </Button>
        </Link>
        <Link href="/settings/notifications" className="block">
          <Button variant="outline" className="w-full justify-start">
            <Bell className="mr-2 h-4 w-4" />
            Notification Settings
          </Button>
        </Link>
        <Link href="/settings" className="block">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

