import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { useEffect, useCallback } from 'react';

import { brandingConfig } from '@/config/brandingConfig';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider, useUserContext } from '@/context/UserContext';
import '@/styles/globals.css';
import { initializePostHog } from '@/lib/posthog-client';

function MyAppContent({ Component, pageProps }: AppProps) {
  const { setTheme } = useTheme();
  const { isAuthenticated, isSuperUser, authState } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    setTheme(brandingConfig.theme);
    initializePostHog();
  }, []);

  const checkAccess = useCallback(async () => {
    const publicRoutes = ['/auth/login', '/auth/signup'];
    const userRoutes = [
      '/documents',
      '/collections',
      '/collection',
      '/chat',
      '/account',
    ];
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
      return;
    }

    if (!isUserRoute(currentPath)) {
      router.replace('/documents');
    }
  }, [isAuthenticated, isSuperUser, authState.userRole, router]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return <Component {...pageProps} />;
}

function MyApp(props: AppProps) {
  // Move the runtime config check into useEffect
  useEffect(() => {
    // Load the env-config.js script dynamically
    const script = document.createElement('script');
    script.src = '/env-config.js';
    script.onload = () => {
      if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
        console.log('Runtime Config:', window.__RUNTIME_CONFIG__);
      } else {
        console.warn('Runtime Config not found!');
      }
    };
    document.body.appendChild(script);
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <MyAppContent {...props} />
      </UserProvider>
    </ThemeProvider>
  );
}

export default MyApp;
