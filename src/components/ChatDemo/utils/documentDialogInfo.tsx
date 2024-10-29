import { format, parseISO } from 'date-fns';
import { Edit, Loader, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  document_type?: string;
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

  const refreshChunks = useCallback(() => {
    if (currentPage) {
      goToPage(currentPage);
    }
  }, [currentPage, goToPage]);

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
                    <InfoRow
                      label="Type"
                      value={documentOverview.document_type}
                    />
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
                  documentOverview.document_type &&
                  ['pdf', 'application/pdf'].includes(
                    documentOverview.document_type.toLowerCase()
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
                <ExpandableDocumentChunks
                  chunks={currentChunks}
                  onChunkDeleted={refreshChunks}
                />

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
  <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
    <span className="font-medium text-gray-200">{label}:</span>
    <span className="text-gray-300 flex items-center space-x-4">
      {value !== undefined
        ? formatValue(value)
        : values
          ? values.map((item, index) => (
              <span key={index} className="flex items-center">
                {item.label && (
                  <span className="mr-1 text-gray-400">{item.label}:</span>
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
  onChunkDeleted?: () => void;
}> = ({ chunks, onChunkDeleted }) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  if (!chunks || chunks.length === 0) {
    return <div>No chunks available.</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Document Chunks</h3>
        <button
          onClick={toggleAllExpanded}
          className="text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="space-y-4">
        {chunks.map((chunk, index) => (
          <ExpandableChunk
            key={index}
            chunk={chunk}
            index={index}
            isExpanded={allExpanded}
            onDelete={onChunkDeleted}
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
  onDelete?: () => void;
}> = ({ chunk, index, isExpanded, onDelete }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(chunk.text);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { getClient } = useUserContext();

  useEffect(() => {
    setLocalExpanded(isExpanded);
  }, [isExpanded]);

  // Abort editing when collapsing the chunk
  useEffect(() => {
    if (!localExpanded && isEditing) {
      // Abort the edit
      setIsEditing(false);
      setEditText(chunk.text);
    }
  }, [localExpanded, isEditing, chunk.text]);

  const toggleExpanded = () => {
    setLocalExpanded(!localExpanded);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(chunk.text);
    setLocalExpanded(true); // Expand the chunk when editing
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditText(chunk.text);
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdating(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.updateChunk(
        chunk.document_id,
        chunk.extraction_id,
        editText,
        chunk.metadata
      );

      chunk.text = editText;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating chunk:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.delete({
        extraction_id: {
          $eq: chunk.extraction_id,
        },
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting chunk:', error);
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const toggleMetadata = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMetadataExpanded(!metadataExpanded);
  };

  return (
    <div className="border border-gray-700 rounded-lg mb-4 bg-zinc-800/50 transition-colors">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={toggleExpanded}
      >
        <span className="font-medium text-lg">
          Chunk {chunk.metadata?.chunk_order ?? index + 1}
        </span>
        <div className="flex items-center space-x-2">
          {!isEditing && !deleting && (
            <>
              <Button
                onClick={handleEdit}
                color="filled"
                className="text-gray-300 hover:text-white"
              >
                <Edit className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleDeleteClick}
                color="danger"
                disabled={deleting}
              >
                <Trash className="h-5 w-5" />
              </Button>
            </>
          )}
          <button className="text-gray-300 hover:text-white transition-colors">
            {localExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </div>
      </div>
      {localExpanded && (
        <div className="px-6 pb-4 text-gray-300 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Extraction ID" value={chunk.extraction_id} />
            <InfoRow label="Document ID" value={chunk.document_id} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="User ID" value={chunk.user_id} />
            <ExpandableInfoRow
              label="Collection IDs"
              values={chunk.collection_ids}
            />
          </div>

          <div className="space-y-2 bg-zinc-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Content:</span>
              {isEditing && (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpdate}
                    color="secondary"
                    shape="slim"
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader className="animate-spin mr-2" size={16} />
                    ) : null}
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    color="secondary"
                    shape="slim"
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-32 bg-zinc-900 text-gray-300 p-2 rounded-md border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="pl-4 pr-2 py-2 text-gray-300 leading-relaxed">
                {chunk.text}
              </p>
            )}
          </div>

          <div className="bg-zinc-800 rounded-lg">
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={toggleMetadata}
            >
              <span className="font-medium text-white">Chunk Metadata</span>
              <button className="text-gray-300 hover:text-white transition-colors">
                {metadataExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
            {metadataExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {Object.entries(chunk.metadata || {}).map(([key, value]) => (
                  <InfoRow key={key} label={key} value={value} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this chunk?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The chunk will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentInfoDialog;
