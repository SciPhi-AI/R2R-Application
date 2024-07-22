import clsx from 'clsx';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { forwardRef, useEffect, useState, useRef } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';
import { Pipeline } from '@/types';

import DynamicHeaderPath from './DynamicHeaderPath';
import { SubNavigationBar } from './SubNavigationBar';

interface NavbarProps {
  className?: string;
  isConnected: boolean;
}

export const Navbar = forwardRef<React.ElementRef<'div'>, NavbarProps>(
  function Header({ className, isConnected }, ref) {
    const { watchedPipelines, logout, isAuthenticated } = useUserContext();
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const pipelinesRef = useRef(pipelines);
    const router = useRouter();

    useEffect(() => {
      pipelinesRef.current = pipelines;
    }, [pipelines]);

    const handleLogout = async () => {
      await logout();
      router.push('/login');
    };

    const { scrollY } = useScroll();
    const bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9]);
    const bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8]);

    // Determine the active segment for highlighting in SubNavigationBar
    const isPipelineRoute = router.pathname.includes('/pipeline/');
    const pathSegments = isPipelineRoute
      ? router.asPath.split('/').filter(Boolean)
      : [];
    const pipelineId = pathSegments.length > 1 ? pathSegments[1] : null;
    const currentPipeline = pipelines.find((p) => p.pipelineId === pipelineId);

    return (
      <div style={{ zIndex: '1000' }}>
        <motion.div
          ref={ref}
          className={clsx(
            className,
            'fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between gap-12 px-6 transition lg:z-30 lg:px-8 backdrop-blur-sm dark:backdrop-blur',
            'bg-zinc-100 dark:bg-zinc-800'
          )}
          style={
            {
              '--bg-opacity-light': bgOpacityLight,
              '--bg-opacity-dark': bgOpacityDark,
            } as React.CSSProperties
          }
        >
          <div className="flex items-center justify-between w-full md:hidden">
            <Logo className="h-6" onClick={() => router.push('/')} />
          </div>
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex">
              <DynamicHeaderPath />
            </div>
            <div className="flex items-center gap-5">
              <nav className="hidden md:flex">
                <ul role="list" className="flex items-center gap-8">
                  <div className="flex items-center space-x-4">
                    <Button
                      className="rounded-md py-1 px-3 w-30"
                      variant="filled"
                      onClick={() =>
                        window.open('https://r2r-docs.sciphi.ai', '_blank')
                      }
                    >
                      Docs
                    </Button>
                    {isAuthenticated && (
                      <Button
                        onClick={handleLogout}
                        variant="danger"
                        className="rounded-md py-1 px-3 w-30"
                      >
                        Logout
                      </Button>
                    )}
                  </div>
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
              deploymentUrl={currentPipeline?.deploymentUrl}
              isConnected={isConnected}
            />
          </div>
        </motion.div>
      </div>
    );
  }
);

Navbar.displayName = 'Navbar';
