import clsx from 'clsx';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { forwardRef, useEffect, useState, useRef } from 'react';
import { MdOutlineArticle } from 'react-icons/md'; // Import the icon from react-icons

import { Logo } from '@/components/shared/Logo';
import {
  MobileNavigation,
  useIsInsideMobileNavigation,
  useMobileNavigationStore,
} from '@/components/shared/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { Pipeline } from '@/types';

import DynamicHeaderPath from './DynamicHeaderPath';
import { SubNavigationBar } from './SubNavigationBar';

function TopLevelNavItem({
  href,
  children,
  target,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <li>
      <Link href={href} passHref legacyBehavior>
        <a
          className="text-sm leading-5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          target={target}
          rel={rel}
        >
          {children}
        </a>
      </Link>
    </li>
  );
}

export const Navbar = forwardRef<
  React.ElementRef<'div'>,
  { className?: string }
>(function Header({ className }, ref) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const pipelinesRef = useRef(pipelines);
  const router = useRouter();
  const { isOpen: mobileNavIsOpen } = useMobileNavigationStore();
  const isInsideMobileNavigation = useIsInsideMobileNavigation();

  useEffect(() => {
    pipelinesRef.current = pipelines;
  }, [pipelines]);

  const { scrollY } = useScroll();
  const bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9]);
  const bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8]);

  // Determine the active segment for highlighting in SubNavigationBar
  const isPipelineRoute = router.pathname.includes('/pipeline/');
  const pathSegments = isPipelineRoute
    ? router.asPath.split('/').filter(Boolean)
    : [];
  const pipelineId = pathSegments.length > 1 ? pathSegments[1] : null;

  return (
    <div style={{ zIndex: '1000' }}>
      <motion.div
        ref={ref}
        className={clsx(
          className,
          'fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between gap-12 px-6 transition lg:z-30 lg:px-8 backdrop-blur-sm dark:backdrop-blur',
          isInsideMobileNavigation
            ? 'bg-white dark:bg-zinc-900'
            : 'bg-zinc-100 dark:bg-zinc-800'
        )}
        style={
          {
            '--bg-opacity-light': bgOpacityLight,
            '--bg-opacity-dark': bgOpacityDark,
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between w-full md:hidden">
          <MobileNavigation />
          <Logo className="h-6" onClick={() => router.push('/')} />
        </div>
        <div className="hidden md:flex items-center justify-between w-full">
          <div className="flex">
            <DynamicHeaderPath />
          </div>
          <div className="flex items-center gap-5">
            <nav className="hidden md:flex">
              <ul role="list" className="flex items-center gap-8">
                <TopLevelNavItem
                  href="https://r2r-docs.sciphi.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className="rounded-md py-1 px-3 w-30"
                    variant="primary"
                  >
                    <div className="mt-1">
                      <MdOutlineArticle />
                    </div>
                    Docs
                  </Button>
                </TopLevelNavItem>
              </ul>
            </nav>
            <div className="flex gap-4">
              <div className="hidden min-[416px]:contents"></div>
            </div>
          </div>
        </div>
        <div className="flex">
          <SubNavigationBar
            isPipelineRoute={isPipelineRoute}
            pipelineId={pipelineId}
            pathSegments={pathSegments}
          />
        </div>
      </motion.div>
    </div>
  );
});
