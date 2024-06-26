import clsx from 'clsx';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSyncExternalStore } from 'react';
import React, { forwardRef, useState, useEffect, useRef } from 'react';

import { Code } from '@/components/ui/Code';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const staticNavItems = [
  {
    path: '/',
    label: 'Dashboard',
  },
];

const ClientOnly = ({ children }: React.PropsWithChildren<any>) => {
  const [clientReady, setClientReady] = useState<boolean>(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  return clientReady ? <>{children}</> : null;
};

function TopLevelNavItem({
  href,
  children,
  isActive,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
  disabled?: boolean;
}) {
  const className = clsx(
    'text-sm leading-5 transition',
    isActive
      ? 'text-blue-500'
      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const content = (
    <span className={className}>
      <Code>{children}</Code>
    </span>
  );

  if (disabled) {
    return (
      <li>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>{content}</TooltipTrigger>
            <TooltipContent>
              <p>No connection to Pipeline!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </li>
    );
  }

  return (
    <li>
      <Link href={href} className={className}>
        <Code>{children}</Code>
      </Link>
    </li>
  );
}

const emptySubscribe = () => () => {};

export const SubNavigationBar = forwardRef<
  React.ElementRef<'div'>,
  {
    className?: string;
    isPipelineRoute: boolean;
    pipelineId: string | null;
    pathSegments: string[];
    deploymentUrl?: string;
    isConnected: boolean;
  }
>(
  (
    {
      className,
      isPipelineRoute,
      pipelineId,
      pathSegments = [],
      deploymentUrl,
      isConnected,
    },
    ref
  ) => {
    const router = useRouter();
    const { scrollY } = useScroll();
    const bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9]);
    const bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8]);

    const latestPathRef = useRef(router.asPath);

    // Update the ref whenever the path changes
    useEffect(() => {
      latestPathRef.current = router.asPath;
    }, [router.asPath]);

    // Use useSyncExternalStore to manage activePath state
    const activePath = useSyncExternalStore(
      emptySubscribe,
      () => latestPathRef.current, // This function returns the current state
      () => router.asPath // getServerSnapshot: Use the initial router path as the snapshot for server rendering
    );

    const navItems = React.useMemo(() => {
      if (router.pathname === '/home') {
        return staticNavItems;
      } else if (isPipelineRoute && pipelineId) {
        return [
          {
            path: `/`,
            label: <span className="text-3xl">←</span>,
          },
          {
            path: `/pipeline/${pipelineId}`,
            label: 'Overview',
          },
          {
            path: `/pipeline/${pipelineId}/documents`,
            label: 'Documents',
            disabled: !isConnected,
          },
          {
            path: `/pipeline/${pipelineId}/playground`,
            label: 'Playground',
            disabled: !isConnected,
          },
          // {
          //   path: `/pipeline/${pipelineId}/analytics`,
          //   label: 'Analytics',
          //   disabled: !isConnected,
          // },
          {
            path: `/pipeline/${pipelineId}/logs`,
            label: 'Logs',
            disabled: !isConnected,
          },
          {
            path: `/pipeline/${pipelineId}/settings`,
            label: 'Settings',
            disabled: !isConnected,
          },
        ];
      }
      return staticNavItems;
    }, [isPipelineRoute, pipelineId, router.pathname, isConnected]);

    return (
      <motion.div
        ref={ref}
        className={clsx(
          className,
          'fixed inset-x-0 top-10 z-40 flex h-10 items-center justify-between gap-12 px-4 transition sm:px-6 lg:z-30 lg:px-8 backdrop-blur-sm dark:backdrop-blur bg-zinc-800'
        )}
        style={
          {
            '--bg-opacity-light': bgOpacityLight,
            '--bg-opacity-dark': bgOpacityDark,
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between w-full">
          <nav className="flex">
            <ClientOnly>
              <ul role="list" className="flex items-center gap-3 pl-10 ml-3">
                {navItems.map((item) => {
                  // Check if the current path is exactly the item's path
                  const routerPathClean = router.asPath.split('?')[0];
                  const isExactMatch = routerPathClean === item.path;
                  // Check if the current path is a sub-route of the item's path
                  const isSubRouteMatch =
                    routerPathClean.startsWith(item.path + '/') &&
                    routerPathClean.split('/').length >
                      item.path.split('/').length;

                  // The item is active if it's an exact match, or if it's a sub-route match but not for the 'Pipeline' item
                  const isActive =
                    isExactMatch ||
                    (isSubRouteMatch &&
                      item.path !== `/pipeline/${pipelineId}`);

                  return (
                    <TopLevelNavItem
                      key={item.path}
                      href={item.path}
                      // isActive={router.asPath.includes(item.path)}
                      isActive={isActive}
                      disabled={item.disabled}
                    >
                      {item.label}
                    </TopLevelNavItem>
                  );
                })}
              </ul>
            </ClientOnly>
          </nav>
        </div>
      </motion.div>
    );
  }
);

SubNavigationBar.displayName = 'SubNavigationBar';
