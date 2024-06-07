import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import Layout from '@/components/Layout';
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

  const documentsPerPage = 5;

  const fetchDocuments = (client: R2RClient) => {
    client.getDocumentsInfo(null, null).then((data) => {
      setDocuments(data.results);
    });
  };

  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;

  const deleteDocument = async (documentId) => {
    if (!apiUrl) {
      const client = new R2RClient(apiUrl);
      client.delete(['document_id'], [documentId]);
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

  const formatDocumentEntry = (doc, docIndex) => {
    const isCollapsed = collapsedStates[docIndex];
    const contentHeight = 'auto';

    return (
      <tr key={docIndex} className="border-t border-gray-600">
        <td className="px-4 py-2 text-white">{doc.document_id}</td>
        <td className="px-4 py-2 text-white">{doc.user_id}</td>
        <td className="px-4 py-2 text-white">{doc.title}</td>
        <td className="px-4 py-2 text-white">{doc.version}</td>
        <td className="px-4 py-2 text-white">
          <div className="flex justify-center items-center">
            <button
              onClick={() => deleteDocument(doc.document_id)}
              className="hover:bg-red-700 bg-red-500 text-white font-bold py-1 px-2 rounded"
            >
              x
            </button>
          </div>
        </td>
        <td className="px-4 py-2 text-white">
          {(doc.size_in_bytes / 1e6).toFixed(2)}
        </td>
        <td className="px-4 py-2 text-white">
          <button
            onClick={() => deleteDocument(doc.document_id)}
            className="hover:bg-red-700 bg-red-500 text-white font-bold py-1 px-2 rounded"
          >
            x
          </button>
        </td>
        <td className="px-4 py-2 text-white">
          <div
            style={{
              maxHeight: isCollapsed ? 'none' : '125px',
              overflow: 'hidden',
            }}
          >
            <pre>{JSON.stringify(doc.metadata, null, 2)}</pre>
          </div>
          <button
            onClick={() => toggleCollapse(docIndex, 'metadata')}
            className="text-blue-500 hover:underline mt-2"
          >
            {isCollapsed ? 'Show Less' : 'Show More'}
          </button>
        </td>
      </tr>
    );
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
          <div className="flex justify-between items-center pb-4 pt-4">
            <h3 className="text-2xl font-bold text-blue-500 pl-4">Documents</h3>
          </div>

          <div className="overflow-x-auto mt-4">
            <div style={{ maxWidth: '80%' }}>
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
                          <div className="flex justify-center items-center">
                            <button
                              onClick={() => deleteDocument(doc.document_id)}
                              className="hover:bg-red-700 bg-red-500 text-white font-bold py-1 px-2 rounded"
                            >
                              x
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-white">
                          <div
                            className="overflow-x-auto whitespace-nowrap"
                            style={{ width: '300px' }}
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
                        No documents have been uploaded to the pipeline.
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
