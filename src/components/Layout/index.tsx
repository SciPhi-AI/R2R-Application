import Head from 'next/head';
import React, { ReactNode } from 'react';

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
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <Head>
        <title>{pageTitle ? `${pageTitle} | R2R` : 'R2R'}</title>
      </Head>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Toaster />
      {includeFooter && <Footer />}
    </div>
  );
};

export default Layout;
