'use client';
import { useEffect } from 'react';

import { UploadButton } from './upload';
import { R2RClient } from '../../r2r-ts-client';

export function Sidebar({
  userId,
  apiUrl,
  uploadedDocuments,
  setUploadedDocuments,
}) {
  const client = new R2RClient(apiUrl);

  // useEffect(() => {
  //   if (userId && apiUrl) {
  //     client
  //       .getUserDocumentsMetadata(userId)
  //       .then((documents) => {
  //         setUploadedDocuments(documents['results']);
  //       })
  //       .catch((error) => {
  //         console.error('Error fetching user documents:', error);
  //       });
  //   }
  // }, [userId, apiUrl]);

  const deleteDocument = async (documentId) => {
    try {
      await client.delete(['document_id'], [documentId]);
      // Update the state to remove the deleted document
      setUploadedDocuments(
        uploadedDocuments.filter((doc) => doc.document_id !== documentId)
      );
      alert('Document deleted successfully.');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const abbreviateFileName = (name, maxLength = 48) => {
    if (!name || name.length <= maxLength) return name;
    return `${name.substring(0, maxLength - 3)}...`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 pt-4">
        <h2 className="text-lg text-ellipsis font-bold text-blue-500">
          Documents
        </h2>
        <UploadButton
          userId={userId}
          apiUrl={apiUrl}
          uploadedDocuments={uploadedDocuments}
          setUploadedDocuments={setUploadedDocuments}
        />
      </div>
      <div className="border-t border-white mb-2"></div>
      <div
        className="flex-grow overflow-y-scroll max-h-[calc(100vh-290px)]"
        style={{
          overflowY: 'scroll',
          scrollBehavior: 'smooth',
          msScrollbarBaseColor: '#888',
          zIndex: 10,
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 10px;
          }
          div::-webkit-scrollbar-thumb {
            background-color: #555;
            border-radius: 5px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #333;
          }
        `}</style>
        <ul>
          {uploadedDocuments?.map((document, index) => {
            if (!document.title) return null;
            return (
              <li
                key={index}
                className="flex justify-between items-center text-zinc-300 mt-2"
                // style={{ zIndex: 10 }}
              >
                <span className="truncate">
                  {abbreviateFileName(document.title)}
                </span>
                <button
                  onClick={() => deleteDocument(document.document_id)}
                  className="hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                >
                  x
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
