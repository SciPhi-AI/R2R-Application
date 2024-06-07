// components/Layout.tsx
import Head from 'next/head';
import React, { ReactNode } from 'react';

import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/NavBar';

type Props = {
  children: ReactNode;
  localNav?: ReactNode;
  pageTitle?: string; // Optional prop for setting the page title
};

const Layout: React.FC<Props> = ({ children, localNav, pageTitle }) => {
  return (
    <div className="w-full relative">
      <Head>{pageTitle && <title>{pageTitle} | R2R</title>}</Head>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
