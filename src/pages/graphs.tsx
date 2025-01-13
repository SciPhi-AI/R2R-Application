
import Link from 'next/link';
import { ExternalLink, AlertTriangle } from 'lucide-react';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect, useRef } from 'react';

import Layout from '@/components/Layout';

const SearchPage: React.FC = () => {

  return (
      <Layout includeFooter={false}>
        <div className="relative text-center pl-4 pr-4 pt-2">
          <Alert className="relative inline-block">
            <AlertTitle className="text-lg mt-8 text-zinc-300">
              <AlertTriangle size={20} className="inline-block -mt-1 mr-1 text-accent-base" />
              SciPhi's graph cloud application is coming here soon!
              <br />
              In the meantime, graphs are available through the{' '}
              <Link
                href="https://r2r-docs.sciphi.ai/api-and-sdks/graphs/graphs"
                className="text-accent-base"
                target="_blank"
              >
                R2R API.

                {/* <ExternalLink size={18}  /> */}
                </Link>

            </AlertTitle>
          </Alert>
        </div>
      </Layout>
    
  );
};

export default SearchPage;
