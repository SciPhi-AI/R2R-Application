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
import { cn } from '@/lib/utils';

const notifications = [
  {
    title: 'Unlimited storage and requests',
  },
  {
    title: 'Unlimited users and collections',
  },
  {
    title: 'Dedicated support and SLA',
  },
  // {
  //   title: "10 collections and 5 graph creations per month",
  // },
];

type CardProps = React.ComponentProps<typeof Card>;

export function Enterprise({ className, ...props }: CardProps) {
  return (
    <Card
      className={cn('w-[300px] h-[500px] flex flex-col', className)}
      {...props}
    >
      <CardHeader>
        <div className="text-xl mb-4">Enterprise</div>
        {/* <CardTitle className='mb-4' font-bold> $20</CardTitle> / Month */}
        <div className="flex items-baseline">
          <CardTitle className="inline mr-1">Contact us for pricing</CardTitle>
        </div>

        <CardDescription>For dedicated and secure deployments.</CardDescription>
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
        <Button className="w-full">Talk to Sales</Button>
      </CardFooter>
    </Card>
  );
}
