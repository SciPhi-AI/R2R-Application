'use client';
import { FileUp } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';
import { UpdateButtonContainerProps } from '@/types';

const UpdateButtonContainer: React.FC<UpdateButtonContainerProps> = ({
  id,
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
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const metadata = { title: file.name };

        await client.updateFiles([file], {
          document_ids: [id],
          metadatas: [metadata],
        });

        showToast({
          variant: 'success',
          title: 'Upload Successful',
          description: 'All files have been uploaded successfully.',
        });
        onUpdateSuccess();
      } catch (error: any) {
        console.error('Error updating file:', error);
        console.error('Error details:', error.response?.data);
        showToast({
          variant: 'destructive',
          title: 'Upload Failed',
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
      <Button
        onClick={handleUpdateButtonClick}
        disabled={isUpdating}
        color={isUpdating ? 'disabled' : 'filled'}
        shape="slim"
      >
        {isUpdating ? (
          <Spinner className="h-5 w-5 text-white" />
        ) : (
          <FileUp className="h-8 w-8" />
        )}
      </Button>
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
