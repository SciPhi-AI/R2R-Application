import { format, parseISO } from 'date-fns';
import { Edit, Loader, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ChunkResponse,
  DocumentResponse,
  EntityResponse,
  RelationshipResponse,
} from 'r2r-js';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '@/context/UserContext';
import usePagination from '@/hooks/usePagination';
import { DocumentInfoDialogProps } from '@/types';

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
  const [documentOverview, setDocumentResponse] =
    useState<DocumentResponse | null>(null);

  const { getClient } = useUserContext();

  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [initialPage, setInitialPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState('chunks');

  const fetchDocumentResponse = useCallback(
    async (client: any, documentId: string) => {
      const overview = await client.documents.list({
        ids: [documentId],
      });
      return overview.results[0] || null;
    },
    []
  );

  const fetchAllChunks = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listChunks({
          id: id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching document chunks:', error);
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, id]
  );

  const fetchAllEntities = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listEntities({
          id: id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching document entities:', error);
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, id]
  );

  const fetchAllRelationships = useCallback(
    async (offset: number, limit: number) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const response = await client.documents.listRelationships({
          id: id,
          offset: offset,
          limit: limit,
        });

        return {
          results: response.results,
          totalEntries: response.totalEntries,
        };
      } catch (error) {
        console.error('Error fetching document relationships:', error);
        return { results: [], totalEntries: 0 };
      }
    },
    [getClient, id]
  );

  // Pagination hooks for chunks
  const {
    currentPage: chunksCurrentPage,
    totalPages: chunksTotalPages,
    data: currentChunks,
    loading: chunksLoading,
    goToPage: goToChunksPage,
  } = usePagination<ChunkResponse>({
    key: `chunks-${id}`,
    fetchData: fetchAllChunks,
    initialPage: 1,
    pageSize: 10,
    initialPrefetchPages: 5,
    prefetchThreshold: 2,
  });

  // Pagination hooks for entities
  const {
    currentPage: entitiesCurrentPage,
    totalPages: entitiesTotalPages,
    data: currentEntities,
    loading: entitiesLoading,
    goToPage: goToEntitiesPage,
  } = usePagination<EntityResponse>({
    key: `entities-${id}`,
    fetchData: fetchAllEntities,
    initialPage: 1,
    pageSize: 10,
    initialPrefetchPages: 5,
    prefetchThreshold: 2,
  });

  // Pagination hooks for relationships
  const {
    currentPage: relationshipsCurrentPage,
    totalPages: relationshipsTotalPages,
    data: currentRelationships,
    loading: relationshipsLoading,
    goToPage: goToRelationshipsPage,
  } = usePagination<RelationshipResponse>({
    key: `relationships-${id}`,
    fetchData: fetchAllRelationships,
    initialPage: 1,
    pageSize: 10,
    initialPrefetchPages: 5,
    prefetchThreshold: 2,
  });

  const refreshChunks = useCallback(() => {
    if (chunksCurrentPage) {
      goToChunksPage(chunksCurrentPage);
    }
  }, [chunksCurrentPage, goToChunksPage]);

  const refreshEntities = useCallback(() => {
    if (entitiesCurrentPage) {
      goToEntitiesPage(entitiesCurrentPage);
    }
  }, [entitiesCurrentPage, goToEntitiesPage]);

  const refreshRelationships = useCallback(() => {
    if (relationshipsCurrentPage) {
      goToRelationshipsPage(relationshipsCurrentPage);
    }
  }, [relationshipsCurrentPage, goToRelationshipsPage]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const overview = await fetchDocumentResponse(client, id);
        setDocumentResponse(overview);
      } catch (error) {
        console.error('Error fetching document overview:', error);
        setDocumentResponse(null);
      } finally {
        setLoading(false);
      }
    };

    if (open && id) {
      fetchData();
    }
  }, [open, id, getClient, fetchDocumentResponse]);

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
        <DialogContent className="text-primary max-w-4xl">
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
                    <InfoRow label="Summary" value={documentOverview.summary} />
                    <InfoRow label="Document ID" value={documentOverview.id} />
                    <InfoRow label="Title" value={documentOverview.title} />
                    <InfoRow
                      label="Type"
                      value={documentOverview.documentType}
                    />
                    <InfoRow
                      label="Dates"
                      values={[
                        {
                          label: 'Created',
                          value: formatDate(documentOverview.createdAt),
                        },
                        {
                          label: 'Updated',
                          value: formatDate(documentOverview.updatedAt),
                        },
                      ]}
                    />
                    <InfoRow
                      label="Status"
                      values={[
                        {
                          label: 'Ingestion',
                          value: documentOverview.ingestionStatus,
                        },
                        {
                          label: 'KG Extraction',
                          value: documentOverview.extractionStatus,
                        },
                      ]}
                    />
                    <InfoRow
                      label="Owner ID"
                      value={documentOverview.ownerId}
                    />
                    <ExpandableInfoRow
                      label="Collection IDs"
                      values={documentOverview.collectionIds}
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
                  documentOverview.documentType &&
                  ['pdf', 'application/pdf'].includes(
                    documentOverview.documentType.toLowerCase()
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
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex flex-col flex-1 mt-4 overflow-hidden"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chunks" className="flex items-center">
                      Chunks
                    </TabsTrigger>
                    <TabsTrigger value="entities" className="flex items-center">
                      Entities
                    </TabsTrigger>
                    <TabsTrigger
                      value="relationships"
                      className="flex items-center"
                    >
                      Relationships
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="chunks" className="flex-1 overflow-auto">
                    <ExpandableDocumentChunks
                      chunks={currentChunks}
                      onChunkDeleted={refreshChunks}
                      currentPage={chunksCurrentPage}
                      pageSize={10}
                    />
                    {chunksLoading && (
                      <Loader className="mx-auto mt-4 animate-spin" size={32} />
                    )}
                    <div className="mb-4" />
                    <Pagination
                      currentPage={chunksCurrentPage}
                      totalPages={chunksTotalPages}
                      onPageChange={goToChunksPage}
                    />
                  </TabsContent>
                  <TabsContent
                    value="entities"
                    className="flex-1 overflow-auto"
                  >
                    <ExpandableDocumentEntities entities={currentEntities} />
                    {entitiesLoading && (
                      <Loader className="mx-auto mt-4 animate-spin" size={32} />
                    )}
                    <div className="mb-4" />
                    <Pagination
                      currentPage={entitiesCurrentPage}
                      totalPages={entitiesTotalPages}
                      onPageChange={goToEntitiesPage}
                    />
                  </TabsContent>

                  <TabsContent
                    value="relationships"
                    className="flex-1 overflow-auto"
                  >
                    <ExpandableDocumentRelationships
                      relationships={currentRelationships}
                    />
                    {relationshipsLoading && (
                      <Loader className="mx-auto mt-4 animate-spin" size={32} />
                    )}
                    <div className="mb-4" />
                    <Pagination
                      currentPage={relationshipsCurrentPage}
                      totalPages={relationshipsTotalPages}
                      onPageChange={goToRelationshipsPage}
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* <PdfPreviewDialog
        id={id}
        open={pdfPreviewOpen}
        onClose={handleClosePdfPreview}
        initialPage={initialPage}
      /> */}
    </>
  );
};

// InfoRow Component
const InfoRow: React.FC<{
  label: string;
  value?: any;
  values?: { label?: string; value: any }[];
}> = ({ label, value, values }) => {
  const isLongContent =
    value?.length > 100 || values?.some((v) => v.value?.length > 100);

  return (
    <div
      className={`py-2 border-b border-gray-700/50 ${
        isLongContent
          ? 'flex flex-col space-y-2'
          : 'flex items-center justify-between'
      }`}
    >
      <span className="font-medium text-gray-200">{label}:</span>
      <span
        className={`text-gray-300 ${isLongContent ? 'mt-1' : 'flex items-center space-x-4'}`}
      >
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
};

// ExpandableInfoRow Component
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

// ExpandableDocumentChunks Component
const ExpandableDocumentChunks: React.FC<{
  chunks: ChunkResponse[] | undefined;
  onChunkDeleted?: () => void;
  currentPage?: number;
  pageSize?: number;
}> = ({ chunks, onChunkDeleted, currentPage = 1, pageSize = 10 }) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  if (!chunks || chunks.length === 0) {
    return <div>No chunks available.</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={toggleAllExpanded}
          className="text-accent-base hover:text-accent-dark transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="space-y-4">
        {chunks.map((chunk, index) => (
          <ExpandableChunk
            key={index}
            chunk={chunk}
            index={(currentPage - 1) * pageSize + index}
            isExpanded={allExpanded}
            onDelete={onChunkDeleted}
          />
        ))}
      </div>
    </div>
  );
};

// ExpandableChunk Component
const ExpandableChunk: React.FC<{
  chunk: ChunkResponse;
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

      await client.chunks.update({
        id: chunk.id,
        text: editText,
        metadata: chunk.metadata,
      });
      setIsEditing(false);
      onDelete?.();
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

      // Corrected to use chunk.id
      await client.chunks.delete({
        id: chunk.id,
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
                className="text-gray-300 hover:text-primary"
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
          <button className="text-gray-300 hover:text-primary transition-colors">
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
            <InfoRow label="Extraction ID" value={chunk.id} />
            <InfoRow label="Document ID" value={chunk.documentId} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="User ID" value={chunk.userId} />
            <ExpandableInfoRow
              label="Collection IDs"
              values={chunk.collectionIds}
            />
          </div>

          <div className="space-y-2 bg-zinc-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-primary">Content:</span>
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
                className="w-full h-32 bg-zinc-900 text-gray-300 p-2 rounded-md border border-gray-700 focus:border-accent-dark focus:ring-1 focus:ring-accent-dark"
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
              <span className="font-medium text-primary">Chunk Metadata</span>
              <button className="text-gray-300 hover:text-primary transition-colors">
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

// ExpandableDocumentEntities Component
const ExpandableDocumentEntities: React.FC<{
  entities: EntityResponse[] | undefined;
  onChunkDeleted?: () => void;
}> = ({ entities }) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  if (!entities || entities.length === 0) {
    return <div>No entities available.</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={toggleAllExpanded}
          className="text-accent-base hover:text-accent-dark transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="space-y-4">
        {entities.map((entity, index) => (
          <ExpandableEntity
            key={index}
            entity={entity}
            index={index}
            isExpanded={allExpanded}
          />
        ))}
      </div>
    </div>
  );
};

// ExpandableEntity Component
const ExpandableEntity: React.FC<{
  entity: EntityResponse;
  index: number;
  isExpanded: boolean;
}> = ({ entity, index, isExpanded }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  useEffect(() => {
    setLocalExpanded(isExpanded);
  }, [isExpanded]);

  const toggleExpanded = () => {
    setLocalExpanded(!localExpanded);
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
        <span className="font-medium text-lg">{entity.name}</span>
        <div className="flex items-center space-x-2">
          <button className="text-gray-300 hover:text-primary transition-colors">
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
            <InfoRow label="Entity ID" value={entity.id} />
            <InfoRow label="Category" value={entity.category} />
          </div>
          <ExpandableInfoRow label="Chunk IDs" values={entity.chunkIds} />

          <div className="space-y-2 bg-zinc-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-primary">Content:</span>
            </div>
            <p className="pl-4 pr-2 py-2 text-gray-300 leading-relaxed">
              {entity.description}
            </p>
          </div>

          <div className="bg-zinc-800 rounded-lg">
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={toggleMetadata}
            >
              <span className="font-medium text-primary">Entity Metadata</span>
              <button className="text-gray-300 hover:text-primary transition-colors">
                {metadataExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                {metadataExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {Object.entries(entity.metadata || {}).map(
                      ([key, value]) => (
                        <InfoRow key={key} label={key} value={value} />
                      )
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ExpandableDocumentRelationships Component
const ExpandableDocumentRelationships: React.FC<{
  relationships: RelationshipResponse[] | undefined;
  onChunkDeleted?: () => void;
}> = ({ relationships }) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  if (!relationships || relationships.length === 0) {
    return <div>No relationships available.</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={toggleAllExpanded}
          className="text-accent-base hover:text-accent-dark transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="space-y-4">
        {relationships.map((relationship, index) => (
          <ExpandableRelationship
            key={index}
            relationship={relationship}
            index={index}
            isExpanded={allExpanded}
          />
        ))}
      </div>
    </div>
  );
};

// ExpandableEntity Component
const ExpandableRelationship: React.FC<{
  relationship: RelationshipResponse;
  index: number;
  isExpanded: boolean;
}> = ({ relationship, index, isExpanded }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  useEffect(() => {
    setLocalExpanded(isExpanded);
  }, [isExpanded]);

  const toggleExpanded = () => {
    setLocalExpanded(!localExpanded);
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
          {relationship.subject} {relationship.predicate} {relationship.object}
        </span>
        <div className="flex items-center space-x-2">
          <button className="text-gray-300 hover:text-primary transition-colors">
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
            <InfoRow label="Relationship ID" value={relationship.id} />
            <InfoRow label="Relationship Weight" value={relationship.weight} />
            <InfoRow label="Subject ID" value={relationship.subjectId} />
            <InfoRow label="Object ID" value={relationship.objectId} />
          </div>
          <ExpandableInfoRow label="Chunk IDs" values={relationship.chunkIds} />

          <div className="space-y-2 bg-zinc-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-primary">Content:</span>
            </div>
            <p className="pl-4 pr-2 py-2 text-gray-300 leading-relaxed">
              {relationship.description}
            </p>
          </div>

          <div className="bg-zinc-800 rounded-lg">
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={toggleMetadata}
            >
              <span className="font-medium text-primary">Entity Metadata</span>
              <button className="text-gray-300 hover:text-primary transition-colors">
                {metadataExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                {metadataExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {Object.entries(relationship.metadata || {}).map(
                      ([key, value]) => (
                        <InfoRow key={key} label={key} value={value} />
                      )
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentInfoDialog;
