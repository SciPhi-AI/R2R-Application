import { format, parseISO } from 'date-fns';
import {
  ChevronUpSquare,
  ChevronDownSquare,
  FileSearch2,
  Filter,
  SlidersHorizontal,
  Loader,
} from 'lucide-react';
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
import { IngestionStatus, DocumentInfoType } from '@/types';

interface DocumentFilterCriteria {
  sort: 'title' | 'date';
  order: 'asc' | 'desc';
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;
const DOCUMENTS_PER_PAGE = 10;

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

  // Updated statusFilter state to include only success, failure, and pending
  const [statusFilter, setStatusFilter] = useState<{
    success: boolean;
    failure: boolean;
    pending: boolean;
  }>({
    success: true,
    failure: true,
    pending: true,
  });

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
                doc.ingestion_status !== IngestionStatus.SUCCESS &&
                doc.ingestion_status !== IngestionStatus.FAILURE
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
        .filter((doc) => doc.ingestion_status === IngestionStatus.SUCCESS)
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
      if (doc.ingestion_status === IngestionStatus.SUCCESS) {
        return statusFilter.success;
      } else if (doc.ingestion_status === IngestionStatus.FAILURE) {
        return statusFilter.failure;
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
  }, [filteredAndSortedDocuments.length, currentPage]);

  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: 'Copied!', description }))
      .catch((err) => console.error('Could not copy text: ', err));
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
    <div className="flex items-center justify-center">
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

  type ColumnKey =
    | 'checkbox'
    | 'id'
    | 'title'
    | 'groupIds'
    | 'userId'
    | 'type'
    | 'metadata'
    | 'version'
    | 'ingestionStatus'
    | 'restructuringStatus'
    | 'createdAt'
    | 'updatedAt'
    | 'actions';

  const columns: {
    key: ColumnKey;
    label: string;
  }[] = [
    { key: 'checkbox', label: '' },
    { key: 'title', label: 'Title' },
    { key: 'id', label: 'Document ID' },
    { key: 'groupIds', label: 'Group IDs' },
    { key: 'userId', label: 'User ID' },
    { key: 'type', label: 'Type' },
    { key: 'metadata', label: 'Metadata' },
    { key: 'version', label: 'Version' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'ingestionStatus', label: 'Ingestion Status' },
    { key: 'restructuringStatus', label: 'Restructuring' },
    { key: 'actions', label: 'Actions' },
  ];

  const initialVisibleColumns: Record<string, boolean> = {
    groupIds: false,
    userId: true,
    type: false,
    metadata: false,
    title: true,
    version: false,
    ingestionStatus: true,
    restructuringStatus: true,
    createdAt: false,
    updatedAt: true,
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    initialVisibleColumns
  );

  const renderColumnContent = (key: string, doc: DocumentInfoType) => {
    switch (key) {
      case 'groupIds':
        return doc.group_ids.join(', ') || 'N/A';
      case 'userId':
        return (
          <div
            className="cursor-pointer"
            onClick={() =>
              copyToClipboard(doc.user_id, 'User ID copied to clipboard')
            }
          >
            {doc.user_id
              ? `${doc.user_id.substring(0, 8)}...${doc.user_id.slice(-4)}`
              : 'N/A'}
          </div>
        );
      case 'type':
        return doc.type || 'N/A';
      case 'metadata':
        return JSON.stringify(doc.metadata) || 'N/A';
      case 'title':
        return doc.title || 'N/A';
      case 'version':
        return doc.version || 'N/A';
      case 'ingestionStatus':
        return (
          <Badge
            variant={(() => {
              switch (doc.ingestion_status) {
                case IngestionStatus.SUCCESS:
                  return 'success';
                case IngestionStatus.FAILURE:
                  return 'destructive';
                default:
                  return 'pending';
              }
            })()}
          >
            {doc.ingestion_status === IngestionStatus.SUCCESS ||
            doc.ingestion_status === IngestionStatus.FAILURE
              ? doc.ingestion_status
              : 'pending'}
          </Badge>
        );
      case 'restructuringStatus':
        return (
          <Badge
            variant={(() => {
              switch (doc.restructuring_status) {
                case 'success':
                  return 'success';
                case 'failure':
                  return 'destructive';
                default:
                  return 'pending';
              }
            })()}
          >
            {doc.restructuring_status === 'success' ||
            doc.restructuring_status === 'failure'
              ? doc.restructuring_status
              : 'pending'}
          </Badge>
        );
      case 'createdAt':
        return formatDate(doc.created_at);
      case 'updatedAt':
        return formatDate(doc.updated_at);
      default:
        return 'N/A';
    }
  };

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
                  <div className="flex items-center space-x-4 mt-8">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button color="light">
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">
                              Toggle Columns
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Select which columns to display in the table.
                            </p>
                          </div>
                          <div className="grid gap-2">
                            {columns
                              .filter(
                                (col) =>
                                  !['checkbox', 'actions', 'id'].includes(
                                    col.key
                                  )
                              )
                              .map((col) => (
                                <div
                                  key={col.key}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`column-toggle-${col.key}`}
                                    checked={visibleColumns[col.key]}
                                    onCheckedChange={(checked) =>
                                      setVisibleColumns((prev) => ({
                                        ...prev,
                                        [col.key]: checked === true,
                                      }))
                                    }
                                  />
                                  <label
                                    htmlFor={`column-toggle-${col.key}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {col.label}
                                  </label>
                                </div>
                              ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
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
                    className="table-container w-full overflow-x-auto"
                    style={{
                      maxHeight: '600px',
                    }}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full bg-zinc-800 border border-gray-600 table-fixed">
                        <colgroup>
                          {columns
                            .filter(
                              (col) =>
                                col.key === 'checkbox' ||
                                col.key === 'id' ||
                                col.key === 'actions' ||
                                visibleColumns[col.key]
                            )
                            .map((col) => (
                              <col key={col.key} className={`col-${col.key}`} />
                            ))}
                        </colgroup>
                        <thead className="sticky top-0 bg-zinc-800 z-10">
                          <tr className="border-b border-gray-600">
                            {columns.map((col) => {
                              const isVisible =
                                col.key === 'checkbox' ||
                                col.key === 'id' ||
                                col.key === 'actions' ||
                                visibleColumns[col.key];

                              if (!isVisible) return null;

                              let alignmentClass = 'text-center';
                              if (col.key === 'actions') {
                                alignmentClass = 'text-right';
                              } else if (col.key === 'checkbox') {
                                alignmentClass = 'text-center';
                              } else if (col.key === 'id') {
                                alignmentClass = 'text-left';
                              }

                              let cellContent;

                              if (col.key === 'checkbox') {
                                cellContent = (
                                  <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={handleSelectAll}
                                    disabled={currentDocuments.length === 0}
                                  />
                                );
                              } else if (
                                col.key === 'title' &&
                                visibleColumns[col.key]
                              ) {
                                cellContent = renderSortButton(
                                  'Title',
                                  'title'
                                );
                              } else if (
                                col.key === 'ingestionStatus' &&
                                visibleColumns[col.key]
                              ) {
                                cellContent = (
                                  <div className="flex items-center justify-center">
                                    <span className="mr-2">Status</span>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Filter className="h-4 w-4 hover:bg-zinc-500 cursor-pointer" />
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80 z-50">
                                        <div className="grid gap-4">
                                          <div className="space-y-2">
                                            <h4 className="font-medium leading-none">
                                              Filter by Status
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                              Select which statuses to display
                                              in the table.
                                            </p>
                                          </div>
                                          <div className="grid gap-2">
                                            {/* Success Checkbox */}
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`filter-success`}
                                                checked={statusFilter.success}
                                                onCheckedChange={(checked) =>
                                                  setStatusFilter((prev) => ({
                                                    ...prev,
                                                    success: checked === true,
                                                  }))
                                                }
                                              />
                                              <label
                                                htmlFor={`filter-success`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                              >
                                                Success
                                              </label>
                                            </div>
                                            {/* Failure Checkbox */}
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`filter-failure`}
                                                checked={statusFilter.failure}
                                                onCheckedChange={(checked) =>
                                                  setStatusFilter((prev) => ({
                                                    ...prev,
                                                    failure: checked === true,
                                                  }))
                                                }
                                              />
                                              <label
                                                htmlFor={`filter-failure`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                              >
                                                Failure
                                              </label>
                                            </div>
                                            {/* Pending Checkbox */}
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`filter-pending`}
                                                checked={statusFilter.pending}
                                                onCheckedChange={(checked) =>
                                                  setStatusFilter((prev) => ({
                                                    ...prev,
                                                    pending: checked === true,
                                                  }))
                                                }
                                              />
                                              <label
                                                htmlFor={`filter-pending`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                              >
                                                Pending
                                              </label>
                                            </div>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                );
                              } else if (['actions', 'id'].includes(col.key)) {
                                cellContent = col.label;
                              } else if (visibleColumns[col.key]) {
                                cellContent = col.label;
                              } else {
                                return null;
                              }

                              return (
                                <th
                                  key={col.key}
                                  className={`px-4 py-2 text-white ${alignmentClass} ${
                                    ['createdAt', 'updatedAt'].includes(col.key)
                                      ? 'whitespace-nowrap'
                                      : ''
                                  }`}
                                >
                                  <div className="overflow-x-auto">
                                    {cellContent}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {currentDocuments.map((doc) => (
                            <tr key={doc.id}>
                              {columns.map((col) => {
                                const isVisible =
                                  col.key === 'checkbox' ||
                                  col.key === 'id' ||
                                  col.key === 'actions' ||
                                  visibleColumns[col.key];

                                if (!isVisible) return null;

                                let alignmentClass = 'text-center';
                                if (col.key === 'actions') {
                                  alignmentClass = 'text-right';
                                } else if (col.key === 'checkbox') {
                                  alignmentClass = 'text-center';
                                } else if (col.key === 'id') {
                                  alignmentClass = 'text-left';
                                }

                                let cellContent;

                                if (col.key === 'checkbox') {
                                  cellContent = (
                                    <Checkbox
                                      checked={selectedDocumentIds.includes(
                                        doc.id
                                      )}
                                      onCheckedChange={(checked) => {
                                        setSelectedDocumentIds(
                                          (prevSelected) =>
                                            checked === true
                                              ? [...prevSelected, doc.id]
                                              : prevSelected.filter(
                                                  (id) => id !== doc.id
                                                )
                                        );
                                      }}
                                      disabled={
                                        doc.ingestion_status !==
                                        IngestionStatus.SUCCESS
                                      }
                                    />
                                  );
                                } else if (col.key === 'id') {
                                  cellContent = (
                                    <div
                                      className="cursor-pointer"
                                      onClick={() =>
                                        copyToClipboard(
                                          doc.id,
                                          'Document ID copied to clipboard'
                                        )
                                      }
                                    >
                                      {doc.id
                                        ? `${doc.id.substring(0, 8)}...${doc.id.slice(
                                            -4
                                          )}`
                                        : 'N/A'}
                                    </div>
                                  );
                                } else if (col.key === 'actions') {
                                  cellContent = (
                                    <div className="flex space-x-1 justify-end">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <UpdateButtonContainer
                                              id={doc.id}
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
                                                setIsDocumentInfoDialogOpen(
                                                  true
                                                );
                                              }}
                                              color={
                                                doc.ingestion_status ===
                                                IngestionStatus.SUCCESS
                                                  ? 'filled'
                                                  : 'disabled'
                                              }
                                              shape="slim"
                                              disabled={
                                                doc.ingestion_status !==
                                                IngestionStatus.SUCCESS
                                              }
                                              className={`${
                                                doc.ingestion_status !==
                                                IngestionStatus.SUCCESS
                                                  ? 'cursor-not-allowed'
                                                  : ''
                                              }`}
                                            >
                                              <FileSearch2 className="w-8 h-8" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>View Document Chunks</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  );
                                } else if (visibleColumns[col.key]) {
                                  cellContent = renderColumnContent(
                                    col.key,
                                    doc
                                  );
                                } else {
                                  return null;
                                }

                                return (
                                  <td
                                    key={col.key}
                                    className={`px-4 py-2 text-white ${alignmentClass} ${
                                      ['createdAt', 'updatedAt'].includes(
                                        col.key
                                      )
                                        ? 'whitespace-nowrap'
                                        : ''
                                    }`}
                                  >
                                    <div className="overflow-x-auto">
                                      {cellContent}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          {blankRows.map((_, index) => (
                            <tr key={`blank-${index}`}>
                              {columns.map((col) => {
                                const isVisible =
                                  col.key === 'checkbox' ||
                                  col.key === 'id' ||
                                  col.key === 'actions' ||
                                  visibleColumns[col.key];

                                if (!isVisible) return null;

                                let alignmentClass = 'text-center';
                                if (col.key === 'actions') {
                                  alignmentClass = 'text-right';
                                } else if (col.key === 'checkbox') {
                                  alignmentClass = 'text-center';
                                } else if (col.key === 'id') {
                                  alignmentClass = 'text-left';
                                }

                                return (
                                  <td
                                    key={`blank-${index}-${col.key}`}
                                    className={`px-4 py-[16px] text-white ${alignmentClass}`}
                                  >
                                    &nbsp;
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
        id={selectedDocumentId}
        open={isDocumentInfoDialogOpen}
        onClose={() => setIsDocumentInfoDialogOpen(false)}
      />
    </Layout>
  );
};

export default Index;
