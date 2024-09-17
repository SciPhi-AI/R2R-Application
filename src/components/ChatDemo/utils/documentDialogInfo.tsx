import { format, parseISO } from 'date-fns';
import { Loader } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserContext } from '@/context/UserContext';
import { DocumentInfoDialogProps, DocumentChunk } from '@/types';

interface DocumentOverview {
  created_at?: string;
  group_ids?: string[];
  id?: string;
  ingestion_status?: string;
  metadata?: { title?: string; version?: string };
  restructuring_status?: string;
  title?: string;
  type?: string;
  updated_at?: string;
  user_id?: string;
  version?: string;
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) {
    return 'N/A';
  }
  const date = parseISO(dateString);
  return format(date, 'PPpp');
};

const formatValue = (value: any) => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value.toString();
};

const DocumentInfoDialog: React.FC<DocumentInfoDialogProps> = ({
  id,
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [documentOverview, setDocumentOverview] =
    useState<DocumentOverview | null>(null);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const { getClient } = useUserContext();

  // New state variables for PDF preview
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [initialPage, setInitialPage] = useState<number>(1); // Default to page 1

  useEffect(() => {
    const fetchDocumentInfo = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const overview = await client.documentsOverview([id]);
        setDocumentOverview(overview.results[0] || null);

        const chunks = await client.documentChunks(id);
        setDocumentChunks(
          Array.isArray(chunks.results)
            ? (chunks.results as DocumentChunk[])
            : []
        );
      } catch (error) {
        console.error('Error fetching document information:', error);
        setDocumentOverview(null);
        setDocumentChunks([]);
      } finally {
        setLoading(false);
      }
    };

    if (open && id) {
      fetchDocumentInfo();
    }
  }, [open, id, getClient]);

  const handleOpenPdfPreview = (page?: number) => {
    if (page && page > 0) {
      setInitialPage(page);
    } else {
      setInitialPage(1);
    }
    setPdfPreviewOpen(true);
  };

  const handleClosePdfPreview = () => {
    setPdfPreviewOpen(false);
    setInitialPage(1);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="text-white max-w-4xl">
          <div className="mt-4 space-y-2 h-[calc(90vh-120px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300 -mr-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold mb-2">
                Document Overview
              </DialogTitle>
            </DialogHeader>
            {loading ? (
              <Loader className="mx-auto mt-20 animate-spin" size={64} />
            ) : (
              <>
                {documentOverview && (
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <InfoRow label="Document ID" value={documentOverview.id} />
                    <InfoRow label="Title" value={documentOverview.title} />
                    <InfoRow label="Type" value={documentOverview.type} />
                    <InfoRow
                      label="Dates"
                      values={[
                        {
                          label: 'Created',
                          value: formatDate(documentOverview.created_at),
                        },
                        {
                          label: 'Updated',
                          value: formatDate(documentOverview.updated_at),
                        },
                      ]}
                    />
                    <InfoRow
                      label="Status"
                      values={[
                        {
                          label: 'Ingestion',
                          value: documentOverview.ingestion_status,
                        },
                        {
                          label: 'Restructuring',
                          value: documentOverview.restructuring_status,
                        },
                      ]}
                    />
                    <InfoRow label="Version" value={documentOverview.version} />
                    <InfoRow label="User ID" value={documentOverview.user_id} />
                    <ExpandableInfoRow
                      label="Group IDs"
                      values={documentOverview.group_ids}
                    />
                    <InfoRow
                      label="Metadata"
                      values={[
                        {
                          label: 'Title',
                          value: documentOverview.metadata?.title,
                        },
                        {
                          label: 'Version',
                          value: documentOverview.metadata?.version,
                        },
                      ]}
                    />
                  </div>
                )}
                {documentOverview &&
                  documentOverview.type &&
                  ['pdf', 'application/pdf'].includes(
                    documentOverview.type.toLowerCase()
                  ) && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleOpenPdfPreview()}
                        color="filled"
                      >
                        Preview PDF
                      </Button>
                    </div>
                  )}
                <ExpandableDocumentChunks chunks={documentChunks} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <PdfPreviewDialog
        id={id}
        open={pdfPreviewOpen}
        onClose={handleClosePdfPreview}
        initialPage={initialPage}
      />
    </>
  );
};

const InfoRow: React.FC<{
  label: string;
  value?: any;
  values?: { label?: string; value: any }[];
}> = ({ label, value, values }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700">
    <span className="font-medium">{label}:</span>
    <span className="text-gray-300 flex items-center space-x-4">
      {value !== undefined
        ? formatValue(value)
        : values
          ? values.map((item, index) => (
              <span key={index} className="flex items-center">
                {item.label && (
                  <span className="mr-1 text-gray-500">{item.label}:</span>
                )}
                <span>{formatValue(item.value)}</span>
              </span>
            ))
          : 'N/A'}
    </span>
  </div>
);

const ExpandableInfoRow: React.FC<{
  label: string;
  values?: string[];
}> = ({ label, values }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="py-2 border-b border-gray-700">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}:</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-300 flex items-center space-x-2"
        >
          <span>{values?.length ?? 0} items</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {isExpanded && values && values.length > 0 && (
        <div className="mt-2 pl-4 text-gray-300">
          {values.map((value, index) => (
            <div key={index}>{value}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const ExpandableDocumentChunks: React.FC<{ chunks: DocumentChunk[] }> = ({
  chunks,
}) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2 mt-16">
        <h3 className="text-xl font-bold">Document Chunks</h3>
        <button
          onClick={toggleAllExpanded}
          className="text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="space-y-2">
        {chunks.map((chunk, index) => (
          <ExpandableChunk
            key={chunk.fragment_id || index}
            chunk={chunk}
            index={index}
            isExpanded={allExpanded}
          />
        ))}
      </div>
    </div>
  );
};

const ExpandableChunk: React.FC<{
  chunk: DocumentChunk;
  index: number;
  isExpanded: boolean;
}> = ({ chunk, index, isExpanded }) => {
  const [localExpanded, setLocalExpanded] = useState(false);

  useEffect(() => {
    setLocalExpanded(isExpanded);
  }, [isExpanded]);

  const toggleExpanded = () => {
    setLocalExpanded(!localExpanded);
  };

  return (
    <div className="border-b border-gray-700">
      <div
        className="flex items-center justify-between py-2 cursor-pointer"
        onClick={toggleExpanded}
      >
        <span className="font-medium">
          Chunk {chunk.metadata?.chunk_order ?? index + 1}
        </span>
        <button className="text-gray-300 flex items-center space-x-2">
          {localExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {localExpanded && (
        <div className="py-2 pl-4 text-gray-300 space-y-4">
          <InfoRow label="Fragment ID" value={chunk.fragment_id} />
          <InfoRow label="Extraction ID" value={chunk.extraction_id} />
          <InfoRow label="Document ID" value={chunk.document_id} />
          <InfoRow label="User ID" value={chunk.user_id} />
          <InfoRow label="Group IDs" value={chunk.group_ids} />
          <div className="space-y-2">
            <span className="font-medium">Text:</span>
            <p className="pl-4 pr-2 py-2">{chunk.text}</p>
          </div>
          <div>
            <span className="font-medium">Chunk Metadata:</span>
            <div className="mt-2 pl-4 space-y-2">
              {Object.entries(chunk.metadata || {}).map(([key, value]) => (
                <InfoRow key={key} label={key} value={value} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentInfoDialog;
