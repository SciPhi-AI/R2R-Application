import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import UpdateButtonContainer from '@/components/ChatDemo/UpdateButtonContainer';
import { UploadButton } from '@/components/ChatDemo/upload';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import Layout from '@/components/Layout';
import Pagination from '@/components/ui/altPagination';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast, useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

import { R2RDocumentsOverviewRequest } from '../../../r2r-js-client/models';

import { R2RClient } from '../../../r2r-js-client';

class DocumentInfoType {
  document_id: string = '';
  user_id: string = '';
  title: string = '';
  version: string = '';
  updated_at: string = '';
  size_in_bytes: number = 0;
  metadata: any = null;
}

const Index: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const documentsPerPage = 10;

  const fetchDocuments = (client: R2RClient) => {
    const documentsOverviewRequest: R2RDocumentsOverviewRequest = {
      document_ids: [],
      user_ids: [],
    };
    client
      .documentsOverview(documentsOverviewRequest)
      .then((data) => {
        console.log('data = ', data.results);
        setDocuments(data.results);
      })
      .catch((error) => {
        console.error('Error fetching documents:', error);
      });
  };

  // OSS specific pipeline logic
  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;

  const userId = '063edaf8-3e63-4cb9-a4d6-a855f36376c3';

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil((documents.length || 0) / documentsPerPage);
  const currentDocuments = documents.slice(
    (currentPage - 1) * documentsPerPage,
    currentPage * documentsPerPage
  );

  useEffect(() => {
    if (apiUrl) {
      const client = new R2RClient(apiUrl);
      fetchDocuments(client);
    }
  }, [apiUrl]);

  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);

  const renderTableRows = () => {
    const rows = [];

    if (documents.length === 0) {
      rows.push(
        <tr key="no-docs">
          <td colSpan={8} className="px-4 py-2 text-center text-white">
            No documents available. Upload a document to get started.
          </td>
        </tr>
      );

      // Calculate the number of empty rows needed
      const emptyRowsCount = documentsPerPage - 1;

      // Render empty rows
      for (let i = 0; i < emptyRowsCount; i++) {
        rows.push(
          <tr key={`empty-${i}`} style={{ height: '50px' }}>
            <td colSpan={8} className="px-4 py-2 text-center text-white">
              <div
                className="flex justify-center items-center space-x-2"
                style={{ width: '1300px' }}
              >
                &nbsp;
              </div>
            </td>
          </tr>
        );
      }
    } else {
      // Render rows for current documents
      currentDocuments.forEach((doc) => {
        rows.push(
          <tr key={doc.document_id} style={{ height: '50px' }}>
            <td className="px-4 py-2 text-white">
              <div className="flex items-center">
                <Checkbox
                  checked={selectedDocumentIds.includes(doc.document_id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedDocumentIds([
                        ...selectedDocumentIds,
                        doc.document_id,
                      ]);
                    } else {
                      setSelectedDocumentIds(
                        selectedDocumentIds.filter(
                          (id) => id !== doc.document_id
                        )
                      );
                    }
                  }}
                />
                <div
                  className="overflow-x-auto whitespace-nowrap ml-4"
                  style={{ width: '225px' }}
                >
                  {doc.document_id}
                </div>
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '150px' }}
              >
                {doc.user_id !== null && doc.user_id !== undefined
                  ? doc.user_id
                  : 'N/A'}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '150px' }}
              >
                {doc.title !== null && doc.title !== undefined
                  ? doc.title
                  : 'N/A'}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '50px' }}
              >
                {doc.version}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '150px' }}
              >
                {doc.updated_at}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '75px' }}
              >
                {(doc.size_in_bytes / 1e6).toFixed(2)}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div className="flex justify-center items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <UpdateButtonContainer
                        apiUrl={apiUrl}
                        documentId={doc.document_id}
                        onUpdateSuccess={() =>
                          fetchDocuments(new R2RClient(apiUrl))
                        }
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
                          setSelectedDocumentId(doc.document_id);
                          setIsDocumentInfoDialogOpen(true);
                        }}
                        className="info-button hover:bg-blue-700 bg-blue-500 text-white font-bold rounded flex items-center justify-center"
                      >
                        <DocumentMagnifyingGlassIcon className="h-8 w-8" />
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
                style={{ width: '200px' }}
              >
                {doc.updated_at}
              </div>
            </td>
          </tr>
        );
      });

      // Calculate the number of empty rows needed
      const emptyRowsCount = documentsPerPage - currentDocuments.length;

      // Render empty rows
      for (let i = 0; i < emptyRowsCount; i++) {
        rows.push(
          <tr key={`empty-${i}`} style={{ height: '50px' }}>
            <td colSpan={8} className="px-4 py-2 text-center text-white">
              <div
                className="flex justify-center items-center space-x-2"
                style={{ width: '1300px' }}
              >
                &nbsp;
              </div>
            </td>
          </tr>
        );
      }
    }

    return rows;
  };

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen container">
        <div className="mt-[5rem] sm:mt-[5rem]">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-blue-500 pl-4">Documents</h3>
            <div className="flex justify-center mt-4">
              <div className="mt-6 pr-2">
                <UploadButton
                  userId={userId}
                  apiUrl={apiUrl}
                  uploadedDocuments={documents}
                  setUploadedDocuments={setDocuments}
                  onUploadSuccess={() => fetchDocuments(new R2RClient(apiUrl))}
                  showToast={toast}
                />
              </div>
              <div className="mt-6 pr-2">
                <DeleteButton
                  selectedDocumentIds={selectedDocumentIds}
                  apiUrl={apiUrl}
                  onDelete={() => setSelectedDocumentIds([])}
                  onSuccess={() => fetchDocuments(new R2RClient(apiUrl))}
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
                      Document ID
                    </th>
                    <th className="px-4 py-2 text-left text-white">User ID</th>
                    <th className="px-4 py-2 text-left text-white">Title</th>
                    <th className="px-4 py-2 text-left text-white">Version</th>
                    <th className="px-4 py-2 text-left text-white">
                      Updated At
                    </th>
                    <th className="px-4 py-2 text-left text-white">
                      Size in MB
                    </th>
                    <th className="px-4 py-2 text-left text-white">Actions</th>
                    <th className="px-4 py-2 text-left text-white">Metadata</th>
                  </tr>
                </thead>
                <tbody>{renderTableRows()}</tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
      <DocumentInfoDialog
        documentId={selectedDocumentId}
        apiUrl={apiUrl}
        open={isDocumentInfoDialogOpen}
        onClose={() => setIsDocumentInfoDialogOpen(false)}
      />
    </Layout>
  );
};

export default Index;
