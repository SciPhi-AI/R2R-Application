'use client';
import { useState, useRef } from 'react';

import { R2RClient } from '../../r2r-ts-client';

interface UpdateButtonProps {
  userId: string;
  apiUrl: string;
  documentId: string;
  onUpdateSuccess: () => void;
  showToast?: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

export const UpdateButton: React.FC<UpdateButtonProps> = ({
  userId,
  apiUrl,
  documentId,
  onUpdateSuccess,
  showToast = () => {},
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentUpdate = async (event) => {
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

        await client.updateFiles([metadata], [file], [documentId], [userId]);
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
    <div style={{ zIndex: 1000 }}>
      <form onSubmit={handleDocumentUpdate}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleDocumentUpdate}
        />
        <button
          type="button"
          onClick={handleUpdateButtonClick}
          disabled={isUpdating}
          className={`${
            isUpdating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'hover:bg-blue-700 bg-blue-500'
          } text-white font-bold py-1 px-2 rounded`}
        >
          {isUpdating ? <span className="animate-spin">↻</span> : '↺'}
        </button>
      </form>
    </div>
  );
};
