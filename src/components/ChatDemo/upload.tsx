import { Plus } from 'lucide-react';
import { UnprocessedChunk } from 'r2r-js/dist/types';
import React, { useState, Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';
import { generateIdFromLabel } from '@/lib/utils';

import { CreateDialog } from './CreateDialog';
import { UploadDialog } from './UploadDialog';

export interface UploadButtonProps {
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
  setUploadedDocuments,
  onUploadSuccess,
  showToast = () => {},
  setPendingDocuments,
  setCurrentPage,
  documentsPerPage,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { getClient } = useUserContext();

  const handleDocumentUpload = async (files: File[], hiRes: boolean = true) => {
    setIsUploading(true);
    const client = await getClient();
    if (!client) {
      throw new Error('Failed to get authenticated client');
    }

    const uploadedFiles: any[] = [];
    const uploadPromises: Promise<any>[] = [];

    for (const file of files) {
      const fileId = generateIdFromLabel(file.name);
      uploadedFiles.push({ documentId: fileId, title: file.name });

      const uploadPromise = client.documents
        .create({
          file: file,
          ingestionMode: hiRes ? 'hi-res' : 'fast',
        })
        .catch((err) => {
          showToast({
            variant: 'destructive',
            title: 'Upload Failed',
            description:
              err instanceof Error
                ? err.message
                : 'An unexpected error occurred',
          });
        });

      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    setUploadedDocuments((prevDocuments) => [
      ...prevDocuments,
      ...uploadedFiles,
    ]);

    if (setPendingDocuments) {
      const newUploadedFiles = uploadedFiles.map((file) => file.documentId);
      setPendingDocuments((prev) => [...prev, ...newUploadedFiles]);
    }

    showToast({
      variant: 'success',
      title: 'Upload Succeeded',
      description:
        'The document ingestion has been requested, refreshing documents...',
    });

    if (onUploadSuccess) {
      await onUploadSuccess().then((updatedDocuments) => {
        if (updatedDocuments.length > 0 && setCurrentPage && documentsPerPage) {
          const totalPages = Math.ceil(
            updatedDocuments.length / documentsPerPage
          );
          setCurrentPage(1);
        } else if (setCurrentPage) {
          setCurrentPage(1);
        }
      });
    }

    setIsUploading(false);
  };

  const handleCreateChunks = async (
    chunks: UnprocessedChunk[],
    documentId?: string,
    metadata?: Record<string, any>
  ) => {
    const client = await getClient();
    if (!client) {
      throw new Error('Failed to get authenticated client');
    }

    const processedChunks = chunks.map((chunk) => ({
      ...chunk,
      documentId: documentId || chunk.documentId,
      metadata: { ...chunk.metadata, ...metadata },
    }));

    client.chunks
      .create({
        chunks: processedChunks,
      })
      .catch((error) => {
        showToast({
          variant: 'destructive',
          title: 'Creation Failed',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        });
      });

    showToast({
      variant: 'success',
      title: 'Chunk Creation Started',
      description: 'Chunks are being created in the background.',
    });

    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  return (
    <>
      <Button
        className="pl-2 pr-2 py-2 px-4"
        color="filled"
        shape="rounded"
        disabled={isUploading}
        style={{ zIndex: 20, minWidth: '100px' }}
        onClick={() => setIsUploadDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4 mt-1" />
        {isUploading ? 'Uploading...' : 'New'}
      </Button>
      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleDocumentUpload}
      />
      <CreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateChunks={handleCreateChunks}
      />
    </>
  );
};
