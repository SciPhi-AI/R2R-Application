'use client';

import {
  Home,
  FileText,
  Folder,
  MessageSquare,
  Search,
  Settings,
  Users,
  Activity,
  BookOpen,
  LogOut,
  CircleUserRound,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { forwardRef, useEffect, useState, ReactNode } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { brandingConfig } from '@/config/brandingConfig';
import { useUserContext } from '@/context/UserContext';
import { NavItemsProps } from '@/types';

import ThemeToggle from './ThemeToggle';

interface LeftSidebarProps {
  href: string;
  isActive: boolean;
}

// const NavItem: React.FC<LeftSidebarProps> = ({ href, children, isActive }) => (
//   <Link
//     href={href}
//     className={`px-2 py-1 text-sm font-medium ${
//       isActive ? 'text-accent' : 'text-secondary hover:text-white'
//     }`}
//   >
//     {children}
//   </Link>
// );

const NavItems: React.FC<NavItemsProps> = ({
  isAuthenticated,
  role,
  pathname,
}) => {
  const router = useRouter();
  const homeItem = {
    path: '/',
    label: 'Home',
    show: brandingConfig.navbar.menuItems.home,
    icon: <Home className="w-5 h-5 mr-3" />,
  };

  const commonItems = [
    {
      path: '/documents',
      label: 'Documents',
      show: brandingConfig.navbar.menuItems.documents,
      icon: <FileText className="w-5 h-5 mr-3" />,
    },
    {
      path: '/collections',
      label: 'Collections',
      show: brandingConfig.navbar.menuItems.collections,
      icon: <Folder className="w-5 h-5 mr-3" />,
    },
    {
      path: '/chat',
      label: 'Chat',
      show: brandingConfig.navbar.menuItems.chat,
      icon: <MessageSquare className="w-5 h-5 mr-3" />,
    },
    {
      path: '/search',
      label: 'Search',
      show: brandingConfig.navbar.menuItems.search,
      icon: <Search className="w-5 h-5 mr-3" />,
    },
  ];

  const adminItems = [
    {
      path: '/users',
      label: 'Users',
      show: brandingConfig.navbar.menuItems.users,
      icon: <Users className="w-5 h-5 mr-3" />,
    },
    {
      path: '/logs',
      label: 'Logs',
      show: brandingConfig.navbar.menuItems.logs,
      icon: <Activity className="w-5 h-5 mr-3" />,
    },
    {
      path: '/analytics',
      label: 'Analytics',
      show: brandingConfig.navbar.menuItems.analytics,
      icon: <BarChart3 className="w-5 h-5 mr-3" />,
    },
    {
      path: '/settings',
      label: 'Settings',
      show: brandingConfig.navbar.menuItems.settings,
      icon: <Settings className="w-5 h-5 mr-3" />,
    },
  ];

  const items =
    role === 'admin'
      ? [homeItem, ...commonItems, ...adminItems]
      : [...commonItems];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="flex-1 px-2 py-4">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.path}>
            <button
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                pathname === item.path
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const LeftSidebar = forwardRef<
  React.ElementRef<'nav'>,
  LeftSidebarProps
>(function LeftSidebar(ref) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const {
    logout,
    isAuthenticated,
    authState,
    viewMode,
    setViewMode,
    isSuperUser,
  } = useUserContext();

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
    <div className="flex flex-col h-screen w-64 bg-sidebar text-white shadow-lg border-r">
      {/* Profile Section */}
      <div className="p-4 flex justify-between items-center">
        <Link
          href={isSuperUser() ? '/' : '/documents'}
          className="flex-shrink-0 flex items-center"
        >
          <Logo className="h-12 w-auto" />
          <span className="text-2xl font-bold text-white">
            {brandingConfig.navbar.appName}
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {isSignedIn && (
        <>
          <NavItems
            isAuthenticated={isAuthenticated}
            role={role}
            pathname={pathname}
          />
        </>
      )}

      {/* Footer Navigation */}
      <div className="mt-auto p-4 border-t">
        <ul className="space-y-2">
          {brandingConfig.navbar.showDocsButton && (
            <li>
              <button
                onClick={() =>
                  window.open('https://r2r-docs.sciphi.ai', '_blank')
                }
                className="flex items-center text-sm p-2 hover:bg-muted rounded-lg w-full"
              >
                <BookOpen className="w-5 h-5 mr-3" />
                Documentation
              </button>
            </li>
          )}
          {isSignedIn && (
            <>
              <li>
                <button
                  onClick={() => router.push('/account')}
                  className="flex items-center text-sm p-2 hover:bg-muted rounded-lg w-full"
                >
                  <CircleUserRound className="w-5 h-5 mr-3" />
                  Account
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm p-2 hover:bg-muted rounded-lg w-full"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
});
