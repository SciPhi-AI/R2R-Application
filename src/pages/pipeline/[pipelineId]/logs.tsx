'use client';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { LogTable } from '@/components/ChatDemo/logtable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';

import { R2RClient } from '../../../r2r-js-client';

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;

  const [selectedLogs, setSelectedLogs] = useState('ALL');
  const [logs, setLogs] = useState(null);

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const fetchLogs = (client: R2RClient) => {
    if (selectedLogs === 'ALL') {
      client.getLogs().then((data) => {
        setLogs(data);
      });
    } else {
      client.getLogs(selectedLogs.toLowerCase()).then((data) => {
        setLogs(data);
      });
    }
  };

  useEffect(() => {
    if (apiUrl) {
      const client = new R2RClient(apiUrl);
      // setCurrentPage(1);
      fetchLogs(client);
      sleep(1000);
      setIsLoading(false);
    }
  }, [apiUrl]);

  return (
    <Layout>
      {/* <main className="w-full flex flex-col min-h-screen container mt-[5rem]"> */}
      <main className="w-full flex flex-col min-h-screen container">
        <div className="absolute inset-0 bg-zinc-900 mt-[5rem] sm:mt-[5rem] ">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1">
            {isLoading && (
              <Loader className="mx-auto mt-20 animate-spin" size={64} />
            )}

            {!isLoading && logs != null && <LogTable logs={logs} />}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Index;
