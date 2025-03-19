import Head from 'next/head';
import React, { ReactNode } from 'react';

import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/NavBar';
import { Toaster } from '@/components/ui/toaster';
import { brandingConfig } from '@/config/brandingConfig';
import { useThemeContext } from '@/context/ThemeContext';

import { LeftSidebar } from '../shared/Sidebar';

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
  const { theme } = useThemeContext();
  return (
    <>
      <div
        className={`flex ${theme === 'dark' ? 'flex-col' : 'flex-row'} min-h-screen bg-primary`}
      >
        <Head>
          <title>
            {pageTitle
              ? `${pageTitle} | ${brandingConfig.deploymentName}`
              : brandingConfig.deploymentName}
          </title>
        </Head>
        {theme === 'dark' ? (
          <Navbar />
        ) : (
          <LeftSidebar href="/" isActive={false} />
        )}
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        <Toaster />
      </div>
      {includeFooter && <Footer />}
    </>
  );
};

export default Layout;
