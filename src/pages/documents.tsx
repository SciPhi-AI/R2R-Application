import { ExternalLink } from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React, { useState, useCallback, useEffect, useMemo } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import { IngestionStatus } from '@/types';

const PAGE_SIZE = 1000;
const ITEMS_PER_PAGE = 10;

const Index: React.FC = () => {
  const { pipeline, getClient, authState } = useUserContext();
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
      let totalCount = 0;

      // Fetch first batch
      const firstBatch = await client.documents.list({
        offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        totalCount = firstBatch.totalEntries;
        setTotalEntries(totalCount);

        allDocs = firstBatch.results;
        console.log('allDocs = ', allDocs);
        setDocuments(allDocs);

        // End loading spinner after first batch
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      offset += PAGE_SIZE;

      // Continue fetching in the background (if needed)
      while (offset < totalCount) {
        const batch = await client.documents.list({
          offset,
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

  // 1) Delay initial fetch by 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllDocuments();
    }, 1000); // Wait 1s before the first fetch

    return () => clearTimeout(timer);
  }, [fetchAllDocuments]);

  /*** Monitor Documents for Pending Status ***/
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Identify documents that are not SUCCESS, ENRICHED, or FAILED
    const pending = documents.filter(
      (doc) =>
        doc.ingestionStatus !== IngestionStatus.SUCCESS &&
        doc.ingestionStatus !== IngestionStatus.ENRICHED &&
        doc.ingestionStatus !== IngestionStatus.FAILED
    );
    setPendingDocuments(pending.map((doc) => doc.id));

    // 2) Poll if we still have pending documents
    if (pending.length > 0) {
      const pollInterval = setInterval(() => {
        // If user logs out in the meantime, the next call to fetchAllDocuments would 401 again
        // so double-check isAuthenticated here as well:
        if (!authState.isAuthenticated) return;
        fetchAllDocuments();
      }, 5000);

      // const pollInterval = setInterval(() => {
      //   fetchAllDocuments();
      // }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [documents, fetchAllDocuments]);

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
  const state = {
    steps: [
      {
        target: '.my-first-step',
        content: 'This is my awesome feature!',
      },
      {
        target: '.my-other-step',
        content: 'This another awesome feature!',
      },
    ],
  };
  const { steps } = state;

  return (
    <>
      <Layout pageTitle="Documents" includeFooter={false}>
        <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
          <div className="relative flex-grow bg-zinc-900 mt-[4rem] sm:mt-[4rem] pl-10">
            <div className="mx-auto max-w-6xl mb-12 p-4 h-full">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                Documents
                <a
                  href="https://r2r-docs.sciphi.ai/api-and-sdks/collections/collections"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:text-blue-400 text-gray-400"
                  title="View Collections Documentation"
                >
                  <ExternalLink size={18}  className="text-accent-base -mt-0.5" />
                </a>
              </h1>

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
    </>
  );
};

export default Index;
