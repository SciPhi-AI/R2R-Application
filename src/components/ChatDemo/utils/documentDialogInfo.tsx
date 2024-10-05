import { format, parseISO } from 'date-fns';
import { Loader } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Pagination from '@/components/ui/pagination';
import { useUserContext } from '@/context/UserContext';
import usePagination from '@/hooks/usePagination';
import { DocumentInfoDialogProps, DocumentChunk } from '@/types';

interface DocumentOverview {
  created_at?: string;
  collection_ids?: string[];
  id?: string;
  ingestion_status?: string;
  metadata?: { title?: string; version?: string };
  kg_extraction_status?: string;
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

  const { getClient } = useUserContext();

  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [initialPage, setInitialPage] = useState<number>(1);

  const fetchDocumentOverview = useCallback(
    async (client: any, documentId: string) => {
      const overview = await client.documentsOverview([documentId]);
      return overview.results[0] || null;
    },
    []
  );

  const fetchDocumentChunks = useCallback(
    async (
      offset: number,
      limit: number
    ): Promise<{ results: DocumentChunk[]; total_entries: number }> => {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const chunksResponse = await client.documentChunks(id, offset, limit);
      return {
        results: Array.isArray(chunksResponse.results)
          ? chunksResponse.results
          : [],
        total_entries: chunksResponse.total_entries || 0,
      };
    },
    [getClient, id]
  );

  const {
    currentPage,
    totalPages,
    data: currentChunks,
    loading: chunksLoading,
    goToPage,
  } = usePagination<DocumentChunk>({
    key: id,
    fetchData: fetchDocumentChunks,
    initialPage: 1,
    pageSize: 10,
    initialPrefetchPages: 5,
    prefetchThreshold: 2,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const overview = await fetchDocumentOverview(client, id);
        setDocumentOverview(overview);
      } catch (error) {
        console.error('Error fetching document overview:', error);
        setDocumentOverview(null);
      } finally {
        setLoading(false);
      }
    };

    if (open && id) {
      fetchData();
    }
  }, [open, id, getClient, fetchDocumentOverview]);

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
                          label: 'KG Extraction',
                          value: documentOverview.kg_extraction_status,
                        },
                      ]}
                    />
                    <InfoRow label="Version" value={documentOverview.version} />
                    <InfoRow label="User ID" value={documentOverview.user_id} />
                    <ExpandableInfoRow
                      label="Collection IDs"
                      values={documentOverview.collection_ids}
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
                <ExpandableDocumentChunks chunks={currentChunks} />

                {/* Display Loader only for active page loads */}
                {chunksLoading && (
                  <Loader className="mx-auto mt-4 animate-spin" size={32} />
                )}

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
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

const ExpandableDocumentChunks: React.FC<{
  chunks: DocumentChunk[] | undefined;
}> = ({ chunks }) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  if (!chunks || chunks.length === 0) {
    return <div>No chunks available.</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
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
          <ExpandableInfoRow
            label="Collection IDs"
            values={chunk.collection_ids}
          />
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
