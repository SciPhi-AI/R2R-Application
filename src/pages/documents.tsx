import React, { useState, useEffect, useCallback } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import { IngestionStatus, DocumentInfoType } from '@/types';

const Index: React.FC = () => {
  const { pipeline, getClient } = useUserContext();
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [pollingInProgress, setPollingInProgress] = useState<boolean>(false);

  const fetchDocuments = useCallback(
    async (isInitialFetch: boolean = false): Promise<DocumentInfoType[]> => {
      if (!pipeline?.deploymentUrl) {
        console.error('No pipeline deployment URL available');
        return [];
      }

      try {
        if (isInitialFetch) {
          setInitialLoading(true);
        } else {
          setPollingInProgress(true);
        }
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const data = await client.documentsOverview(undefined, 0, 1000);
        const results: DocumentInfoType[] = data.results;
        setDocuments(results);
        setTotalItems(results.length);

        const pending = results
          .filter(
            (doc: DocumentInfoType) =>
              doc.ingestion_status !== IngestionStatus.SUCCESS &&
              doc.ingestion_status !== IngestionStatus.FAILURE
          )
          .map((doc: DocumentInfoType) => doc.id);
        setPendingDocuments(pending);

        return results;
      } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
      } finally {
        if (isInitialFetch) {
          setInitialLoading(false);
        } else {
          setPollingInProgress(false);
        }
      }
    },
    [pipeline?.deploymentUrl, getClient]
  );

  const getCurrentPageDocuments = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return documents.slice(startIndex, endIndex);
  }, [documents, currentPage, itemsPerPage]);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = getCurrentPageDocuments().map((doc) => doc.id);
      setSelectedDocumentIds(allIds);
    } else {
      setSelectedDocumentIds([]);
    }
  };

  const handleSelectItem = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedDocumentIds((prev) => [...prev, itemId]);
    } else {
      setSelectedDocumentIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const refetchDocuments = useCallback(async () => {
    await fetchDocuments();
    setSelectedDocumentIds([]); // Clear selections after refresh
    setCurrentPage(1); // Reset to first page after refresh
  }, [fetchDocuments]);

  // Polling for pending documents
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchPendingDocuments = async () => {
      if (!pipeline?.deploymentUrl || pollingInProgress) {
        return;
      }

      try {
        setPollingInProgress(true);
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const data = await client.documentsOverview(pendingDocuments);
        const updatedDocuments = data.results;

        setDocuments((prevDocs) => {
          const newDocs = [...prevDocs];
          updatedDocuments.forEach((updatedDoc: DocumentInfoType) => {
            const index = newDocs.findIndex((doc) => doc.id === updatedDoc.id);
            if (index !== -1) {
              newDocs[index] = { ...newDocs[index], ...updatedDoc };
            }
          });
          return newDocs;
        });

        const stillPending = updatedDocuments
          .filter(
            (doc: DocumentInfoType) =>
              doc.ingestion_status !== IngestionStatus.SUCCESS &&
              doc.ingestion_status !== IngestionStatus.FAILURE
          )
          .map((doc: DocumentInfoType) => doc.id);
        setPendingDocuments(stillPending);
      } catch (error) {
        console.error('Error fetching pending documents:', error);
      } finally {
        setPollingInProgress(false);
      }
    };

    if (pendingDocuments.length > 0) {
      intervalId = setInterval(fetchPendingDocuments, 2500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pendingDocuments, pipeline?.deploymentUrl, getClient, pollingInProgress]);

  useEffect(() => {
    // Initial fetch
    fetchDocuments(true);
  }, [fetchDocuments]);

  return (
    <Layout pageTitle="Documents">
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="relative flex-grow bg-zinc-900 mt-[4rem] sm:mt-[4rem]">
          <div className="mx-auto max-w-6xl mb-12 mt-4 p-4 h-full">
            <DocumentsTable
              documents={getCurrentPageDocuments()}
              loading={initialLoading}
              totalItems={totalItems}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
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
