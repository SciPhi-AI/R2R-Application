import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { R2RClient } from '../../../r2r-js-client';

interface DocumentInfoDialogProps {
  documentId: string;
  apiUrl: string;
  open: boolean;
  onClose: () => void;
}

const DocumentInfoDialog: React.FC<DocumentInfoDialogProps> = ({ documentId, apiUrl, open, onClose }) => {
  const [documentChunks, setDocumentChunks] = useState([]);

  useEffect(() => {
    const fetchDocumentChunks = async () => {
      try {
        const client = new R2RClient(apiUrl);
        const chunks = await client.getDocumentChunks(documentId);
        console.log('Document chunks:', chunks);
        setDocumentChunks(Array.isArray(chunks.results) ? chunks.results : []);
      } catch (error) {
        console.error('Error fetching document chunks:', error);
        setDocumentChunks([]);
      }
    };

    if (open && documentId) {
      fetchDocumentChunks();
    }
  }, [open, documentId, apiUrl]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Document Chunks</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
          {documentChunks.map((chunk, index) => (
            <div key={index} className="bg-zinc-800 p-4 rounded-lg">
              <p className="text-sm text-zinc-400 mb-2">Chunk: {chunk.chunk_order}</p>
              <p className="text-white">{chunk.text}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentInfoDialog;