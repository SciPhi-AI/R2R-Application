import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { useEffect, useCallback } from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';
import { UserProvider, useUserContext } from '@/context/UserContext';
import '@/styles/globals.css';
import { initializePostHog } from '@/lib/posthog-client';

function MyAppContent({ Component, pageProps }: AppProps) {
  const { setTheme } = useTheme();
  const { isAuthenticated, isSuperUser, authState } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    setTheme('dark');
    initializePostHog();
  }, []);

  const checkAccess = useCallback(async () => {
    const publicRoutes = ['/auth/login', '/auth/signup'];
    const userRoutes = ['/documents', '/collections', '/collection', '/chat'];
    const currentPath = router.pathname;

    const isUserRoute = (path: string) => {
      return userRoutes.some((route) => path.startsWith(route));
    };

    if (!isAuthenticated) {
      if (!publicRoutes.includes(currentPath)) {
        router.replace('/auth/login');
      }
      return;
    }

    if (isSuperUser()) {
      // Superusers can access all routes
      return;
    }

    if (!isUserRoute(currentPath)) {
      // Non-superusers are redirected to /documents if they try to access any other page
      router.replace('/documents');
    }
  }, [isAuthenticated, isSuperUser, authState.userRole, router]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return <Component {...pageProps} />;
}

function MyApp(props: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <UserProvider>
        <MyAppContent {...props} />
      </UserProvider>
    </ThemeProvider>
  );
}

export default MyApp;
