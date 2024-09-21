import React, { useState, Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';
import { generateIdFromLabel } from '@/lib/utils';

import { UploadDialog } from './UploadDialog';

export interface UploadButtonProps {
  userId: string | null;
  uploadedDocuments: any[];
  setUploadedDocuments: Dispatch<SetStateAction<any[]>>;
  onUploadSuccess?: () => Promise<any[]>;
  showToast?: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
  setPendingDocuments?: Dispatch<SetStateAction<string[]>>;
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
  documentsPerPage?: number;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  userId,
  uploadedDocuments,
  setUploadedDocuments,
  onUploadSuccess,
  showToast = () => {},
  setPendingDocuments,
  setCurrentPage,
  documentsPerPage,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getClient } = useUserContext();

  const handleDocumentUpload = async (files: File[]) => {
    setIsUploading(true);
    const client = await getClient();
    if (!client) {
      throw new Error('Failed to get authenticated client');
    }

    try {
      const uploadedFiles: any[] = [];
      const metadatas: Record<string, any>[] = [];
      const userIds: (string | null)[] = [];

      for (const file of files) {
        const fileId = generateIdFromLabel(file.name);
        uploadedFiles.push({ document_id: fileId, title: file.name });
        metadatas.push({ title: file.name });
        userIds.push(userId);
      }

      await client.ingestFiles(files, {
        metadatas: metadatas,
        user_ids: userIds,
      });

      setUploadedDocuments((prevDocuments) => [
        ...prevDocuments,
        ...uploadedFiles,
      ]);

      if (setPendingDocuments) {
        const newUploadedFiles = uploadedFiles.map((file) => file.document_id);
        setPendingDocuments((prev) => [...prev, ...newUploadedFiles]);
      }

      showToast({
        variant: 'success',
        title: 'Upload Successful',
        description: 'All files have been uploaded successfully.',
      });

      if (onUploadSuccess) {
        const updatedDocuments = await onUploadSuccess();
        if (updatedDocuments.length > 0 && setCurrentPage && documentsPerPage) {
          const totalPages = Math.ceil(
            updatedDocuments.length / documentsPerPage
          );
          setCurrentPage(1);
        } else if (setCurrentPage) {
          setCurrentPage(1);
        }
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
    }
  };

  return (
    <>
      <Button
        type="button"
        color="filled"
        shape="rounded"
        onClick={() => setIsDialogOpen(true)}
        disabled={isUploading}
        className={`pl-2 pr-2 text-white py-2 px-4`}
        style={{ zIndex: 20 }}
      >
        {isUploading ? 'Uploading...' : 'Upload File(s)'}
      </Button>
      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUpload={handleDocumentUpload}
      />
    </>
  );
};
