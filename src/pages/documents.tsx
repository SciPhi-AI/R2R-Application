import React, { useState, useCallback, useEffect } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import { DocumentInfoType, IngestionStatus } from '@/types';

const Index: React.FC = () => {
  const { pipeline, getClient } = useUserContext();

  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
        const data = await client.documentsOverview(undefined, offset, limit);
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

  return (
    <Layout pageTitle="Documents">
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="relative flex-grow bg-zinc-900 mt-[4rem] sm:mt-[4rem]">
          <div className="mx-auto max-w-6xl mb-12 mt-4 p-4 h-full">
            <DocumentsTable
              documents={documents}
              loading={loading}
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
