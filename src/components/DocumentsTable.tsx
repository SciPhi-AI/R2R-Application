'use client';
import { ChevronUpSquare, ChevronDownSquare } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import Pagination from '@/components/ui/pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserContext } from '@/context/UserContext';
import { DocumentFilterCriteria, DocumentInfoType } from '@/types';

interface DocumentsTableProps {
  maxEntriesPerPage?: number;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  maxEntriesPerPage = 10,
}) => {
  const { pipeline, getClient } = useUserContext();

  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [filterCriteria, setFilterCriteria] = useState<DocumentFilterCriteria>({
    sort: 'title',
    order: 'asc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const fetchDocuments = useCallback(
    async (retryCount = 0) => {
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
        setDocuments(data.results);
        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error fetching documents:', error);
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => fetchDocuments(retryCount + 1), RETRY_DELAY);
        } else {
          setIsLoading(false);
          setError('Failed to fetch documents. Please try again later.');
        }
      }
    },
    [pipeline?.deploymentUrl, getClient]
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const sortedDocuments = [...documents].sort((a, b) => {
    if (filterCriteria.sort === 'title') {
      return filterCriteria.order === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedDocuments.length / maxEntriesPerPage);
  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * maxEntriesPerPage,
    currentPage * maxEntriesPerPage
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (isLoading) {
    return <div className="text-center">Loading documents...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  const renderTableRows = () => {
    const rows = [];

    // Render actual document rows
    for (let i = 0; i < paginatedDocuments.length; i++) {
      const doc = paginatedDocuments[i];
      rows.push(
        <tr key={doc.id} className="border-b border-gray-600">
          <td className="px-4 py-2 text-white">
            <div
              className="overflow-x-auto whitespace-nowrap"
              style={{ width: '150px' }}
            >
              {doc.title || 'N/A'}
            </div>
          </td>
          <td className="px-4 py-2 text-white">
            <div
              className="overflow-x-auto whitespace-nowrap"
              style={{ width: '100px' }}
            >
              {doc.id
                ? `${doc.id.substring(0, 4)}...${doc.id.slice(-4)}`
                : 'N/A'}
            </div>
          </td>
          <td className="px-4 py-2 text-white">
            <div
              className="overflow-x-auto whitespace-nowrap"
              style={{ width: '100px' }}
            >
              {doc.restructuring_status || 'N/A'}
            </div>
          </td>
        </tr>
      );
    }

    // Add empty rows to maintain table height
    const emptyRowsCount = maxEntriesPerPage - paginatedDocuments.length;
    for (let i = 0; i < emptyRowsCount; i++) {
      rows.push(
        <tr key={`empty-${i}`} className="border-b border-gray-600">
          <td className="px-4 py-2">&nbsp;</td>
          <td className="px-4 py-2">&nbsp;</td>
          <td className="px-4 py-2">&nbsp;</td>
        </tr>
      );
    }

    return rows;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-zinc-800 border border-gray-600">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="px-4 py-2 text-left text-white">
              <div className="flex items-center">
                <span className="mr-2">Title</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <button
                        onClick={() =>
                          setFilterCriteria({
                            sort: 'title',
                            order:
                              filterCriteria.order === 'asc' ? 'desc' : 'asc',
                          })
                        }
                        className="p-1"
                      >
                        {filterCriteria.sort === 'title' &&
                        filterCriteria.order === 'asc' ? (
                          <ChevronUpSquare className="h-4 w-4" />
                        ) : (
                          <ChevronDownSquare className="h-4 w-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Sort by Title{' '}
                        {filterCriteria.order === 'asc'
                          ? 'Descending'
                          : 'Ascending'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </th>
            <th className="px-4 py-2 text-left text-white">Document ID</th>
            <th className="px-4 py-2 text-left text-white">Ingestion</th>
          </tr>
        </thead>
        <tbody>{renderTableRows()}</tbody>
      </table>
      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default DocumentsTable;
