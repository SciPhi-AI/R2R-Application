'use client';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { LogTable } from '@/components/ChatDemo/logtable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';

import { R2RLogsRequest } from '../../../r2r-ts-client/models';
import { R2RClient } from '../../../r2r-ts-client';

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;

  const [selectedLogs, setSelectedLogs] = useState('ALL');
  const [logs, setLogs] = useState<any[]>([]);

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const fetchLogs = async (client: R2RClient) => {
    const request: R2RLogsRequest = {};

    try {
      const data = await client.logs(request);
      setLogs(data.results || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  useEffect(() => {
    if (apiUrl) {
      const client = new R2RClient(apiUrl);
      fetchLogs(client);
      sleep(1000);
      setIsLoading(false);
    }
  }, [apiUrl, selectedLogs]);

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen container">
        <div className="absolute inset-0 bg-zinc-900 mt-[5rem] sm:mt-[5rem] ">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1">
            {isLoading && (
              <Loader className="mx-auto mt-20 animate-spin" size={64} />
            )}

            {!isLoading && logs != null && (
              <LogTable logs={Array.isArray(logs) ? logs : []} />
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Index;
