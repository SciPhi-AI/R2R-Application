// components/Layout.tsx
import Head from 'next/head';
import React, { ReactNode } from 'react';

import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/NavBar';
import { Toaster } from '@/components/ui/toaster';

type Props = {
  children: ReactNode;
  localNav?: ReactNode;
  pageTitle?: string; // Optional prop for setting the page title
  isConnected?: boolean;
};

const Layout: React.FC<Props> = ({
  children,
  localNav,
  pageTitle,
  isConnected,
}) => {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <Head>{pageTitle && <title>{pageTitle} | R2R</title>}</Head>
      <Navbar isConnected={isConnected || true} />
      <main className="flex-grow">{children}</main>
      <Toaster />
      <Footer />
    </div>
  );
};

export default Layout;
