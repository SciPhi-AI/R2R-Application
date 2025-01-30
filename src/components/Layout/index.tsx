import Head from 'next/head';
import { useRouter } from 'next/router';
import React, {
  useState,
  useEffect,
  ReactNode,
} from 'react';

import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/NavBar';
import { Toaster } from '@/components/ui/toaster';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0" style={{ zIndex: -1 }}>
      {/* Base layer with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
      
      {/* Grid overlay - this part is working well already */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(to right, rgb(255,255,255) 1px, transparent 1px), linear-gradient(to bottom, rgb(255,255,255) 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)'
        }}
      />
    </div>
  );
};

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

  const router = useRouter();

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
    <div className="flex flex-col h-screen">
      <AnimatedBackground />
      <Head>
        <title>
          {pageTitle ? `${pageTitle} | SciPhi Cloud` : 'SciPhi Cloud'}
        </title>
      </Head>
      <Navbar />
      {/* Remove overflow-hidden here since we want scrolling at a higher level */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Toaster />
      {includeFooter && <Footer />}
    </div>
  );
};

export default Layout;
