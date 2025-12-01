'use client';

/**
 * Players Page
 * 
 * Search and browse cricket players.
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, User, Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults, isLoading, refetch } = trpc.player.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length >= 2 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length >= 2) {
      refetch();
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Players</h1>
        <p className="text-muted-foreground">
          Search for cricket players and view their statistics
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players (e.g., Virat Kohli)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={searchQuery.length < 2}>
            Search
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Enter at least 2 characters to search
        </p>
      </form>

      {/* Search Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : searchResults && searchResults.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {searchResults.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : searchQuery.length >= 2 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No players found</h3>
            <p className="text-muted-foreground">
              Try a different search term
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Search for players</h3>
            <p className="text-muted-foreground">
              Enter a player name to find their profile and statistics
            </p>
          </CardContent>
        </Card>
      )}

      {/* Featured Players Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Popular Searches</h2>
        <div className="flex flex-wrap gap-2">
          {['Virat Kohli', 'Rohit Sharma', 'Pat Cummins', 'Joe Root', 'Babar Azam', 'Kane Williamson'].map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    country?: string | null;
    role?: string | null;
    imageUrl?: string | null;
  };
}

function PlayerCard({ player }: PlayerCardProps) {
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

  return (
    <Link href={`/players/${player.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {player.imageUrl && <AvatarImage src={player.imageUrl} />}
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{player.name}</h3>
              {player.country && (
                <p className="text-sm text-muted-foreground">{player.country}</p>
              )}
              {player.role && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {roleDisplay[player.role] || player.role}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

