// app.tsx
import * as Sentry from '@sentry/nextjs';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useCallback } from 'react';
import Script from 'next/script'; // <-- Import Next.js Script

import { ThemeProvider } from '@/components/ThemeProvider';
import { JoyrideProvider } from '@/context/JoyrideContext'; // <--- our new context
import { UserProvider, useUserContext } from '@/context/UserContext';
import '@/styles/globals.css';

function MyAppContent({ Component, pageProps }: AppProps) {
  const { setTheme } = useTheme();
  const { isAuthenticated, isSuperUser, authState } = useUserContext();
  const router = useRouter();

  // Example: identify user for PostHog
  const PostHogUserIdentifier: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const { authState } = useUserContext();
    useEffect(() => {
      if (authState?.email && authState?.userId) {
        posthog.identify(authState?.userId, {
          email: authState?.email,
          // Additional properties as needed
        });
      }
    }, [authState]);

    return <>{children}</>;
  };

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

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
      '/',
      '/documents',
      '/collections',
      '/collection',
      '/chat',
      '/account',
      '/search',
    ];
    const currentPath = router.pathname;

    const isUserRoute = (path: string) =>
      userRoutes.some((route) => path.startsWith(route));

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
  }, [isAuthenticated, isSuperUser, router]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return <Component {...pageProps} />;
}

function MyApp(props: AppProps) {
  // Dynamically load env-config.js script
  useEffect(() => {
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
      <>
        {/* Google Tag: Load gtag.js asynchronously */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-16863933652"
        />

        {/* Google Tag: Initialize gtag */}
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-16863933652');
          `}
        </Script>

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
      </>
    </Sentry.ErrorBoundary>
  );
}

export default MyApp;