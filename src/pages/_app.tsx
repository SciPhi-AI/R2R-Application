import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { useEffect, useCallback } from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';
import { UserProvider, useUserContext } from '@/context/UserContext';
import '@/styles/globals.css';
import { initializePostHog } from '@/lib/posthog-client';
import { JoyrideProvider } from '@/context/JoyrideContext';  // <--- our new context

function MyAppContent({ Component, pageProps }: AppProps) {
  const { setTheme } = useTheme();
  const { isAuthenticated, isSuperUser, authState } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    setTheme('dark');
    initializePostHog();
  }, []);

  const checkAccess = useCallback(async () => {
    const publicRoutes = [
      '/auth/login',
      '/auth/signup',
      '/auth/verify-email',
      '/auth/reset-password',
      '/auth/oauth/google',
      '/auth/oauth/github',
      '/auth/oauth/*',
    ];
    const userRoutes = [
      // '',
      '/',
      '/documents',
      '/collections',
      '/collection',
      '/chat',
      '/account',
      '/search',
    ];
    const currentPath = router.pathname;

    const isUserRoute = (path: string) => {
      // console.log('route = ', route)
      console.log(
        'userRoutes.some((route) => path.startsWith(route)) = ',
        userRoutes.some((route) => path.startsWith(route))
      );
      console.log('path = ', path);
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
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <UserProvider>
        <JoyrideProvider>
          <MyAppContent {...props} />
        </JoyrideProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default MyApp;
