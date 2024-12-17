import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import { forwardRef, useEffect, useState, ReactNode } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserContext } from '@/context/UserContext';
import { NavbarProps, NavItemsProps } from '@/types';

interface NavItemProps {
  href: string;
  children: ReactNode;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, children, isActive }) => (
  <Link
    href={href}
    className={`px-2 py-1 text-sm font-medium ${
      isActive ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'
    }`}
  >
    {children}
  </Link>
);

const NavItems: React.FC<NavItemsProps> = ({
  isAuthenticated,
  role,
  pathname,
}) => {
  const homeItem = { path: '/', label: 'Home' };

  const commonItems = [
    { path: '/documents', label: 'Documents' },
    { path: '/collections', label: 'Collections' },
    { path: '/chat', label: 'Chat' },
    { path: '/search', label: 'Search' },
  ];

  const adminItems = [
    { path: '/users', label: 'Users' },
    { path: '/logs', label: 'Logs' },
    // { path: '/analytics', label: 'Analytics' },
    // { path: '/settings', label: 'Settings' },
  ];

  const items =
    role === 'admin'
      ? [homeItem, ...commonItems, ...adminItems]
      : [homeItem, ...commonItems];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav>
      <div className="flex items-center space-x-2">
        {items.map((item) => (
          <NavItem
            key={item.path}
            href={item.path}
            isActive={pathname === item.path}
          >
            {item.label}
          </NavItem>
        ))}
      </div>
    </nav>
  );
};

export const Navbar = forwardRef<React.ElementRef<'nav'>, NavbarProps>(
  function Header({ className }, ref) {
    const pathname = usePathname();
    const {
      logout,
      isAuthenticated,
      authState,
      viewMode,
      setViewMode,
      isSuperUser,
    } = useUserContext();
    const router = useRouter();
    const [isSignedIn, setIsSignedIn] = useState(false);

    useEffect(() => {
      const savedAuth = localStorage.getItem('authState');
      if (savedAuth && !isAuthenticated) {
        const authData = JSON.parse(savedAuth);
      }
      setIsSignedIn(isAuthenticated);
    }, [isAuthenticated]);

    const role = viewMode === 'user' ? 'user' : authState.userRole || 'user';

    const handleLogout = async () => {
      await logout();
      router.push('/auth/login');
    };

    return (
      <nav ref={ref} className="bg-zinc-900 shadow z-50 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center space-x-4">
              <Link
                href={isSuperUser() ? '/' : '/documents'}
                className="flex-shrink-0 flex items-center"
              >
                <Logo className="h-12 w-auto" />
                <span className="ml-2 text-xl font-bold text-white">
                  SciPhi
                </span>
              </Link>
              {isSignedIn && (
                <>
                  <span className="text-zinc-400">|</span>
                  <NavItems
                    isAuthenticated={isAuthenticated}
                    role={role}
                    pathname={pathname}
                  />
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button
                color="primary"
                shape="outline_wide"
                onClick={() =>
                  window.open('https://r2r-docs.sciphi.ai', '_blank')
                }
              >
                Docs
              </Button>

              {isSignedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer">
                      <AvatarImage src="/images/default_profile.svg" />
                      <AvatarFallback></AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => router.push('/account')}
                    >
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleLogout}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }
);

Navbar.displayName = 'Navbar';
