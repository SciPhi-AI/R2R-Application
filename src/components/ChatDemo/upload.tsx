'use client';
import { useState, useRef } from 'react';

import { R2RClient } from '../../r2r-js-client';

interface UploadButtonProps {
  userId: string;
  apiUrl: string;
  uploadedDocuments: any[];
  onUploadSuccess?: () => void;
  setUploadedDocuments: (docs: any[]) => void;
  showToast?: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  userId,
  apiUrl,
  uploadedDocuments,
  setUploadedDocuments,
  onUploadSuccess,
  showToast = () => {}, // Default value as an empty function
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    if (
      fileInputRef.current &&
      fileInputRef.current.files &&
      fileInputRef.current.files.length
    ) {
      setIsUploading(true);
      const files = Array.from(fileInputRef.current.files);
      const client = new R2RClient(apiUrl);

      try {
        if (!apiUrl) {
          throw new Error('API URL is not defined');
        }
        const uploadedFiles: any[] = [];
        const metadatas: { title: string }[] = [];
        const userIds: string[] = [];
        for (const file of files) {
          if (!file) {
            continue;
          }
          const fileId = client.generateIdFromLabel(file.name);
          uploadedFiles.push({ document_id: fileId, title: file.name });
          metadatas.push({ title: file.name });
          userIds.push(userId);
        }
        console.log('metadatas = ', metadatas);
        console.log('files = ', files);

        await client.ingestFiles(files, metadatas, null);
        console.log('uploadedDocuments = ', uploadedDocuments);
        console.log('uploadedFiles = ', uploadedFiles);
        setUploadedDocuments([...uploadedDocuments, ...uploadedFiles]);
        showToast({
          variant: 'success',
          title: 'Upload Successful',
          description: 'The document has been uploaded',
        });
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        showToast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error.message,
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{ zIndex: 1000 }}>
      <form onSubmit={handleDocumentUpload}>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleDocumentUpload}
        />
        <button
          type="button"
          onClick={handleUploadButtonClick}
          disabled={isUploading}
          className={`pl-2 pr-2 text-white py-2 px-4 rounded-full ${
            isUploading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload File(s)'}
        </button>
      </form>
    </div>
  );
};
