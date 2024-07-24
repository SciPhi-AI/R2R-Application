import clsx from 'clsx';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import { forwardRef } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/Button';
import { Code } from '@/components/ui/Code';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserContext } from '@/context/UserContext';
import { AdminBadgeProps, NavbarProps, NavItemsProps } from '@/types';

const NavItems: React.FC<NavItemsProps> = ({
  isAuthenticated,
  isAdmin,
  pathname,
}) => {
  const commonItems = [
    { path: '/documents', label: 'Documents' },
    { path: '/playground', label: 'Playground' },
  ];

  const adminItems = [
    { path: '/users', label: 'Users' },
    { path: '/logs', label: 'Logs' },
    { path: '/settings', label: 'Settings' },
  ];

  const items = isAdmin ? [...commonItems, ...adminItems] : commonItems;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav>
      <ul role="list" className="flex items-center gap-6">
        {items.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={clsx(
                'text-sm leading-5 transition',
                pathname === item.path
                  ? 'text-link'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              )}
            >
              <Code>{item.label}</Code>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const AdminBadge: React.FC<AdminBadgeProps> = ({ isAdmin }) => {
  if (!isAdmin) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button className="rounded-md py-1 px-3 w-30" variant="filled">
            Admin View
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>You're interacting as an administrator.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const Navbar = forwardRef<React.ElementRef<'div'>, NavbarProps>(
  function Header({ className }, ref) {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const { logout, isAuthenticated, authState } = useUserContext();
    const router = useRouter();

    const isAdmin = isAuthenticated && authState.userRole === 'admin';

    const handleLogout = async () => {
      await logout();
      router.push('/login');
    };

    const { scrollY } = useScroll();
    const bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9]);
    const bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8]);
    const handleHomeClick = () => router.push('/');

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
            <Logo width={25} height={25} onClick={handleHomeClick} />
            <Link href="/" onClick={handleHomeClick}>
              <Code>
                <span
                  className={clsx(
                    'text-sm leading-5 transition',
                    isHomePage
                      ? 'text-link'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  )}
                >
                  R2R Dashboard
                </span>
              </Code>
            </Link>
            <NavItems
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              pathname={pathname}
            />
          </div>
          <div className="flex items-center space-x-4">
            <AdminBadge isAdmin={isAdmin} />
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
