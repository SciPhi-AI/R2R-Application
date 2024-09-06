'use client';
import { Loader } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import Layout from '@/components/Layout';
import LogTable from '@/components/ui/logtable';
import { useUserContext } from '@/context/UserContext';

const Logs: React.FC = () => {
  const { getClient, pipeline } = useUserContext();

  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[] | null>(null);
  const [selectedLogs, setSelectedLogs] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const data = await client.logs();
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
    <Layout includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="absolute inset-0 bg-zinc-900 mt-[6rem]">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1">
            {isLoading ? (
              <Loader className="mx-auto mt-20 animate-spin" size={64} />
            ) : logs && logs.length > 0 ? (
              <LogTable logs={logs} />
            ) : (
              <p className="text-center mt-20 text-white">No logs available.</p>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Logs;
