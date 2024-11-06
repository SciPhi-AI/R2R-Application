import React, { useState, useCallback, useEffect, useMemo } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import { DocumentInfoType, IngestionStatus } from '@/types';

const PAGE_SIZE = 100;
const ITEMS_PER_PAGE = 10;

const Index: React.FC = () => {
  const { pipeline, getClient } = useUserContext();
  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
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
    }
  );

  // New states for filters and search query
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    ingestion_status: ['success', 'failed', 'pending', 'enriched'],
    kg_extraction_status: ['success', 'failed', 'pending'],
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  /*** Fetching Documents in Batches ***/
  const fetchAllDocuments = useCallback(async () => {
    if (!pipeline?.deploymentUrl) {
      console.error('No pipeline deployment URL available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allDocs: DocumentInfoType[] = [];
      let totalEntries = 0;

      // Fetch batches until all documents are fetched
      while (true) {
        const batch = await client.documentsOverview(
          undefined,
          offset,
          PAGE_SIZE
        );

        if (batch.results.length === 0) {
          break;
        }

        if (offset === 0) {
          totalEntries = batch.total_entries;
          setTotalEntries(totalEntries);
        }

        allDocs = allDocs.concat(batch.results);
        offset += PAGE_SIZE;
      }

      // Sort documents by a consistent key (e.g., 'id') to maintain order
      allDocs.sort((a, b) => a.id.localeCompare(b.id));

      setDocuments(allDocs);
      setLoading(false);
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
          doc.ingestion_status !== IngestionStatus.SUCCESS &&
          doc.ingestion_status !== IngestionStatus.ENRICHED &&
          doc.ingestion_status !== IngestionStatus.FAILED
      )
      .map((doc) => doc.id);
    setPendingDocuments(pending);
  }, [documents]);

  /*** Client-Side Filtering ***/
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        if (key === 'ingestion_status' || key === 'kg_extraction_status') {
          filtered = filtered.filter((doc) => {
            const status = doc[key];
            return Array.isArray(value) && value.includes(status);
          });
        }
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
              documents={filteredDocuments}
              loading={loading}
              onRefresh={refetchDocuments}
              pendingDocuments={pendingDocuments}
              setPendingDocuments={setPendingDocuments}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              selectedItems={selectedDocumentIds}
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
              totalEntries={filteredDocuments.length}
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
