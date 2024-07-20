'use client';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import React, { useState, useRef } from 'react';

import { Spinner } from '@/components/Spinner';
import { useUserContext } from '@/context/UserContext';

interface UpdateButtonContainerProps {
  pipelineId: string;
  documentId: string;
  onUpdateSuccess: () => void;
  showToast: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

const UpdateButtonContainer: React.FC<UpdateButtonContainerProps> = ({
  pipelineId,
  documentId,
  onUpdateSuccess,
  showToast,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getClient } = useUserContext();

  const handleDocumentUpdate = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    if (
      fileInputRef.current &&
      fileInputRef.current.files &&
      fileInputRef.current.files.length
    ) {
      setIsUpdating(true);
      const file = fileInputRef.current.files[0];

      try {
        const client = await getClient(pipelineId);
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const metadata = { title: file.name };

        await client.updateFiles([file], {
          document_ids: [documentId],
          metadatas: [metadata],
        });

        showToast({
          variant: 'success',
          title: 'Update Successful',
          description: 'The document has been updated',
        });
        onUpdateSuccess();
      } catch (error: any) {
        console.error('Error updating file:', error);
        console.error('Error details:', error.response?.data);
        showToast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error.message || 'An unknown error occurred',
        });
      } finally {
        setIsUpdating(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleUpdateButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <button
        onClick={handleUpdateButtonClick}
        disabled={isUpdating}
        className={`update-button text-white font-bold rounded flex items-center justify-center ${
          isUpdating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'hover:bg-blue-700 bg-blue-500'
        }`}
      >
        {isUpdating ? (
          <Spinner className="h-5 w-5 text-white" />
        ) : (
          <DocumentArrowUpIcon className="h-8 w-8" />
        )}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDocumentUpdate}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default UpdateButtonContainer;
