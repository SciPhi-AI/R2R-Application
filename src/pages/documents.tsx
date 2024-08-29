import { format, parseISO } from 'date-fns';
import { ChevronUpSquare, ChevronDownSquare, FileSearch2 } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import UpdateButtonContainer from '@/components/ChatDemo/UpdateButtonContainer';
import { UploadButton } from '@/components/ChatDemo/upload';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import { getFilteredAndSortedDocuments } from '@/components/ChatDemo/utils/documentSorter';
import Layout from '@/components/Layout';
import Pagination from '@/components/ui/altPagination';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { DocumentFilterCriteria, DocumentInfoType } from '@/types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const DOCUMENTS_PER_PAGE = 10;

const Index: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [filterCriteria, setFilterCriteria] = useState<DocumentFilterCriteria>({
    sort: 'title',
    order: 'asc',
  });
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);

  const { toast } = useToast();
  const { pipeline, getClient } = useUserContext();

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
        console.log(data.results);
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

  const filteredAndSortedDocuments = useMemo(
    () => getFilteredAndSortedDocuments(documents, filterCriteria),
    [documents, filterCriteria]
  );

  const totalPages = Math.ceil(
    filteredAndSortedDocuments.length / DOCUMENTS_PER_PAGE
  );
  const currentDocuments = filteredAndSortedDocuments.slice(
    (currentPage - 1) * DOCUMENTS_PER_PAGE,
    currentPage * DOCUMENTS_PER_PAGE
  );

  const handleSelectAll = (checked: boolean) => {
    setIsAllSelected(checked);
    if (checked) {
      const currentPageDocumentIds = currentDocuments.map((doc) => doc.id);
      setSelectedDocumentIds((prevSelected) => [
        ...new Set([...prevSelected, ...currentPageDocumentIds]),
      ]);
    } else {
      const currentPageDocumentIds = currentDocuments.map((doc) => doc.id);
      setSelectedDocumentIds((prevSelected) =>
        prevSelected.filter((id) => !currentPageDocumentIds.includes(id))
      );
    }
  };

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(filteredAndSortedDocuments.length / DOCUMENTS_PER_PAGE)
    );
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
    setIsAllSelected(false);
  }, [filteredAndSortedDocuments.length, currentPage]);

  useEffect(() => {
    const currentPageDocumentIds = currentDocuments.map((doc) => doc.id);
    const allCurrentSelected = currentPageDocumentIds.every((id) =>
      selectedDocumentIds.includes(id)
    );
    setIsAllSelected(allCurrentSelected);
  }, [selectedDocumentIds, currentDocuments]);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: 'Copied!', description }))
      .catch((err) => console.error('Could not copy text: ', err));
  };

  const formatDate = (dateString: string) => {
    if (dateString && dateString.length > 0) {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy HH:mm');
    }
    return 'N/A';
  };

  const renderTableRows = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-2 text-center text-white">
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span>Loading documents...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-2 text-center text-white">
            {error}
          </td>
        </tr>
      );
    }

    if (documents.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-2 text-center text-white">
            No documents available. Upload a document to get started.
          </td>
        </tr>
      );
    } else {
      currentDocuments.forEach((doc) => {
        rows.push(
          <tr key={doc.id}>
            <td className="px-4 py-2 text-white">
              <div className="flex items-center">
                <Checkbox
                  checked={selectedDocumentIds.includes(doc.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedDocumentIds([...selectedDocumentIds, doc.id]);
                    } else {
                      setSelectedDocumentIds(
                        selectedDocumentIds.filter((id) => id !== doc.id)
                      );
                    }
                  }}
                />
                <div
                  className="overflow-x-auto whitespace-nowrap ml-4"
                  style={{ width: '125px' }}
                >
                  {/* {doc.document_id} */}
                  <div
                    className="overflow-x-auto whitespace-nowrap ml-4 cursor-pointer flex items-center"
                    style={{ width: '125px' }}
                    onClick={() => copyToClipboard(doc.id)}
                  >
                    {doc.id.substring(0, 4)}...
                    {doc.id.substring(doc.id.length - 4, doc.id.length)}
                    {/* <ClipboardCopyIcon className="h-4 w-4 ml-2" /> */}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap cursor-pointer"
                style={{ width: '100px' }}
                onClick={() => copyUserToClipboard(doc.user_id)}
              >
                {doc.user_id
                  ? `${doc.user_id.substring(0, 4)}...${doc.user_id.substring(doc.user_id.length - 4, doc.user_id.length)}`
                  : 'N/A'}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '175px' }}
              >
                {doc.title || 'N/A'}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '75px' }}
              >
                {doc.version}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '175px' }}
              >
                {formatDate(doc.updated_at)}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '75px' }}
              >
                {formatFileSize(doc.size_in_bytes)}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div className="flex justify-center items-center space-x-2">
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
                      <button
                        onClick={() => {
                          setSelectedDocumentId(doc.id);
                          setIsDocumentInfoDialogOpen(true);
                        }}
                        className="info-button hover:bg-blue-700 bg-blue-500 text-white font-bold rounded flex items-center justify-center"
                      >
                        <FileSearch2 className="h-8 w-8" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Document Chunks</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap ml-4 cursor-pointer flex items-center"
                style={{ width: '125px' }}
                onClick={() =>
                  copyToClipboard(doc.id, 'Document ID copied to clipboard')
                }
              >
                {doc.id
                  ? `${doc.id.substring(0, 4)}...${doc.id.slice(-4)}`
                  : 'N/A'}
              </div>
            </div>
          </td>
          <td className="px-4 py-2 text-white">
            <div
              className="overflow-x-auto whitespace-nowrap cursor-pointer"
              style={{ width: '100px' }}
              onClick={() =>
                copyToClipboard(doc.user_id, 'User ID copied to clipboard')
              }
            >
              {doc.user_id
                ? `${doc.user_id.substring(0, 4)}...${doc.user_id.slice(-4)}`
                : 'N/A'}
            </div>
          </td>
          <td className="px-4 py-2 text-white">
            <div
              className="overflow-x-auto whitespace-nowrap"
              style={{ width: '175px' }}
            >
              {doc.title || 'N/A'}
            </div>
          </td>
          <td className="px-4 py-2 text-white">
            <div
              className="overflow-x-auto whitespace-nowrap"
              style={{ width: '75px' }}
            >
              {doc.version}
            </div>
          </td>
          <td className="px-4 py-2 text-white">
            <div
              className="overflow-x-auto whitespace-nowrap"
              style={{ width: '175px' }}
            >
              {formatDate(doc.updated_at)}
            </div>
          </td>
          <td className="px-4 py-2 text-white">
            <div className="flex justify-center items-center space-x-2">
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
                    <button
                      onClick={() => {
                        setSelectedDocumentId(doc.id);
                        setIsDocumentInfoDialogOpen(true);
                      }}
                      className="info-button hover:bg-indigo-700 bg-indigo-500 text-white font-bold rounded flex items-center justify-center"
                    >
                      <FileSearch2 className="h-8 w-8" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Document Chunks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </td>
          <td className="px-4 py-2 text-white">
            <div
              className="overflow-x-auto whitespace-nowrap"
              style={{ width: '100px' }}
            >
              {doc.updated_at}
            </div>
          </td>
        </tr>
      ));
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
                <ChevronUpSquare className="h-4 w-4" />
              ) : (
                <ChevronDownSquare className="h-4 w-4" />
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
      <main className="max-w-7xl flex flex-col min-h-screen container">
        <div className="mt-[5rem] sm:mt-[5rem]">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4"></div>
            <div className="flex justify-center mt-4">
              <div className="mt-6 pr-2">
                <UploadButton
                  userId={null}
                  uploadedDocuments={documents}
                  setUploadedDocuments={setDocuments}
                  onUploadSuccess={fetchDocuments}
                  showToast={toast}
                />
              </div>
              <div className="mt-6 pr-2">
                <DeleteButton
                  selectedDocumentIds={selectedDocumentIds}
                  onDelete={() => setSelectedDocumentIds([])}
                  onSuccess={() => fetchDocuments()}
                  showToast={toast}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="table-container">
              <table className="min-w-full bg-zinc-800 border border-gray-600">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="px-4 py-2 text-left text-white">
                      <div className="flex items-center">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="pl-4">Document ID</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Click on a Document ID to copy it to clipboard
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-white">User ID</th>
                    <th className="px-4 py-2 text-left text-white">
                      {renderSortButton('Title', 'title')}
                    </th>
                    <th className="px-4 py-2 text-left text-white">Version</th>
                    <th className="px-4 py-2 text-left text-white">
                      {renderSortButton('Updated At', 'date')}
                    </th>
                    <th className="px-4 py-2 text-left text-white">Actions</th>
                    <th className="px-4 py-2 text-left text-white">Metadata</th>
                  </tr>
                </thead>
                <tbody>{renderTableRows()}</tbody>
              </table>
            </div>
          </div>

          {!isLoading && !error && filteredAndSortedDocuments.length > 0 && (
            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
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
