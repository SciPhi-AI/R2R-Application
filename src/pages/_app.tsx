import * as Sentry from '@sentry/nextjs';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useCallback } from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';
import { JoyrideProvider } from '@/context/JoyrideContext'; // <--- our new context
import { UserProvider, useUserContext } from '@/context/UserContext';
import '@/styles/globals.css';
// import { initializePostHog } from '@/lib/posthog-client';
// import posthog from 'posthog-js';
// import { PostHogProvider } from 'posthog-js/react';

function MyAppContent({ Component, pageProps }: AppProps) {
  const { setTheme } = useTheme();
  const { isAuthenticated, isSuperUser, authState } = useUserContext();
  const router = useRouter();
  // // Check that PostHog is client-side (used to handle Next.js SSR)
  // if (typeof window !== 'undefined') {
  //   posthog.init("phc_pE4e6AhYVYxz0q2JgdVpdcLreryBT3g7zZuWMviCgkb", {
  //     api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  //   });
  // }

  // Add this component before your MyApp component
  const PostHogUserIdentifier: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const { authState } = useUserContext();

    useEffect(() => {
      if (authState?.email && authState?.userId) {
        posthog.identify(authState?.userId, {
          email: authState?.email,
          // Add any other user properties you want to track
          // isSuperUser: authState.userRole === 'SUPER_USER',
        });
      }
    }, [authState]);

    return <>{children}</>;
  };
  useEffect(() => {
    setTheme('dark');
    // initializePostHog();
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
    <Sentry.ErrorBoundary fallback={<p>An error occurred</p>}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <PostHogProvider client={posthog}>
          <UserProvider>
            <JoyrideProvider>
              <MyAppContent {...props} />
            </JoyrideProvider>
          </UserProvider>
        </PostHogProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}

export default MyApp;
