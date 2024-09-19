import { Loader } from 'lucide-react';
import { FileSearch2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import Table, { Column } from '@/components/ChatDemo/Table';
import UpdateButtonContainer from '@/components/ChatDemo/UpdateButtonContainer';
import { UploadButton } from '@/components/ChatDemo/upload';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import Pagination from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import usePagination from '@/hooks/usePagination';
import { IngestionStatus, DocumentInfoType } from '@/types';

const Index: React.FC = () => {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { pipeline, getClient } = useUserContext();
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);

  const fetchDocuments = useCallback(
    async (
      offset: number,
      limit: number
    ): Promise<{ results: DocumentInfoType[]; total_entries: number }> => {
      if (!pipeline?.deploymentUrl) {
        console.error('No pipeline deployment URL available');
        return { results: [], total_entries: 0 };
      }

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const data = await client.documentsOverview(undefined, offset, limit);
        const results: DocumentInfoType[] = data.results;
        setPendingDocuments(
          results
            .filter(
              (doc: DocumentInfoType) =>
                doc.ingestion_status !== IngestionStatus.SUCCESS &&
                doc.ingestion_status !== IngestionStatus.FAILURE
            )
            .map((doc: DocumentInfoType) => doc.id)
        );
        setError(null);
        setSelectedDocumentIds([]);

        return { results, total_entries: data.total_entries };
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to fetch documents. Please try again later.');
        return { results: [], total_entries: 0 };
      }
    },
    [pipeline?.deploymentUrl, getClient]
  );

  const {
    currentPage,
    totalPages,
    data: documents,
    loading: isLoading,
    prefetching,
    goToPage,
    updateData,
  } = usePagination<DocumentInfoType>({
    key: 'documents',
    fetchData: fetchDocuments,
    initialPage: 1,
    pageSize: 10,
    initialPrefetchPages: 5,
    prefetchThreshold: 2,
    includeUpdateData: true,
  });

  const refetchDocuments = useCallback(async () => {
    const { results, total_entries } = await fetchDocuments(
      (currentPage - 1) * 10,
      10
    );
    updateData(results, total_entries);
  }, [currentPage, fetchDocuments, updateData]);

  const fetchPendingDocuments = useCallback(async () => {
    if (!pipeline?.deploymentUrl) {
      console.error('No pipeline deployment URL available');
      return;
    }

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const data = await client.documentsOverview();
      const updatedDocuments = data.results.filter((doc: DocumentInfoType) =>
        pendingDocuments.includes(doc.id)
      );

      // If there are updates, refresh the current page
      if (updatedDocuments.length > 0) {
        goToPage(currentPage);
      }

      setPendingDocuments((prevPending) =>
        prevPending.filter((id) =>
          updatedDocuments.some(
            (doc: DocumentInfoType) =>
              doc.id === id &&
              doc.ingestion_status !== IngestionStatus.SUCCESS &&
              doc.ingestion_status !== IngestionStatus.FAILURE
          )
        )
      );
    } catch (error) {
      console.error('Error fetching pending documents:', error);
    }
  }, [
    pipeline?.deploymentUrl,
    getClient,
    pendingDocuments,
    goToPage,
    currentPage,
  ]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (pendingDocuments.length > 0) {
      intervalId = setInterval(() => {
        fetchPendingDocuments();
      }, 2500); // 2.5 seconds interval
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pendingDocuments, fetchPendingDocuments]);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const currentPageIds = documents.map((doc) => doc.id);
      setSelectedDocumentIds((prev) => [
        ...new Set([...prev, ...currentPageIds]),
      ]);
    } else {
      const currentPageIds = documents.map((doc) => doc.id);
      setSelectedDocumentIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  const handleSelectItem = (item: DocumentInfoType, selected: boolean) => {
    if (selected) {
      setSelectedDocumentIds((prev) => [...prev, item.id]);
    } else {
      setSelectedDocumentIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const columns: Column<DocumentInfoType>[] = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'id', label: 'Document ID', truncate: true, copyable: true },
    { key: 'user_id', label: 'User ID', truncate: true, copyable: true },
    {
      key: 'group_ids',
      label: 'Group IDs',
      renderCell: (doc) =>
        doc.group_ids && doc.group_ids.length > 0
          ? doc.group_ids.join(', ')
          : 'N/A',
      selected: false,
    },
    {
      key: 'ingestion_status',
      label: 'Ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failure', 'pending'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.ingestion_status === IngestionStatus.SUCCESS
              ? 'success'
              : doc.ingestion_status === IngestionStatus.FAILURE
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.ingestion_status}
        </Badge>
      ),
    },
    {
      key: 'restructuring_status',
      label: 'Restructuring',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failure', 'pending'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.restructuring_status === 'success'
              ? 'success'
              : doc.restructuring_status === 'failure'
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.restructuring_status}
        </Badge>
      ),
      selected: false,
    },
    { key: 'type', label: 'Type', selected: false },
    {
      key: 'metadata',
      label: 'Metadata',
      renderCell: (doc) => JSON.stringify(doc.metadata),
      selected: false,
    },
    { key: 'version', label: 'Version', selected: false },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      renderCell: (doc) => new Date(doc.created_at).toLocaleString(),
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      sortable: true,
      renderCell: (doc) => new Date(doc.updated_at).toLocaleString(),
      selected: false,
    },
  ];

  const renderActions = (doc: DocumentInfoType) => (
    <div className="flex space-x-1 justify-end">
      <UpdateButtonContainer
        id={doc.id}
        onUpdateSuccess={() => goToPage(currentPage)}
        showToast={toast}
      />
      <Button
        onClick={() => {
          setSelectedDocumentId(doc.id);
          setIsDocumentInfoDialogOpen(true);
        }}
        color={
          doc.ingestion_status === IngestionStatus.SUCCESS
            ? 'filled'
            : 'disabled'
        }
        shape="slim"
        disabled={doc.ingestion_status !== IngestionStatus.SUCCESS}
      >
        <FileSearch2 className="h-8 w-8" />
      </Button>
    </div>
  );

  return (
    <Layout pageTitle="Documents">
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="absolute inset-0 bg-zinc-900 mt-[4rem] sm:mt-[4rem] ">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1 h-full">
            {isLoading ? (
              <div className="flex justify-center items-center mt-[3rem]">
                <Loader className="animate-spin" size={64} />
              </div>
            ) : (
              <>
                <div className="flex justify-end items-center space-x-2 -mb-8">
                  <UploadButton
                    userId={null}
                    uploadedDocuments={documents}
                    setUploadedDocuments={() => {}}
                    onUploadSuccess={async () => {
                      await goToPage(1);
                      return [];
                    }}
                    showToast={toast}
                    setPendingDocuments={setPendingDocuments}
                    setCurrentPage={() => {}}
                    documentsPerPage={10}
                  />
                  <DeleteButton
                    selectedDocumentIds={selectedDocumentIds}
                    onDelete={() => setSelectedDocumentIds([])}
                    onSuccess={async () => {
                      await goToPage(1);
                      await refetchDocuments();
                    }}
                    showToast={toast}
                  />
                </div>

                <Table
                  data={documents}
                  currentData={documents}
                  columns={columns}
                  onSelectAll={handleSelectAll}
                  onSelectItem={handleSelectItem}
                  selectedItems={documents.filter((doc) =>
                    selectedDocumentIds.includes(doc.id)
                  )}
                  actions={renderActions}
                  initialSort={{ key: 'title', order: 'asc' }}
                  initialFilters={{}}
                  tableHeight="600px"
                  currentPage={currentPage}
                  onPageChange={goToPage}
                  totalItems={documents.length}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />

                {prefetching && (
                  <div className="flex justify-center mt-4">
                    <Loader className="animate-spin" size={24} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      {selectedDocumentId && (
        <DocumentInfoDialog
          id={selectedDocumentId}
          open={isDocumentInfoDialogOpen}
          onClose={() => {
            setIsDocumentInfoDialogOpen(false);
            setSelectedDocumentId('');
          }}
        />
      )}
    </Layout>
  );
};

export default Index;
