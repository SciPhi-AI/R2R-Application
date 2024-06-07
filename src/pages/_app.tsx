import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';
import { UserProvider } from '@/context/UserContext';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
  }, []);

  return (
    <>
      <Head>
        <title>R2R Dashboard</title>

        <link rel="icon" href="public/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

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
    </>
  );
}

export default MyApp;
