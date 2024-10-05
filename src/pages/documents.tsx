// pages/index.tsx
import React, { useState, useCallback, useEffect } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import usePagination from '@/hooks/usePagination';
import { DocumentInfoType, IngestionStatus } from '@/types';

const Index: React.FC = () => {
  const { pipeline, getClient } = useUserContext();
  const pageSize = 10;

  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const fetchDocuments = useCallback(
    async (offset: number, limit: number) => {
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
        console.log('data:', data);
        return { results: data.results, total_entries: data.total_entries };
      } catch (error) {
        console.error('Error fetching documents:', error);
        return { results: [], total_entries: 0 };
      }
    },
    [pipeline?.deploymentUrl, getClient]
  );

  const {
    data: documents,
    currentPage,
    totalPages,
    totalItems,
    loading,
    goToPage,
  } = usePagination<DocumentInfoType>({ fetchData: fetchDocuments, pageSize });

  useEffect(() => {
    const pending = documents
      .filter(
        (doc) =>
          doc.ingestion_status !== IngestionStatus.SUCCESS &&
          doc.ingestion_status !== IngestionStatus.FAILURE
      )
      .map((doc) => doc.id);
    setPendingDocuments(pending);
  }, [documents]);

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedDocumentIds(documents.map((doc) => doc.id));
      } else {
        setSelectedDocumentIds([]);
      }
    },
    [documents]
  );

  const handleSelectItem = useCallback((itemId: string, selected: boolean) => {
    setSelectedDocumentIds((prev) =>
      selected ? [...prev, itemId] : prev.filter((id) => id !== itemId)
    );
  }, []);

  const refetchDocuments = useCallback(() => {
    goToPage(1);
    setSelectedDocumentIds([]);
  }, [goToPage]);

  console.log('Pagination values:', {
    currentPage,
    totalPages,
    totalItems,
    loading,
  });

  return (
    <Layout pageTitle="Documents">
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="relative flex-grow bg-zinc-900 mt-[4rem] sm:mt-[4rem]">
          <div className="mx-auto max-w-6xl mb-12 mt-4 p-4 h-full">
            <DocumentsTable
              documents={documents}
              loading={loading}
              totalItems={totalItems}
              currentPage={currentPage}
              onPageChange={goToPage}
              itemsPerPage={pageSize}
              onRefresh={refetchDocuments}
              pendingDocuments={pendingDocuments}
              setPendingDocuments={setPendingDocuments}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              selectedItems={selectedDocumentIds}
            />
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Index;
