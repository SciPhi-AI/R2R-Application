import type { AppProps } from 'next/app';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';
import { UserProvider } from '@/context/UserContext';
import '@/styles/globals.css';
import { initializePostHog } from '@/lib/posthog-client';

function MyApp({ Component, pageProps }: AppProps) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
    initializePostHog();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    </ThemeProvider>
  );
}

export default MyApp;
