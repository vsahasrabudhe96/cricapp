'use client';

/**
 * Teams Page
 * 
 * Browse and search teams to add to favorites.
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/cricket/team-logo';
import { Heart, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function TeamsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'INTERNATIONAL' | 'DOMESTIC' | 'FRANCHISE'>('all');

  const { data, isLoading, refetch } = trpc.team.list.useQuery({
    search: search || undefined,
    competitionType: filter === 'all' ? undefined : filter,
  });

  const { data: favorites, refetch: refetchFavorites } = trpc.team.getFavorites.useQuery(
    undefined,
    { enabled: !!session }
  );

  const addFavorite = trpc.team.addFavorite.useMutation({
    onSuccess: () => {
      refetchFavorites();
      toast({ title: 'Team added to favorites!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to add favorite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeFavorite = trpc.team.removeFavorite.useMutation({
    onSuccess: () => {
      refetchFavorites();
      toast({ title: 'Team removed from favorites' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to remove favorite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isFavorite = (teamId: string) => {
    return favorites?.some((team) => team.id === teamId);
  };

  const toggleFavorite = (teamId: string) => {
    if (!session) {
      toast({ 
        title: 'Sign in required',
        description: 'Please sign in to add favorites',
      });
      return;
    }

    if (isFavorite(teamId)) {
      removeFavorite.mutate({ teamId });
    } else {
      addFavorite.mutate({ teamId });
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teams</h1>
        <p className="text-muted-foreground">
          Browse teams and add them to your favorites
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'INTERNATIONAL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('INTERNATIONAL')}
          >
            International
          </Button>
          <Button
            variant={filter === 'FRANCHISE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('FRANCHISE')}
          >
            Franchise
          </Button>
        </div>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.teams && data.teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.teams.map((team) => (
            <Card key={team.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <TeamLogo name={team.name} logoUrl={team.logoUrl} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{team.name}</h3>
                    {team.country && (
                      <p className="text-sm text-muted-foreground truncate">
                        {team.country}
                      </p>
                    )}
                    {team.isNational && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        National
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(team.id)}
                    disabled={addFavorite.isPending || removeFavorite.isPending}
                  >
                    {(addFavorite.isPending || removeFavorite.isPending) &&
                    (addFavorite.variables?.teamId === team.id ||
                     removeFavorite.variables?.teamId === team.id) ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart
                        className={`h-5 w-5 ${
                          isFavorite(team.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No teams found. Try a different search or filter.
          </CardContent>
        </Card>
      )}

      {/* Pagination info */}
      {data?.pagination && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {data.teams.length} of {data.pagination.total} teams
        </div>
      )}
    </div>
  );
}

