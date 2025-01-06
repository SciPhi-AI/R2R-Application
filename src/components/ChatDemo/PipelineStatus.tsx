import { ServerStats } from 'r2r-js';
import React, { useState, useEffect, useCallback } from 'react';

import { useUserContext } from '@/context/UserContext';
import { PipelineStatusProps } from '@/types';

export function useConnectionStatus(
  deploymentUrl?: string,
  onStatusChange?: (isConnected: boolean) => void
) {
  const { getClient } = useUserContext();
  const [isConnected, setIsConnected] = useState(false);
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [localUptime, setLocalUptime] = useState(0);

  const checkStatusAndFetchStats = useCallback(async () => {
    if (!deploymentUrl) {
      setIsConnected(false);
      onStatusChange?.(false);
      return;
    }

    const client = getClient();
    if (!client) {
      setIsConnected(false);
      onStatusChange?.(false);
      return;
    }

    try {
      await client.system.health();
      setIsConnected(true);
      onStatusChange?.(true);

      const stats = await client.system.status();
      setServerStats(stats.results);
      setLocalUptime(stats.results.uptimeSeconds);
    } catch (error) {
      console.error('Error checking status or fetching stats:', error);
      setIsConnected(false);
      onStatusChange?.(false);
    }
  }, [deploymentUrl, getClient, onStatusChange]);

  useEffect(() => {
    checkStatusAndFetchStats();
    const intervalId = setInterval(checkStatusAndFetchStats, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [checkStatusAndFetchStats]);

  useEffect(() => {
    const uptimeIntervalId = setInterval(() => {
      setLocalUptime((prevUptime) => prevUptime + 1);
    }, 1000);

    return () => clearInterval(uptimeIntervalId);
  }, []);

  return { isConnected, serverStats, localUptime };
}

export function PipelineStatus({
  className = '',
  onStatusChange,
}: PipelineStatusProps) {
  const { pipeline } = useUserContext();
  const { isConnected, localUptime } = useConnectionStatus(
    pipeline?.deploymentUrl,
    onStatusChange
  );

  return (
    <div className={`flex items-center ${className}`}>
      <div
        className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span className="text-xs text-gray-400">
        Status: {isConnected ? 'Connected' : 'No Connection'}
      </span>
    </div>
  );
}
