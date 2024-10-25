import React, { useState, useCallback, useEffect, useMemo } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import { DocumentInfoType, IngestionStatus } from '@/types';

const Index: React.FC = () => {
  const { pipeline, getClient } = useUserContext();

  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setVisibleColumns({
      title: true,
      id: true,
      user_id: true,
      collection_ids: false,
      ingestion_status: true,
      kg_extraction_status: false,
      type: false,
      metadata: false,
      version: false,
      created_at: true,
      updated_at: false,
    });
  }, []);

  const fetchAllDocuments = useCallback(async () => {
    if (!pipeline?.deploymentUrl) {
      console.error('No pipeline deployment URL available');
      return [];
    }

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let allDocuments: DocumentInfoType[] = [];
      let offset = 0;
      const limit = 100;
      let totalEntries = 0;

      do {
        const data = await client.documentsOverview();
        allDocuments = allDocuments.concat(data.results);
        totalEntries = data.total_entries;
        offset += limit;
      } while (allDocuments.length < totalEntries);

      return allDocuments;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }, [pipeline?.deploymentUrl, getClient]);

  const refetchDocuments = useCallback(async () => {
    setLoading(true);
    const allDocs = await fetchAllDocuments();
    setDocuments(allDocs);
    setSelectedDocumentIds([]);
    setLoading(false);
  }, [fetchAllDocuments]);

  useEffect(() => {
    refetchDocuments();
  }, [refetchDocuments]);

  useEffect(() => {
    const pending = documents
      .filter(
        (doc) =>
          doc.ingestion_status !== IngestionStatus.SUCCESS &&
          doc.ingestion_status !== IngestionStatus.FAILED
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
    setSelectedDocumentIds((prev) => {
      if (selected) {
        return [...prev, itemId];
      } else {
        return prev.filter((id) => id !== itemId);
      }
    });
  }, []);

  const handleToggleColumn = useCallback(
    (columnKey: string, isVisible: boolean) => {
      setVisibleColumns((prev) => ({ ...prev, [columnKey]: isVisible }));
    },
    []
  );

  const memoizedDocumentsTable = useMemo(
    () => (
      <DocumentsTable
        documents={documents}
        loading={loading}
        onRefresh={refetchDocuments}
        pendingDocuments={pendingDocuments}
        setPendingDocuments={setPendingDocuments}
        onSelectAll={handleSelectAll}
        onSelectItem={handleSelectItem}
        selectedItems={selectedDocumentIds}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
      />
    ),
    [
      documents,
      loading,
      refetchDocuments,
      pendingDocuments,
      handleSelectAll,
      handleSelectItem,
      selectedDocumentIds,
      visibleColumns,
      handleToggleColumn,
    ]
  );

  return (
    <Layout pageTitle="Documents">
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="relative flex-grow bg-zinc-900 mt-[4rem] sm:mt-[4rem]">
          <div className="mx-auto max-w-6xl mb-12 mt-4 p-4 h-full">
            {memoizedDocumentsTable}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Index;
