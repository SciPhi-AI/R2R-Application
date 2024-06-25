import { r2rClient } from 'r2r-js';
import React, { useState, useEffect } from 'react';

async function checkPipelineStatus(
  deploymentUrl: string | undefined
): Promise<'Connected' | 'No Connection'> {
  if (!deploymentUrl) {
    return 'No Connection';
  }

  try {
    const client = new r2rClient(deploymentUrl);
    await client.healthCheck();
    return 'Connected';
  } catch (error) {
    console.error('Health check failed:', error);
    return 'No Connection';
  }
}

export function useConnectionStatus(
  deploymentUrl?: string,
  onStatusChange?: (isConnected: boolean) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (deploymentUrl) {
        const status = await checkPipelineStatus(deploymentUrl);
        const newConnectionStatus = status === 'Connected';
        setIsConnected(newConnectionStatus);
        onStatusChange?.(newConnectionStatus);
      } else {
        setIsConnected(false);
        onStatusChange?.(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [deploymentUrl, onStatusChange]);

  return isConnected;
}

interface PipelineStatusProps {
  pipeline: {
    deploymentUrl: string;
  };
  className?: string;
  onStatusChange?: (isConnected: boolean) => void;
}

export function PipelineStatus({
  pipeline,
  className = '',
  onStatusChange,
}: PipelineStatusProps) {
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
