import Head from 'next/head';
import React, { ReactNode } from 'react';

import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/NavBar';
import { Toaster } from '@/components/ui/toaster';
import { brandingConfig } from '@/config/brandingConfig';

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
        <title>{pageTitle ? `${pageTitle} | ${brandingConfig.deploymentName}` : brandingConfig.deploymentName}</title>
      </Head>
      <Navbar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      <Toaster />
      {includeFooter && <Footer />}
    </div>
  );
};

export default Layout;
