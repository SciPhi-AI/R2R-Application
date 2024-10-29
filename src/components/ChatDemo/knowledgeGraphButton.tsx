import {
  FileUp,
  PencilLine,
  Workflow,
  BrainCog,
  BrainCircuit,
} from 'lucide-react';
import React, { useState, Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { useUserContext } from '@/context/UserContext';
import { generateIdFromLabel } from '@/lib/utils';

import { CreateDialog } from './CreateDialog';
import { UploadDialog } from './UploadDialog';

export interface KnowledgeGraphButtonProps {}

export const KnowledgeGraphButton: React.FC<
  KnowledgeGraphButtonProps
> = ({}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { getClient } = useUserContext();

  const handleDocumentUpload = async (files: File[]) => {
    setIsUploading(true);
    const client = await getClient();
    if (!client) {
      throw new Error('Failed to get authenticated client');
    }

    try {
      //   const uploadedFiles: any[] = [];
      //   const metadatas: Record<string, any>[] = [];
      //   const userIds: (string | null)[] = [];
      //   for (const file of files) {
      //     const fileId = generateIdFromLabel(file.name);
      //     uploadedFiles.push({ document_id: fileId, title: file.name });
      //     metadatas.push({ title: file.name });
      //     userIds.push(userId);
      //   }
      //   await client.ingestFiles(files, {
      //     metadatas: metadatas,
      //     user_ids: userIds,
      //   });
      //   setUploadedDocuments((prevDocuments) => [
      //     ...prevDocuments,
      //     ...uploadedFiles,
      //   ]);
      //   if (setPendingDocuments) {
      //     const newUploadedFiles = uploadedFiles.map((file) => file.document_id);
      //     setPendingDocuments((prev) => [...prev, ...newUploadedFiles]);
      //   }
      //   showToast({
      //     variant: 'success',
      //     title: 'Upload Successful',
      //     description: 'All files have been uploaded successfully.',
      //   });
      //   if (onUploadSuccess) {
      //     const updatedDocuments = await onUploadSuccess();
      //     if (updatedDocuments.length > 0 && setCurrentPage && documentsPerPage) {
      //       const totalPages = Math.ceil(
      //         updatedDocuments.length / documentsPerPage
      //       );
      //       setCurrentPage(1);
      //     } else if (setCurrentPage) {
      //       setCurrentPage(1);
      //     }
      //   }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      //   showToast({
      //     variant: 'destructive',
      //     title: 'Upload Failed',
      //     description: error.message,
      //   });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateChunks = async (
    chunks: Array<{ text: string }>,
    documentId?: string,
    metadata?: Record<string, any>
  ) => {
    const client = await getClient();
    if (!client) {
      throw new Error('Failed to get authenticated client');
    }

    try {
      //   await client.ingestChunks(chunks, documentId, metadata);
      //   showToast({
      //     variant: 'success',
      //     title: 'Chunks Created',
      //     description: 'All chunks have been created successfully.',
      //   });
      //   if (onUploadSuccess) {
      //     await onUploadSuccess();
      //   }
    } catch (error: any) {
      //   console.error('Error creating chunks:', error);
      //   showToast({
      //     variant: 'destructive',
      //     title: 'Creation Failed',
      //     description: error.message,
      //   });
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="pl-2 pr-2 py-2 px-4"
            color="filled"
            shape="rounded"
            disabled={isUploading}
            style={{ zIndex: 20, minWidth: '100px' }}
          >
            <Workflow className="mr-2 h-4 w-4 mt-1" />
            {isUploading ? 'Uploading...' : 'Knowledge Graph'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[150px] p-1">
          <div className="flex flex-col gap-1">
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              color="secondary"
              className="flex justify-between items-center"
            >
              <BrainCog className="mr-2 h-4 w-4" />
              <span>Create Graph</span>
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              color="secondary"
              className="flex justify-between items-center"
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              <span>Enrich Graph</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
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
