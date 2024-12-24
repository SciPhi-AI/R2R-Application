import { FileUp } from 'lucide-react';
import React, { useState, Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';
import { generateIdFromLabel } from '@/lib/utils';

import { UploadDialog } from './UploadDialog';

export interface CreateFileButton {
  userId: string | null;
  onUploadSuccess?: () => Promise<any[]>;
  showToast?: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
  documentsPerPage?: number;
}

export const CreateFileButton: React.FC<CreateFileButton> = ({
  userId,
  onUploadSuccess,
  showToast = () => {},
  setCurrentPage,
  documentsPerPage,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getClient } = useUserContext();

  const handleCreateDocument = async (files: File[]) => {
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
        uploadedFiles.push({ documentId: fileId, title: file.name });
        metadatas.push({ title: file.name });
        userIds.push(userId);
      }

      for (const file of files) {
        await client.documents.create({
          file: file,
        });
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
        <FileUp className="mr-2 h-4 w-4 mt-1" />
        {isUploading ? 'Uploading...' : 'Upload Chunks'}
      </Button>
      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUpload={handleCreateDocument}
      />
    </>
  );
};
