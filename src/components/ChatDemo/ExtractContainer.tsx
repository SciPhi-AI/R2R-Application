'use client';
import { FileOutput } from 'lucide-react';
import React, { useState } from 'react';

import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';

interface ExtractContainerProps {
  id: string;
  ingestionStatus: string;
  showToast: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

const ExtractButtonContainer: React.FC<ExtractContainerProps> = ({
  id,
  ingestionStatus,
  showToast,
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { getClient } = useUserContext();

  const isIngestionValid = () => {
    return ingestionStatus === 'SUCCESS' || ingestionStatus === 'ENRICHED';
  };

  const handleDocumentExtraction = async () => {
    setIsExtracting(true);

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      client.documents.extract({ id: id });

      showToast({
        variant: 'success',
        title: 'Extraction Started',
        description:
          'The extraction request has been sent and will be processed in the background.',
      });
    } catch (error: any) {
      console.error('Error initiating extraction:', error);
      showToast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: error.message || 'An unknown error occurred',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleDocumentExtraction}
        disabled={isExtracting || !isIngestionValid()}
        color={isExtracting ? 'disabled' : 'text_gray'}
        shape="slim"
        tooltip="Document Extraction"
      >
        {isExtracting ? (
          <Spinner className="h-6 w-6 text-white" />
        ) : (
          <FileOutput className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};
export default ExtractButtonContainer;
