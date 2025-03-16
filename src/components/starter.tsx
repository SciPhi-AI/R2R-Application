'use client';

import { Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { cn } from '@/lib/utils';

// Starter plan features
const starterFeatures = [
  {
    title: 'Everything in free tier, plus:',
  },
  {
    title: 'High quality VLM ingestion',
  },
  {
    title: '3,000 RAG requests per month',
  },
  {
    title: '30,000 search requests per month',
  },
  {
    title: 'Up to 1,000 documents, 100,000 chunks of storage',
  },
];

// Enterprise plan features
const enterpriseFeatures = [
  {
    title: 'Unlimited storage and requests',
  },
  {
    title: 'Unlimited users and collections',
  },
  {
    title: 'Dedicated support and SLA',
  },
];

type CardProps = React.ComponentProps<typeof Card>;

// Starter Plan Component
export function Starter({ className, ...props }: CardProps) {
  const { isAuthenticated, authState, getClient } = useUserContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = () => {
    const email = encodeURIComponent(authState?.email || '');
    const stripeUrl = `https://buy.stripe.com/9AQ2be0mrb80aQg3ch?prefilled_email=${email}`;
    window.open(stripeUrl);
  };

  return (
    <Card
      className={cn('w-[300px] h-[500px] flex flex-col', className)}
      {...props}
    >
      <CardHeader>
        <div className="text-xl mb-4">Starter</div>
        <div className="flex items-baseline">
          <CardTitle className="inline mr-1">$25</CardTitle>
          <span>/ Month</span>
        </div>
        <CardDescription>Perfect for hobby and occasional use.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          {starterFeatures.map((feature, index) => (
            <div
              key={index}
              className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
            >
              <Check className="h-5 w-5 text-sky-500" />
              <div className="">
                <p className="text-sm font-medium leading-none">
                  {feature.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          className="w-full"
          onClick={handleUpgrade}
        >
          Upgrade to Starter
        </Button>
      </CardFooter>
    </Card>
  );
}

// Enterprise Plan Component
export function Enterprise({ className, ...props }: CardProps) {
  return (
    <Card
      className={cn('w-[300px] h-[500px] flex flex-col', className)}
      {...props}
    >
      <CardHeader>
        <div className="text-xl mb-4">Enterprise</div>
        <div className="flex items-baseline">
          <CardTitle className="inline mr-1">Contact us for pricing</CardTitle>
        </div>
        <CardDescription>For dedicated and secure deployments.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          {enterpriseFeatures.map((feature, index) => (
            <div
              key={index}
              className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
            >
              <Check className="h-5 w-5 text-sky-500" />
              <div className="">
                <p className="text-sm font-medium leading-none">
                  {feature.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full">Talk to Sales</Button>
      </CardFooter>
    </Card>
  );
}

// Subscription Management Section Component
export function PlansBillingSection() {
  const { authState, getClient } = useUserContext();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = () => {
    setIsLoading(true);
    
    const email = encodeURIComponent(authState?.email || '');
    const stripeCustomerPortalUrl = `https://billing.stripe.com/p/login/8wM6qP5GF0ycdDW288?prefilled_email=${email}`;
    window.open(stripeCustomerPortalUrl);
    
    toast({
      variant: 'success',
      title: 'Redirecting to Billing Portal',
      description: 'You are being redirected to manage your subscription.',
    });
    
    setIsLoading(false);
  };

  return (
    <Card className="bg-zinc-900 mb-8">
      <CardHeader>
        <h2 className="text-lg font-semibold">Subscription Management</h2>
        <CardDescription>
          Manage your current subscription and billing information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="mb-6">
            <div className="bg-zinc-800 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-2">Current Plan: <span className="text-sky-500">Starter</span></h3>
              <p className="text-sm text-gray-400 mb-2">Next billing date: April 15, 2025</p>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="mt-2"
              >
                {isLoading ? 'Processing...' : 'Manage or Cancel Subscription'} 
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 mb-4">You are currently on the Free tier. Upgrade to access more features.</p>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-10">
          <Starter />
          <Enterprise />
        </div>
      </CardContent>
    </Card>
  );
}