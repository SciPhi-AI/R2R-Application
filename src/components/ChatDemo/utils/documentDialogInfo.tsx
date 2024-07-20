import React, { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserContext } from '@/context/UserContext';

interface DocumentInfoDialogProps {
  documentId: string;
  pipelineId: string;
  open: boolean;
  onClose: () => void;
}

interface DocumentChunk {
  chunk_order: number;
  text: string;
}

const DocumentInfoDialog: React.FC<DocumentInfoDialogProps> = ({
  documentId,
  pipelineId,
  open,
  onClose,
}) => {
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const { getClient } = useUserContext();

  useEffect(() => {
    const fetchDocumentChunks = async () => {
      if (!pipelineId) {
        console.error('No pipeline ID available');
        return;
      }

      try {
        const client = await getClient(pipelineId);
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const chunks = await client.documentChunks(documentId);

        setDocumentChunks(
          Array.isArray(chunks.results)
            ? (chunks.results as DocumentChunk[])
            : []
        );
      } catch (error) {
        console.error('Error fetching document chunks:', error);
        setDocumentChunks([]);
      }
    };

    if (open && documentId) {
      fetchDocumentChunks();
    }
  }, [open, documentId, pipelineId, getClient]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Document Chunks</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
          {documentChunks.map((chunk, index) => (
            <div key={index} className="bg-zinc-800 p-4 rounded-lg">
              <p className="text-sm text-zinc-400 mb-2">
                Chunk: {chunk.chunk_order}
              </p>
              <p className="text-white">{chunk.text}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentInfoDialog;
