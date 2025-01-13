import { AlertTriangle } from 'lucide-react';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect, useRef } from 'react';

import Layout from '@/components/Layout';

const SearchPage: React.FC = () => {

  return (
      <Layout includeFooter={false}>
        <div className="relative text-center">
          <Alert className="relative inline-block">
            <AlertTitle className="text-lg mt-8 text-zinc-300">
              Cloud application coming here soon.
              <br />
              In the meantime, graphs are available through the{' '}
              <a
                href="https://r2r-docs.sciphi.ai/api-and-sdks/graphs/graphs"
                className="text-indigo-400"
                target="_blank"
              >
                R2R API
              </a>
            </AlertTitle>
          </Alert>
        </div>
      </Layout>
    
  );
};

export default SearchPage;
