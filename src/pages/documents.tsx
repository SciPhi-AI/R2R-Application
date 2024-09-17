import { format, parseISO } from 'date-fns';
import {
  ChevronUpSquare,
  ChevronDownSquare,
  FileSearch2,
  Filter,
} from 'lucide-react';
import { Loader } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import UpdateButtonContainer from '@/components/ChatDemo/UpdateButtonContainer';
import { UploadButton } from '@/components/ChatDemo/upload';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import { getFilteredAndSortedDocuments } from '@/components/ChatDemo/utils/documentSorter';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import Pagination from '@/components/ui/pagination';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { IngestionStatus } from '@/types';

interface DocumentFilterCriteria {
  sort: 'title' | 'date';
  order: 'asc' | 'desc';
}

interface DocumentInfoType {
  id: string;
  group_ids: string[];
  user_id: string;
  type: string;
  metadata: any;
  title: string;
  version: string;
  size_in_bytes: number;
  ingestion_status: IngestionStatus;
  restructuring_status: string;
  created_at: string;
  updated_at: string;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;
const DOCUMENTS_PER_PAGE = 10;
const columnWidths = {
  checkbox: '5%',
  title: '25%',
  documentId: '15%',
  userId: '15%',
  updatedAt: '20%',
  status: '10%',
  actions: '10%',
};

const Index: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [filterCriteria, setFilterCriteria] = useState<DocumentFilterCriteria>({
    sort: 'title',
    order: 'asc',
  });
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { pipeline, getClient } = useUserContext();
  const [statusFilter, setStatusFilter] = useState<
    Record<IngestionStatus, boolean>
  >({
    success: true,
    failure: true,
    pending: true,
    parsing: false,
    chunking: false,
    embedding: false,
    storing: false,
  });

  const documentsPerPage = 10;

  const userId = null;

  const fetchDocuments = useCallback(
    async (retryCount = 0) => {
      if (!pipeline?.deploymentUrl) {
        console.error('No pipeline deployment URL available');
        return [];
      }

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const data = await client.documentsOverview();
        const results: DocumentInfoType[] = data.results;
        setDocuments(results);
        setPendingDocuments(
          results
            .filter(
              (doc: DocumentInfoType) =>
                doc.ingestion_status !== 'success' &&
                doc.ingestion_status !== 'failure'
            )
            .map((doc: DocumentInfoType) => doc.id)
        );
        setIsLoading(false);
        setError(null);
        setCurrentPage(1);

        setSelectedDocumentIds([]);
        setIsAllSelected(false);

        return results;
      } catch (error) {
        console.error('Error fetching documents:', error);
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => fetchDocuments(retryCount + 1), RETRY_DELAY);
        } else {
          setIsLoading(false);
          setError('Failed to fetch documents. Please try again later.');
        }
      }
      return [];
    },
    [pipeline?.deploymentUrl, getClient]
  );

  const handleSelectAll = (checked: boolean) => {
    if (currentDocuments.length === 0) {
      setIsAllSelected(false);
      return;
    }

    setIsAllSelected(checked);

    if (checked) {
      const successDocumentIds = currentDocuments
        .filter((doc) => doc.ingestion_status === 'success')
        .map((doc) => doc.id);
      setSelectedDocumentIds((prevSelected) =>
        Array.from(new Set([...prevSelected, ...successDocumentIds]))
      );
    } else {
      const currentPageDocumentIds = currentDocuments.map((doc) => doc.id);
      setSelectedDocumentIds((prevSelected) =>
        prevSelected.filter((id) => !currentPageDocumentIds.includes(id))
      );
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = getFilteredAndSortedDocuments(documents, filterCriteria);
    filtered = filtered.filter((doc) => {
      if (
        doc.ingestion_status === 'success' ||
        doc.ingestion_status === 'failure'
      ) {
        return statusFilter[doc.ingestion_status];
      } else {
        // Treat all other statuses as 'pending'
        return statusFilter.pending;
      }
    });
    return filtered;
  }, [documents, filterCriteria, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedDocuments.length / DOCUMENTS_PER_PAGE)
  );

  const currentDocuments = filteredAndSortedDocuments.slice(
    (currentPage - 1) * DOCUMENTS_PER_PAGE,
    currentPage * DOCUMENTS_PER_PAGE
  );

  const blankRowsNeeded = Math.max(
    0,
    DOCUMENTS_PER_PAGE - currentDocuments.length
  );
  const blankRows = Array(blankRowsNeeded).fill(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const newTotalPages = Math.max(
      1,
      Math.ceil(filteredAndSortedDocuments.length / DOCUMENTS_PER_PAGE)
    );
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedDocuments.length, DOCUMENTS_PER_PAGE, currentPage]);

  useEffect(() => {
    if (
      currentPage >
      Math.ceil(filteredAndSortedDocuments.length / documentsPerPage)
    ) {
      setCurrentPage(
        Math.max(
          1,
          Math.ceil(filteredAndSortedDocuments.length / documentsPerPage)
        )
      );
    }
  }, [filteredAndSortedDocuments.length, currentPage, documentsPerPage]);

  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: 'Copied!', description }))
      .catch((err) => console.error('Could not copy text: ', err));
  };

  const copyUserToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: 'Copied!',
          description: 'User ID copied to clipboard',
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  useEffect(() => {
    setSelectedDocumentIds([]);
    setIsAllSelected(false);
  }, [documents]);

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

      setDocuments((prevDocuments: DocumentInfoType[]) => {
        const newDocuments = [...prevDocuments];
        updatedDocuments.forEach((updatedDoc: DocumentInfoType) => {
          const index = newDocuments.findIndex(
            (doc) => doc.id === updatedDoc.id
          );
          if (index !== -1) {
            newDocuments[index] = updatedDoc;
          }
        });
        return newDocuments;
      });

      // Update pending documents list
      setPendingDocuments((prevPending) =>
        prevPending.filter((id) =>
          updatedDocuments.some(
            (doc: DocumentInfoType) =>
              doc.id === id &&
              doc.ingestion_status !== 'success' &&
              doc.ingestion_status !== 'failure'
          )
        )
      );
    } catch (error) {
      console.error('Error fetching pending documents:', error);
    }
  }, [pipeline?.deploymentUrl, getClient, pendingDocuments]);

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

  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') {
      return 'N/A';
    }

    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) {
        // Date is invalid
        return 'Invalid Date';
      }
      return format(date, 'MMM d, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

  const renderSortButton = (label: string, sortKey: 'title' | 'date') => (
    <div className="flex items-center">
      <span className="mr-2">{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() =>
                setFilterCriteria({
                  sort: sortKey,
                  order: filterCriteria.order === 'asc' ? 'desc' : 'asc',
                })
              }
              className="p-1"
            >
              {filterCriteria.sort === sortKey &&
              filterCriteria.order === 'asc' ? (
                <ChevronUpSquare className="h-4 w-4 hover:bg-zinc-500 cursor-pointer" />
              ) : (
                <ChevronDownSquare className="h-4 w-4 hover:bg-zinc-500 cursor-pointer" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Sort by {label}{' '}
              {filterCriteria.order === 'asc' ? 'Descending' : 'Ascending'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <Layout pageTitle="Documents">
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="absolute inset-0 bg-zinc-900 mt-[3rem] sm:mt-[3rem] ">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1 h-full">
            {isLoading ? (
              <div className="flex justify-center items-center mt-[3rem]">
                <Loader className="animate-spin" size={64} />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4"></div>
                  <div className="flex justify-center">
                    <div className="mt-6 pr-2">
                      <UploadButton
                        userId={userId}
                        uploadedDocuments={documents}
                        setUploadedDocuments={setDocuments}
                        onUploadSuccess={async () => {
                          const updatedDocuments = await fetchDocuments();
                          setSelectedDocumentIds([]);
                          setIsAllSelected(false);
                          return updatedDocuments;
                        }}
                        showToast={toast}
                        setPendingDocuments={setPendingDocuments}
                        setCurrentPage={setCurrentPage}
                        documentsPerPage={DOCUMENTS_PER_PAGE}
                      />
                    </div>
                    <div className="mt-6">
                      <DeleteButton
                        selectedDocumentIds={selectedDocumentIds}
                        onDelete={() => {
                          setSelectedDocumentIds([]);
                          setIsAllSelected(false);
                        }}
                        onSuccess={() => {
                          fetchDocuments();
                          setSelectedDocumentIds([]);
                          setIsAllSelected(false);
                        }}
                        showToast={toast}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <div
                    className="table-container w-full max-w-full sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl"
                    style={{
                      height: '600px',
                      overflowY: 'auto',
                    }}
                  >
                    <table className="w-full bg-zinc-800 border border-gray-600">
                      <thead className="sticky top-0 bg-zinc-800">
                        <tr className="border-b border-gray-600">
                          <th
                            className="px-4 py-2 text-left text-white"
                            style={{ width: columnWidths.checkbox }}
                          >
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              disabled={currentDocuments.length === 0}
                            />
                          </th>
                          <th
                            className="px-4 py-2 text-left text-white"
                            style={{ width: columnWidths.title }}
                          >
                            {renderSortButton('Title', 'title')}
                          </th>
                          <th
                            className="px-4 py-2 text-left text-white"
                            style={{ width: columnWidths.documentId }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>Document ID</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Click on a Document ID to copy it to
                                    clipboard
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </th>
                          <th
                            className="px-4 py-2 text-left text-white"
                            style={{ width: columnWidths.userId }}
                          >
                            User ID
                          </th>
                          <th
                            className="px-4 py-2 text-left text-white"
                            style={{ width: columnWidths.updatedAt }}
                          >
                            {renderSortButton('Updated At', 'date')}
                          </th>
                          <th
                            className="px-4 py-2 text-left text-white"
                            style={{ width: columnWidths.status }}
                          >
                            <div className="flex items-center">
                              <span className="mr-2">Status</span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Filter className="h-4 w-4 hover:bg-zinc-500 cursor-pointer" />
                                </PopoverTrigger>
                                <PopoverContent className="w-80 z-5000000">
                                  <div className="grid gap-4">
                                    <div className="space-y-2">
                                      <h4 className="font-medium leading-none">
                                        Filter by Status
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        Select which statuses to display in the
                                        table.
                                      </p>
                                    </div>
                                    <div className="grid gap-2">
                                      {(
                                        [
                                          'success',
                                          'failure',
                                          'pending',
                                        ] as const
                                      ).map((status) => (
                                        <div
                                          key={status}
                                          className="flex items-center space-x-2"
                                        >
                                          <Checkbox
                                            id={`filter-${status}`}
                                            checked={statusFilter[status]}
                                            onCheckedChange={() =>
                                              setStatusFilter((prev) => ({
                                                ...prev,
                                                [status]: !prev[status],
                                              }))
                                            }
                                          />
                                          <label
                                            htmlFor={`filter-${status}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                            {status.charAt(0).toUpperCase() +
                                              status.slice(1)}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </th>
                          <th
                            className="px-4 py-2 text-left text-white"
                            style={{ width: columnWidths.actions }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td
                              className="px-4 py-2  text-white"
                              style={{ width: columnWidths.checkbox }}
                            >
                              <Checkbox
                                checked={selectedDocumentIds.includes(doc.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedDocumentIds((prevSelected) =>
                                    checked
                                      ? [...prevSelected, doc.id]
                                      : prevSelected.filter(
                                          (id) => id !== doc.id
                                        )
                                  );
                                }}
                                disabled={doc.ingestion_status !== 'success'}
                              />
                            </td>
                            <td
                              className="px-4 py-2  text-white"
                              style={{ width: columnWidths.title }}
                            >
                              <div className="overflow-x-auto whitespace-nowrap">
                                {doc.title || 'N/A'}
                              </div>
                            </td>
                            <td
                              className="px-4 py-2  text-white"
                              style={{ width: columnWidths.documentId }}
                            >
                              <div
                                className="overflow-x-auto whitespace-nowrap cursor-pointer"
                                onClick={() =>
                                  copyToClipboard(
                                    doc.id,
                                    'Document ID copied to clipboard'
                                  )
                                }
                              >
                                {doc.id
                                  ? `${doc.id.substring(0, 8)}...${doc.id.slice(-4)}`
                                  : 'N/A'}
                              </div>
                            </td>
                            <td
                              className="px-4 py-2  text-white"
                              style={{ width: columnWidths.userId }}
                            >
                              <div
                                className="overflow-x-auto whitespace-nowrap cursor-pointer"
                                onClick={() =>
                                  copyToClipboard(
                                    doc.user_id,
                                    'User ID copied to clipboard'
                                  )
                                }
                              >
                                {doc.user_id
                                  ? `${doc.user_id.substring(0, 8)}...${doc.user_id.slice(-4)}`
                                  : 'N/A'}
                              </div>
                            </td>
                            <td
                              className="px-4 py-2  text-white"
                              style={{ width: columnWidths.updatedAt }}
                            >
                              <div className="overflow-x-auto whitespace-nowrap">
                                {formatDate(doc.updated_at)}
                              </div>
                            </td>
                            <td
                              className="px-4 py-2 text-white"
                              style={{ width: columnWidths.status }}
                            >
                              <div className="overflow-x-auto whitespace-nowrap">
                                <Badge
                                  variant={(() => {
                                    switch (doc.ingestion_status) {
                                      case 'success':
                                        return 'success';
                                      case 'failure':
                                        return 'destructive';
                                      default:
                                        return 'pending';
                                    }
                                  })()}
                                >
                                  {doc.ingestion_status === 'success' ||
                                  doc.ingestion_status === 'failure'
                                    ? doc.ingestion_status
                                    : 'pending'}
                                </Badge>
                              </div>
                            </td>
                            <td
                              className="px-4 py-2  text-white"
                              style={{ width: columnWidths.actions }}
                            >
                              <div className="flex space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <UpdateButtonContainer
                                        documentId={doc.id}
                                        onUpdateSuccess={fetchDocuments}
                                        showToast={toast}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Update Document</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Button
                                        onClick={() => {
                                          setSelectedDocumentId(doc.id);
                                          setIsDocumentInfoDialogOpen(true);
                                        }}
                                        color={
                                          doc.ingestion_status === 'success'
                                            ? 'filled'
                                            : 'disabled'
                                        }
                                        shape="slim"
                                        disabled={
                                          doc.ingestion_status !== 'success'
                                        }
                                        className={
                                          doc.ingestion_status !== 'success'
                                            ? 'cursor-not-allowed'
                                            : ''
                                        }
                                      >
                                        <FileSearch2 className="h-8 w-8" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Document Chunks</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {blankRows.map((_, index) => (
                          <tr key={`blank-${index}`}>
                            {Array(6)
                              .fill(null)
                              .map((_, cellIndex) => (
                                <td
                                  key={`blank-${index}-${cellIndex}`}
                                  className="px-4 py-[16px] text-white"
                                >
                                  &nbsp;
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {!isLoading &&
                  !error &&
                  filteredAndSortedDocuments.length > 0 && (
                    <div className="flex justify-center mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </main>
      <DocumentInfoDialog
        documentId={selectedDocumentId}
        open={isDocumentInfoDialogOpen}
        onClose={() => setIsDocumentInfoDialogOpen(false)}
      />
    </Layout>
  );
};

export default Index;