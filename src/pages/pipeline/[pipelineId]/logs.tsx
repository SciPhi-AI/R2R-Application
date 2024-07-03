'use client';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import { r2rClient } from 'r2r-js';
import React, { useState, useEffect } from 'react';

import LogTable from '@/components/ChatDemo/logtable';
import Layout from '@/components/Layout';
import { usePipelineInfo } from '@/context/PipelineInfo';

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const { pipeline, isLoading: isPipelineLoading } = usePipelineInfo();

  const [selectedLogs, setSelectedLogs] = useState('ALL');
  const [logs, setLogs] = useState<any[]>([]);

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const fetchLogs = async (client: r2rClient) => {
    try {
      const data = await client.logs();
      console.log('data = ', data.results);
      setLogs(data.results || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  useEffect(() => {
    if (pipeline?.deploymentUrl) {
      const client = new r2rClient(pipeline?.deploymentUrl);
      fetchLogs(client);
      sleep(1000);
      setIsLoading(false);
    }
  }, [pipeline?.deploymentUrl, selectedLogs]);

  return (
    <Layout includeFooter={false}>
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
