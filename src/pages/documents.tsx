import { DocumentResponse } from 'r2r-js';
import React, { useState, useCallback, useEffect, useMemo } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import { IngestionStatus } from '@/types';

const PAGE_SIZE = 1000;
const ITEMS_PER_PAGE = 10;

const Index: React.FC = () => {
  const { pipeline, getClient } = useUserContext();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      title: true,
      id: true,
      ownerId: true,
      collectionIds: false,
      ingestionStatus: true,
      extractionStatus: true,
      documentType: false,
      metadata: false,
      version: false,
      createdAt: true,
      updatedAt: false,
    }
  );

  // New states for filters and search query
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    ingestionStatus: ['success', 'failed', 'pending', 'enriched'],
    extractionStatus: ['success', 'failed', 'pending'],
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  /*** Fetching Documents in Batches ***/
  const fetchAllDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allDocs: DocumentResponse[] = [];
      let totalEntries = 0;

      // Fetch first batch
      const firstBatch = await client.documents.list({
        offset: offset,
        limit: 1000,
      });

      console.log('firstBatch:', firstBatch);

      if (firstBatch.results.length > 0) {
        totalEntries = firstBatch.totalEntries;
        setTotalEntries(totalEntries);

        allDocs = firstBatch.results;
        setDocuments(allDocs);

        // Set loading to false after the first batch is fetched
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      offset += PAGE_SIZE;

      // Continue fetching in the background
      while (offset < totalEntries) {
        const batch = await client.documents.list({
          offset: offset,
          limit: PAGE_SIZE,
        });

        if (batch.results.length === 0) {
          break;
        }

        allDocs = allDocs.concat(batch.results);
        setDocuments([...allDocs]);

        offset += PAGE_SIZE;
      }

      setDocuments(allDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  }, [pipeline?.deploymentUrl, getClient]);

  const refetchDocuments = useCallback(async () => {
    await fetchAllDocuments();
    setSelectedDocumentIds([]);
  }, [fetchAllDocuments]);

  useEffect(() => {
    fetchAllDocuments();
  }, [fetchAllDocuments]);

  /*** Handle Pending Documents ***/
  useEffect(() => {
    const pending = documents
      .filter(
        (doc) =>
          doc.ingestionStatus !== IngestionStatus.SUCCESS &&
          doc.ingestionStatus !== IngestionStatus.ENRICHED &&
          doc.ingestionStatus !== IngestionStatus.FAILED
      )
      .map((doc) => doc.id);
    setPendingDocuments(pending);
  }, [documents]);

  /*** Client-Side Filtering ***/
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value &&
        value.length > 0 &&
        (key === 'ingestionStatus' || key === 'extractionStatus')
      ) {
        filtered = filtered.filter((doc) => {
          const status = doc[key];
          return Array.isArray(value) && value.includes(status);
        });
      }
    });

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title?.toLowerCase().includes(query) ||
          doc.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [documents, filters, searchQuery]);

  /*** Handle Selection ***/
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedDocumentIds(filteredDocuments.map((doc) => doc.id));
      } else {
        setSelectedDocumentIds([]);
      }
    },
    [filteredDocuments]
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

  /*** Handle Filters and Search ***/
  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  /*** Handle Column Visibility ***/
  const handleToggleColumn = useCallback(
    (columnKey: string, isVisible: boolean) => {
      setVisibleColumns((prev) => ({ ...prev, [columnKey]: isVisible }));
    },
    []
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Layout pageTitle="Documents" includeFooter={false}>
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
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
              totalEntries={totalEntries}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              searchQuery={searchQuery}
              onSearchQueryChange={handleSearchQueryChange}
            />
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Index;
