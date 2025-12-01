/**
 * Landing Page
 * 
 * The main landing page for CricApp showcasing features
 * and inviting users to sign up.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { 
  Bell, 
  Heart, 
  LineChart, 
  Zap, 
  Globe, 
  Shield,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-background to-background" />
        
        {/* Cricket pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-5xl">🏏</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Never Miss a 
              <span className="text-primary"> Cricket </span>
              Moment
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track live matches, follow your favorite teams, and get instant notifications 
              for toss results, playing XI, and match outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/matches">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Live Matches
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From live scores to detailed player stats, CricApp has everything 
              a cricket fan needs in one place.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Live Scores</CardTitle>
                <CardDescription>
                  Real-time ball-by-ball updates for all international and major 
                  domestic matches.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Favorite Teams</CardTitle>
                <CardDescription>
                  Follow your favorite teams across all competitions and never 
                  miss their matches.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Notifications</CardTitle>
                <CardDescription>
                  Get notified for match start, toss results, playing XI, and 
                  final results.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <LineChart className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Player Statistics</CardTitle>
                <CardDescription>
                  Detailed career stats for players across Test, ODI, T20I, and 
                  franchise leagues.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Global Coverage</CardTitle>
                <CardDescription>
                  International, domestic, and franchise cricket from around the 
                  world - IPL, BBL, CPL, and more.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Free Forever</CardTitle>
                <CardDescription>
                  Core features are free. Upgrade to Pro for unlimited favorites 
                  and email notifications.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground">
              Start free, upgrade when you need more.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for casual fans</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Live match scores
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Up to 3 favorite teams
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    In-app notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Basic player stats
                  </li>
                </ul>
                <Link href="/auth/register" className="block mt-6">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    Popular
                  </span>
                </div>
                <CardDescription>For the serious cricket fan</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Everything in Free
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <strong>Unlimited</strong> favorite teams
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Email notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Advanced player stats
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Priority support
                  </li>
                </ul>
                <Link href="/auth/register" className="block mt-6">
                  <Button className="w-full">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Track Cricket Like Never Before?
          </h2>
          <p className="mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of cricket fans who use CricApp to stay updated 
            on their favorite teams and matches.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <span className="font-semibold">CricApp</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CricApp. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

