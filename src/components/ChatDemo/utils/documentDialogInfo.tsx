import { Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserContext } from '@/context/UserContext';
import { DocumentInfoDialogProps, DocumentChunk } from '@/types';

const DocumentInfoDialog: React.FC<DocumentInfoDialogProps> = ({
  documentId,
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const { getClient } = useUserContext();

  useEffect(() => {
    const fetchDocumentChunks = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const overview = await client.documentsOverview([documentId]);
        const chunks = await client.documentChunks(documentId);

        setDocumentChunks(
          Array.isArray(chunks.results)
            ? (chunks.results as DocumentChunk[])
            : []
        );
      } catch (error) {
        console.error('Error fetching document chunks:', error);
        setDocumentChunks([]);
      } finally {
        setLoading(false);
      }
    };

    if (open && documentId) {
      fetchDocumentChunks();
    }
  }, [open, documentId, getClient]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Document Chunks
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2 h-96 overflow-y-auto">
          {loading ? (
            <Loader className="mx-auto mt-20 animate-spin" size={64} />
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {documentChunks.map((chunk, index) => (
                <div key={index} className="py-2 border-b border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">
                    Chunk: {chunk.chunk_order}
                  </p>
                  <p className="text-white">{chunk.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentInfoDialog;
