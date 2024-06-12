import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { UpdateButton } from '@/components/ChatDemo/update';
import { UploadButton } from '@/components/ChatDemo/upload';
import Layout from '@/components/Layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast, useToast } from '@/components/ui/use-toast';
import { usePipelineContext } from '@/context/PipelineContext';
import { useUserContext } from '@/context/UserContext';

import { R2RClient } from '../../../r2r-js-client';

class DocumentInfoType {
  document_id: string;
  user_id: string;
  title: string;
  version: string;
  updated_at: string;
  size_in_bytes: number;
  metadata: any;
}

const Index: React.FC = () => {
  const [collapsedStates, setCollapsedStates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const documentsPerPage = 10;

  const fetchDocuments = (client: R2RClient) => {
    client
      .getDocumentsInfo(null, null)
      .then((data) => {
        console.log('data = ', data.results);
        setDocuments(data.results);
      })
      .catch((error) => {
        console.error('Error fetching documents:', error);
      });
  };

  const { pipelines, updatePipelines } = usePipelineContext();
  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;

  const userId = '063edaf8-3e63-4cb9-a4d6-a855f36376c3';

  const deleteDocument = async (documentId) => {
    if (apiUrl) {
      try {
        const client = new R2RClient(apiUrl);
        await client.delete(['document_id'], [documentId]);
        toast({
          variant: 'success',
          title: 'Document deleted',
          description: 'The document has been successfully deleted',
        });
        fetchDocuments(client);
      } catch (error) {
        console.error('Error deleting document:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to delete document',
          description: error.message,
        });
      }
    }
  };

  useEffect(() => {
    if (apiUrl) {
      console.log('fetching...');
      const client = new R2RClient(apiUrl);
      fetchDocuments(client);
    }
  }, [apiUrl]);

  const toggleCollapse = (docIndex, entryIndex) => {
    const key = `${docIndex}-${entryIndex}`;
    setCollapsedStates((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(documents.length / documentsPerPage);
  const currentDocuments = documents.slice(
    (currentPage - 1) * documentsPerPage,
    currentPage * documentsPerPage
  );

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen container">
        <div className="mt-[5rem] sm:mt-[5rem]">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-blue-500 pl-4">Documents</h3>
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
                <tbody>
                  {currentDocuments.length > 0 ? (
                    currentDocuments.map((doc, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-white">
                          <div
                            className="overflow-x-auto whitespace-nowrap"
                            style={{ width: '150px' }}
                          >
                            {doc.document_id}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-white">
                          <div
                            className="overflow-x-auto whitespace-nowrap"
                            style={{ width: '150px' }}
                          >
                            {doc.user_id}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-white">
                          <div
                            className="overflow-x-auto whitespace-nowrap"
                            style={{ width: '150px' }}
                          >
                            {doc.title}
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
                            style={{ width: '50px' }}
                          >
                            {(doc.size_in_bytes / 1e6).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-white">
                          <div className="flex justify-center items-center space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <UpdateButton
                                    userId={doc.user_id}
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

                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertDialogTrigger asChild>
                                      <button className="hover:bg-red-700 bg-red-500 text-white font-bold py-1 px-2 rounded">
                                        x
                                      </button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete Document</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure you want to delete this
                                    document?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The document
                                    will be permanently deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deleteDocument(doc.document_id)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-white">
                          <div
                            className="overflow-x-auto whitespace-nowrap"
                            style={{ width: '350px' }}
                          >
                            {JSON.stringify(doc.metadata)}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-2 text-center text-white"
                      >
                        <div
                          className="flex justify-center items-center space-x-2"
                          style={{ width: '1300px' }}
                        >
                          No documents have been uploaded to the pipeline.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            {currentPage > 1 && (
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-4 py-2 mx-1 rounded bg-blue-500 text-white"
              >
                &lt; Previous
              </button>
            )}
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 mx-1 rounded ${
                  currentPage === index + 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {index + 1}
              </button>
            ))}
            {currentPage < totalPages && (
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-4 py-2 mx-1 rounded bg-blue-500 text-white"
              >
                Next &gt;
              </button>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};
export default Index;
