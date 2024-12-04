'use client';
import { FileDown } from 'lucide-react';
import React, { useState } from 'react';

import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';
import { DownloadFileContainerProps } from '@/types';

const DownloadButtonContainer: React.FC<DownloadFileContainerProps> = ({
  id,
  fileName,
  showToast,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { getClient } = useUserContext();

  const handleDocumentDownload = async () => {
    setIsDownloading(true);

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const blob = await client.documents.download({ id: id });

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast({
        variant: 'success',
        title: 'Download Successful',
        description: 'The file has been downloaded successfully.',
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      showToast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error.message || 'An unknown error occurred',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleDocumentDownload}
        disabled={isDownloading}
        color={isDownloading ? 'disabled' : 'filled'}
        shape="slim"
        tooltip="Download Document"
      >
        {isDownloading ? (
          <Spinner className="h-6 w-6 text-white" />
        ) : (
          <FileDown className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};

export default DownloadButtonContainer;
