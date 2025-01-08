import { Check } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserContext } from '@/context/UserContext';
import { cn } from '@/lib/utils';

const notifications = [
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
  // {
  //   title: "5 graph creations per month",
  // },
  {
    title: 'Up to 1,000 documents, 100,000 chunks of storage',
  },
];

type CardProps = React.ComponentProps<typeof Card>;
export function Starter({ className, ...props }: CardProps) {
  const { isAuthenticated, authState, getClient } = useUserContext();
  console.log('authState = ', authState);
  return (
    <Card
      className={cn('w-[300px] h-[500px] flex flex-col', className)}
      {...props}
    >
      <CardHeader>
        <div className="text-xl mb-4">Starter</div>
        {/* <CardTitle className='mb-4' font-bold> $20</CardTitle> / Month */}
        <div className="flex items-baseline">
          <CardTitle className="inline mr-1">$25</CardTitle>
          <span>/ Month</span>
        </div>

        <CardDescription>Perfect for hobby and occasional use.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
            >
              <Check className="h-5 w-5 text-sky-500 " />
              <div className="">
                <p className="text-sm font-medium leading-none">
                  {notification.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          className="w-full"
          onClick={() => {
            const email = encodeURIComponent(authState?.email || ''); // Encode the email from authState
            const stripeUrl = `https://buy.stripe.com/9AQ2be0mrb80aQg3ch?prefilled_email=${email}`;
            window.open(stripeUrl);
          }}
        >
          Upgrade to Starter
        </Button>
      </CardFooter>
    </Card>
  );
}
