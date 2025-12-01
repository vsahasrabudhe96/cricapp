'use client';

/**
 * Main Navigation Bar
 * 
 * Includes:
 * - Logo
 * - Navigation links
 * - User menu (auth)
 * - Notification bell
 */

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  CreditCard,
  Heart,
} from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { getInitials } from '@/lib/utils';

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: 60000, // Refresh every minute
  });

  const isLoading = status === 'loading';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <span className="text-2xl">🏏</span>
          <span className="font-bold text-lg hidden sm:inline-block">CricApp</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          <Link 
            href="/matches" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Matches
          </Link>
          <Link 
            href="/teams" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Teams
          </Link>
          <Link 
            href="/players" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Players
          </Link>
          {session && (
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <>
              {/* Notifications */}
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <Avatar className="h-8 w-8">
                    {session.user?.image && (
                      <AvatarImage src={session.user.image} />
                    )}
                    <AvatarFallback>
                      {getInitials(session.user?.name || session.user?.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-lg z-50">
                      <div className="p-2 border-b">
                        <p className="font-medium truncate">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user?.email}
                        </p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          href="/favorites"
                          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Heart className="h-4 w-4" />
                          Favorites
                        </Link>
                        <Link
                          href="/billing"
                          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          Billing
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </div>
                      <div className="p-1 border-t">
                        <button
                          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent w-full text-left text-red-600"
                          onClick={() => signOut()}
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t p-4 space-y-2">
          <Link 
            href="/matches" 
            className="block px-3 py-2 rounded-md hover:bg-accent"
            onClick={() => setMobileMenuOpen(false)}
          >
            Matches
          </Link>
          <Link 
            href="/teams" 
            className="block px-3 py-2 rounded-md hover:bg-accent"
            onClick={() => setMobileMenuOpen(false)}
          >
            Teams
          </Link>
          <Link 
            href="/players" 
            className="block px-3 py-2 rounded-md hover:bg-accent"
            onClick={() => setMobileMenuOpen(false)}
          >
            Players
          </Link>
          {session && (
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

