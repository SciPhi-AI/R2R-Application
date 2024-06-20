'use client';
import React, { useState, useRef } from 'react';
import { R2RClient } from '../../r2r-js-client';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/Spinner';

interface UpdateButtonContainerProps {
  apiUrl: string;
  documentId: string;
  onUpdateSuccess: () => void;
  showToast: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

const UpdateButtonContainer: React.FC<UpdateButtonContainerProps> = ({
  apiUrl,
  documentId,
  onUpdateSuccess,
  showToast,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (
      fileInputRef.current &&
      fileInputRef.current.files &&
      fileInputRef.current.files.length
    ) {
      setIsUpdating(true);
      const file = fileInputRef.current.files[0];
      const client = new R2RClient(apiUrl);

      try {
        if (!apiUrl) {
          throw new Error('API URL is not defined');
        }
        const metadata = { title: file.name };

        await client.updateFiles([file], [documentId], [metadata]);
        showToast({
          variant: 'success',
          title: 'Update Successful',
          description: 'The document has been updated',
        });
        onUpdateSuccess();
      } catch (error) {
        console.error('Error updating file:', error);
        showToast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error.message,
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
          isUpdating ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-blue-700 bg-blue-500'
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
