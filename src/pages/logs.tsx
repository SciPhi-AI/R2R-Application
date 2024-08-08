'use client';
import { Loader } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import Layout from '@/components/Layout';
import LogTable from '@/components/ui/logtable';
import { useUserContext } from '@/context/UserContext';

const Logs: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[] | null>(null);
  const { getClient, pipeline } = useUserContext();

  const fetchLogs = async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const data = await client.logs();
      console.log('logs:', data);
      setLogs(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pipeline?.deploymentUrl) {
      fetchLogs();
    }
  }, [pipeline?.deploymentUrl]);

  return (
    <Layout pageTitle="Logs" includeFooter={false}>
      <main className="w-full flex flex-col min-h-screen container">
        <div className="absolute inset-0 bg-zinc-900 mt-[5rem] sm:mt-[5rem] ">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1">
            {isLoading ? (
              <Loader className="mx-auto mt-20 animate-spin" size={64} />
            ) : logs === null ? (
              <p>Error loading logs.</p>
            ) : logs.length === 0 ? (
              <p>No logs available.</p>
            ) : (
              <LogTable logs={logs} />
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Logs;
