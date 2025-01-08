import Head from 'next/head';
import React, { ReactNode, useEffect, useState } from 'react';

import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/NavBar';
import { Toaster } from '@/components/ui/toaster';

type Props = {
  children: ReactNode;
  pageTitle?: string;
  includeFooter?: boolean;
};

const Layout: React.FC<Props> = ({
  children,
  pageTitle,
  includeFooter = true,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    // Let React know we've mounted
    setHasMounted(true);

    function handleResize() {
      if (window.innerWidth <= 500) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }

    // Run on mount
    handleResize();
    // Add listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Optionally: If you want to avoid SSR flicker, you can return null
  // until we've definitely mounted on the client.
  if (!hasMounted) {
    return null;
  }

  // If the viewport is <= 500px, we just return a “not available” screen
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-900 text-white">
        <Head>
          <title>Mobile Mode Not Available</title>
        </Head>
        <h1 className="text-xl">Mobile mode not available</h1>
      </div>
    );
  }

  // Otherwise, render the normal layout
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <Head>
        <title>
          {pageTitle ? `${pageTitle} | SciPhi Cloud` : 'SciPhi Cloud'}
        </title>
      </Head>
      <Navbar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      <Toaster />
      {includeFooter && <Footer />}
    </div>
  );
};

export default Layout;
