'use client';

/**
 * Billing Page
 * 
 * Subscription management and plan upgrades.
 */

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function BillingPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  if (status === 'loading') {
    return <BillingSkeleton />;
  }

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing settings
        </p>
      </div>

      <div className="space-y-8">
        <CurrentPlan />
        <PlanComparison />
      </div>
    </div>
  );
}

function CurrentPlan() {
  const { toast } = useToast();
  const { data, isLoading } = trpc.billing.getSubscriptionDetails.useQuery();

  const createPortalSession = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const plan = data?.subscription?.plan || 'FREE';
  const isPro = data?.isPro;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription</CardDescription>
          </div>
          <Badge variant={isPro ? 'default' : 'secondary'} className="text-lg px-4 py-1">
            {plan}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isPro && data?.subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Your Pro subscription renews on{' '}
              <strong>
                {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
              </strong>
              {data.subscription.cancelAtPeriodEnd && (
                <span className="text-red-500">
                  {' '}(cancels at period end)
                </span>
              )}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Favorite Teams</p>
              <p className="font-semibold">
                {isPro ? 'Unlimited' : `${data?.features?.maxFavoriteTeams} max`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Email Notifications</p>
              <p className="font-semibold">
                {data?.features?.emailNotifications ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      {isPro && (
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => createPortalSession.mutate({})}
            disabled={createPortalSession.isPending}
          >
            {createPortalSession.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function PlanComparison() {
  const { toast } = useToast();
  const { data } = trpc.billing.getSubscriptionDetails.useQuery();

  const createCheckout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isPro = data?.isPro;

  return (
    <div className="grid gap-6 md:grid-cols-2">
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
            <PlanFeature included>Live match scores</PlanFeature>
            <PlanFeature included>Up to 3 favorite teams</PlanFeature>
            <PlanFeature included>In-app notifications</PlanFeature>
            <PlanFeature included>Basic player stats</PlanFeature>
            <PlanFeature>Email notifications</PlanFeature>
            <PlanFeature>Unlimited favorites</PlanFeature>
            <PlanFeature>Advanced stats</PlanFeature>
          </ul>
        </CardContent>
        <CardFooter>
          {!isPro ? (
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Downgrade on renewal
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Pro Plan */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pro</CardTitle>
            <Badge>Popular</Badge>
          </div>
          <CardDescription>For the serious cricket fan</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">$9.99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <PlanFeature included>Everything in Free</PlanFeature>
            <PlanFeature included>
              <strong>Unlimited</strong> favorite teams
            </PlanFeature>
            <PlanFeature included>Email notifications</PlanFeature>
            <PlanFeature included>Advanced player stats</PlanFeature>
            <PlanFeature included>Priority support</PlanFeature>
            <PlanFeature included>Early access to features</PlanFeature>
          </ul>
        </CardContent>
        <CardFooter className="flex gap-2">
          {isPro ? (
            <Button className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <>
              <Button
                className="flex-1"
                onClick={() => createCheckout.mutate({ plan: 'monthly' })}
                disabled={createCheckout.isPending}
              >
                {createCheckout.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Monthly
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => createCheckout.mutate({ plan: 'yearly' })}
                disabled={createCheckout.isPending}
              >
                Yearly (save 17%)
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function PlanFeature({ 
  children, 
  included = false 
}: { 
  children: React.ReactNode; 
  included?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <Check className={`h-4 w-4 ${included ? 'text-green-500' : 'text-muted-foreground/30'}`} />
      <span className={included ? '' : 'text-muted-foreground'}>{children}</span>
    </li>
  );
}

function BillingSkeleton() {
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 w-full bg-muted animate-pulse rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

