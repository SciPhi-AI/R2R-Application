import { r2rClient } from 'r2r-js';
import { useState, useRef } from 'react';

import { generateIdFromLabel } from '@/lib/utils';

interface UploadButtonProps {
  userId: string | null;
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
  showToast = () => {},
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      await handleDocumentUpload(event.target.files);
    }
  };

  const handleDocumentUpload = async (files: FileList) => {
    setIsUploading(true);
    const client = new r2rClient(apiUrl);

    try {
      if (!apiUrl) {
        throw new Error('API URL is not defined');
      }
      const uploadedFiles: any[] = [];
      const metadatas: Record<string, any>[] = [];
      const userIds: (string | null)[] = [];
      const filePaths: string[] = [];
      const filesToUpload: File[] = [];

      for (const file of Array.from(files)) {
        if (!file) {
          continue;
        }
        const fileId = generateIdFromLabel(file.name);
        uploadedFiles.push({ document_id: fileId, title: file.name });
        metadatas.push({ title: file.name });
        userIds.push(userId);
        filesToUpload.push(file);
      }

      await client.ingestFiles(filesToUpload, {
        metadatas: metadatas,
        user_ids: userIds,
      });

      // Clean up temporary URLs
      filePaths.forEach(URL.revokeObjectURL);

      setUploadedDocuments([...uploadedDocuments, ...uploadedFiles]);
      showToast({
        variant: 'success',
        title: 'Upload Successful',
        description: 'The document has been uploaded',
      });
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
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
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{ zIndex: 1000 }}>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
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
    </div>
  );
};
