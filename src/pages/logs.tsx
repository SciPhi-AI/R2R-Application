'use client';
import { AnsiUp } from 'ansi_up';
import { Loader } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';

const ansi_up = new AnsiUp();

function getLevelColor(line: string) {
  const upperLine = line.toUpperCase();
  if (upperLine.includes('ERROR')) return 'bg-red-500';
  if (upperLine.includes('WARNING')) return 'bg-yellow-500';
  if (upperLine.includes('INFO')) return 'bg-green-500';
  return 'bg-blue-500';
}

const Logs: React.FC = () => {
  const { pipeline } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [filterText, setFilterText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pipeline?.deploymentUrl) return;

    const wsUrl =
      pipeline.deploymentUrl.replace(/^http/, 'ws') + '/v3/logs/stream';
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connection established.');
      setIsLoading(false);
    };

    wsRef.current.onmessage = (event) => {
      const newLines = event.data
        .split('\n')
        .filter((line: string) => line.trim() !== '');
      setLogs((prevLogs) => [...prevLogs, ...newLines]);
    };

    wsRef.current.onclose = () => {
      console.warn('WebSocket connection closed. Reconnecting in 1s...');
      setTimeout(() => {
        if (pipeline.deploymentUrl) {
          setIsLoading(true);
        }
      }, 1000);
    };

    wsRef.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      wsRef.current?.close();
    };
  }, [pipeline?.deploymentUrl]);

  // Auto-scroll to bottom when logs change, if enabled
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = filterText
    ? logs.filter((line) =>
        line.toLowerCase().includes(filterText.toLowerCase())
      )
    : logs;

  return (
    <Layout includeFooter={false}>
      {/* Use h-screen to take the full viewport height */}
      <main className="w-full flex flex-col h-screen">
        {/* Container for background and layout */}
        <div className="flex flex-col h-[calc(100%-var(--header-height))] bg-zinc-900 mt-[rem]">
          {/* Centered content */}
          <div className="mx-auto max-w-6xl w-full flex flex-col h-full overflow-hidden">
            {/* Header Bar with Controls (sticky) */}
            <div className="flex items-center p-2 bg-slate-800 text-white sticky top-0 z-10">
              <input
                type="text"
                placeholder="Search logs..."
                className="mr-2 p-2 flex-1 rounded bg-slate-700 text-white placeholder-slate-400"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <button
                onClick={() => setAutoScroll((prev) => !prev)}
                className="ml-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
              >
                {autoScroll ? 'Pause Scrolling' : 'Resume Scrolling'}
              </button>
            </div>

            {/* Logs Container (scrollable area) */}
            <div
              className="flex-1 relative bg-black overflow-auto"
              ref={logsContainerRef}
            >
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader className="text-white animate-spin" size={64} />
                </div>
              ) : filteredLogs && filteredLogs.length > 0 ? (
                <div className="p-4 font-mono text-white">
                  {filteredLogs.map((line, index) => {
                    // Convert ANSI to HTML
                    const htmlContent = ansi_up.ansi_to_html(line);
                    const badgeColor = getLevelColor(line);
                    return (
                      <div
                        key={index}
                        className="whitespace-pre-wrap log-entry flex items-start mb-1"
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${badgeColor}`}
                        />
                        <div
                          dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center mt-20 text-white">
                  No logs available.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Logs;
