import { r2rClient } from 'r2r-js';
import React, { useState, useEffect, useCallback } from 'react';

import { useUserContext } from '@/context/UserContext';
import { PipelineStatusProps } from '@/types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function checkPipelineStatus(
  deploymentUrl: string | undefined,
  getClient: () => r2rClient | null
): Promise<'Connected' | 'No Connection'> {
  if (!deploymentUrl) {
    return 'No Connection';
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const client = getClient();
      if (!client) {
        return 'No Connection';
      }
      await client.health();
      return 'Connected';
    } catch (error) {
      console.warn(`Health check attempt ${attempt + 1} failed:`, error);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  console.error('Health check failed after multiple attempts');
  return 'No Connection';
}

export function useConnectionStatus(
  deploymentUrl?: string,
  onStatusChange?: (isConnected: boolean) => void
) {
  const { getClient } = useUserContext();
  const [isConnected, setIsConnected] = useState(false);

  const checkStatus = useCallback(async () => {
    if (deploymentUrl) {
      const status = await checkPipelineStatus(deploymentUrl, getClient);
      const newConnectionStatus = status === 'Connected';
      setIsConnected(newConnectionStatus);
      onStatusChange?.(newConnectionStatus);
    } else {
      setIsConnected(false);
      onStatusChange?.(false);
    }
  }, [deploymentUrl, getClient, onStatusChange]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  return isConnected;
}

export function PipelineStatus({
  className = '',
  onStatusChange,
}: PipelineStatusProps) {
  const { pipeline } = useUserContext();
  const isConnected = useConnectionStatus(
    pipeline?.deploymentUrl,
    onStatusChange
  );

  return (
    <div className={`flex items-center ${className}`}>
      <div
        className={`w-2 h-2 rounded-full mr-2 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-xs text-gray-400">
        Status: {isConnected ? 'Connected' : 'No Connection'}
      </span>
    </div>
  );
}
