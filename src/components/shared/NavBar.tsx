import clsx from 'clsx';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { forwardRef } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/Button';
import { Code } from '@/components/ui/Code';
import { useUserContext } from '@/context/UserContext';
import { NavbarProps } from '@/types';

export const Navbar = forwardRef<React.ElementRef<'div'>, NavbarProps>(
  function Header({ className }, ref) {
    const { logout, isAuthenticated } = useUserContext();
    const router = useRouter();

    const handleLogout = async () => {
      await logout();
      router.push('/login');
    };

    const { scrollY } = useScroll();
    const bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9]);
    const bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8]);

    const navItems = [
      { path: '/documents', label: 'Documents' },
      { path: '/playground', label: 'Playground' },
      { path: '/logs', label: 'Logs' },
      { path: '/settings', label: 'Settings' },
    ];

    return (
      <motion.div
        ref={ref}
        className={clsx(
          className,
          'fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-12 px-6 transition lg:z-30 lg:px-8 backdrop-blur-sm dark:backdrop-blur',
          'bg-zinc-100 dark:bg-zinc-800'
        )}
        style={
          {
            '--bg-opacity-light': bgOpacityLight,
            '--bg-opacity-dark': bgOpacityDark,
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Logo width={25} height={25} onClick={() => router.push('/')} />
            <Code>
              <span className="text-zinc-800 dark:text-zinc-400">
                R2R Dashboard
              </span>
            </Code>
            <nav>
              <ul role="list" className="flex items-center gap-6">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className="text-sm leading-5 transition text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    >
                      <Code>{item.label}</Code>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
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
        </div>
      </motion.div>
    );
  }
);

Navbar.displayName = 'Navbar';
