import { Loader, FileSearch2, Users, FileText } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import { RemoveButton } from '@/components/ChatDemo/remove';
import Table, { Column } from '@/components/ChatDemo/Table';
import AssignDocumentToCollectionDialog from '@/components/ChatDemo/utils/AssignDocumentToCollectionDialog';
import AssignUserToCollectionDialog from '@/components/ChatDemo/utils/AssignUserToCollectionDialog';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import {
  DocumentInfoType,
  IngestionStatus,
  KGExtractionStatus,
  User,
} from '@/types';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;
const ITEMS_PER_PAGE = 10;

const CollectionIdPage: React.FC = () => {
  const router = useRouter();
  const { getClient, pipeline } = useUserContext();
  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);
  const [isAssignDocumentDialogOpen, setIsAssignDocumentDialogOpen] =
    useState(false);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('documents');
  const itemsPerPage = ITEMS_PER_PAGE;

  const currentData = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchData = useCallback(
    async (
      currentCollectionId: string,
      retryCount = 0
    ): Promise<{ results: DocumentInfoType[]; total_entries: number }> => {
      if (!pipeline?.deploymentUrl) {
        console.error('No pipeline deployment URL available');
        setError('No pipeline deployment URL available');
        setIsLoading(false);
        return { results: [], total_entries: 0 };
      }

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const [documentsData, usersData] = await Promise.all([
          client.getDocumentsInCollection(currentCollectionId),
          client.getUsersInCollection(currentCollectionId),
        ]);

        console.log('rawDocuments', documentsData.results);
        console.log('rawUsers', usersData.results);

        setDocuments(documentsData.results);
        setUsers(usersData.results);
        setPendingDocuments(
          documentsData.results
            .filter(
              (doc: DocumentInfoType) =>
                doc.ingestion_status !== IngestionStatus.SUCCESS &&
                doc.ingestion_status !== IngestionStatus.FAILED
            )
            .map((doc: DocumentInfoType) => doc.id)
        );
        setIsLoading(false);
        setError(null);
        setSelectedDocumentIds([]);

        return {
          results: documentsData.results,
          total_entries: documentsData.results.length,
        };
      } catch (error) {
        console.error('Error fetching data:', error);
        if (retryCount < MAX_RETRIES) {
          return new Promise((resolve) =>
            setTimeout(
              () => resolve(fetchData(currentCollectionId, retryCount + 1)),
              RETRY_DELAY
            )
          );
        } else {
          setError('Failed to fetch data. Please try again later.');
          setIsLoading(false);
          return { results: [], total_entries: 0 };
        }
      }
    },
    [getClient, pipeline?.deploymentUrl]
  );

  const fetchPendingDocuments = useCallback(
    async (currentCollectionId: string) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const updatedDocuments =
          await client.getDocumentsInCollection(currentCollectionId);

        setDocuments(updatedDocuments.results);

        setPendingDocuments((prevPending) =>
          prevPending.filter((id) =>
            updatedDocuments.results.some(
              (doc: DocumentInfoType) =>
                doc.id === id &&
                doc.ingestion_status !== IngestionStatus.SUCCESS &&
                doc.ingestion_status !== IngestionStatus.FAILED
            )
          )
        );
      } catch (error) {
        console.error('Error fetching pending documents:', error);
      }
    },
    [getClient]
  );

  useEffect(() => {
    console.log('Router query:', router.query);
    if (router.isReady) {
      const currentCollectionId = router.query.collection_id;
      if (typeof currentCollectionId === 'string') {
        fetchData(currentCollectionId).then(({ results }) => {
          setDocuments(results);
        });
      } else {
        setError('Invalid collection ID');
        setIsLoading(false);
      }
    }
  }, [router.isReady, router.query.collection_id, fetchData]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const currentCollectionId =
      typeof router.query.collection_id === 'string'
        ? router.query.collection_id
        : '';

    if (pendingDocuments.length > 0 && currentCollectionId) {
      intervalId = setInterval(() => {
        fetchPendingDocuments(currentCollectionId);
      }, 2500); // 2.5 seconds interval
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pendingDocuments, fetchPendingDocuments, router.query.collection_id]);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const currentPageIds = currentData.map((doc) => doc.id);
      setSelectedDocumentIds((prev) => [
        ...new Set([...prev, ...currentPageIds]),
      ]);
    } else {
      const currentPageIds = currentData.map((doc) => doc.id);
      setSelectedDocumentIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  const handleSelectItem = (item: DocumentInfoType, selected: boolean) => {
    if (selected) {
      setSelectedDocumentIds((prev) => [...prev, item.id]);
    } else {
      setSelectedDocumentIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns: Column<DocumentInfoType>[] = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'id', label: 'Document ID', truncate: true, copyable: true },
    {
      key: 'user_id',
      label: 'User ID',
      truncate: true,
      copyable: true,
      selected: false,
    },
    {
      key: 'collection_ids',
      label: 'Collection IDs',
      renderCell: (doc) => doc.collection_ids.join(', ') || 'N/A',
      selected: false,
    },
    {
      key: 'ingestion_status',
      label: 'Ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.ingestion_status === IngestionStatus.SUCCESS
              ? 'success'
              : doc.ingestion_status === IngestionStatus.FAILED
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.ingestion_status}
        </Badge>
      ),
    },
    {
      key: 'kg_extraction_status',
      label: 'KG Extraction',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.kg_extraction_status === KGExtractionStatus.SUCCESS
              ? 'success'
              : doc.kg_extraction_status === KGExtractionStatus.FAILED
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.kg_extraction_status}
        </Badge>
      ),
      selected: false,
    },
    { key: 'type', label: 'Type', selected: false },
    {
      key: 'metadata',
      label: 'Metadata',
      renderCell: (doc) => JSON.stringify(doc.metadata),
      selected: false,
    },
    { key: 'version', label: 'Version', selected: false },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      renderCell: (doc) => new Date(doc.created_at).toLocaleString(),
      selected: false,
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      sortable: true,
      renderCell: (doc) => new Date(doc.updated_at).toLocaleString(),
      selected: false,
    },
  ];

  const renderActions = (doc: DocumentInfoType) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={doc.id}
        collectionId={currentCollectionId}
        itemType="document"
        onSuccess={() => fetchData(currentCollectionId)}
        showToast={toast}
      />
      <Button
        onClick={() => {
          setSelectedDocumentId(doc.id);
          setIsDocumentInfoDialogOpen(true);
        }}
        color={
          doc.ingestion_status === IngestionStatus.SUCCESS
            ? 'filled'
            : 'disabled'
        }
        shape="slim"
        disabled={doc.ingestion_status !== IngestionStatus.SUCCESS}
      >
        <FileSearch2 className="h-6 w-6" />
      </Button>
    </div>
  );

  const userColumns: Column<User>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'id', label: 'User ID', truncate: true, copyable: true },
    { key: 'email', label: 'Email', truncate: true, copyable: true },
  ];

  const renderUserActions = (user: User) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={user.id?.toString() || ''}
        collectionId={currentCollectionId}
        itemType="user"
        onSuccess={() => fetchData(currentCollectionId)}
        showToast={toast}
      />
    </div>
  );

  const handleAssignSuccess = () => {
    if (
      router.query.collection_id &&
      typeof router.query.collection_id === 'string'
    ) {
      fetchData(router.query.collection_id);
    }
  };

  if (isLoading) {
    return (
      <Layout pageTitle="Loading..." includeFooter={false}>
        <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)] justify-center items-center">
          <Loader className="animate-spin" size={64} />
          <p className="mt-4">Loading page data...</p>
        </main>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout pageTitle="Error" includeFooter={false}>
        <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)] justify-center items-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p>{error}</p>
        </main>
      </Layout>
    );
  }

  const currentCollectionId =
    typeof router.query.collection_id === 'string'
      ? router.query.collection_id
      : '';

  return (
    <Layout
      pageTitle={`Collection ${currentCollectionId} Overview`}
      includeFooter={false}
    >
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)] mt-5">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>
          <TabsContent value="documents" className="flex-grow flex flex-col">
            <div className="flex justify-end items-center space-x-2 mb-2">
              <Button
                onClick={() => setIsAssignDocumentDialogOpen(true)}
                type="button"
                color="filled"
                shape="rounded"
                className="pl-2 pr-2 text-white py-2 px-4"
                style={{ zIndex: 20 }}
              >
                Manage Files
              </Button>
            </div>
            <div className="flex-grow overflow-auto">
              <Table
                data={documents}
                columns={columns}
                itemsPerPage={itemsPerPage}
                onSelectAll={handleSelectAll}
                onSelectItem={(itemId: string, selected: boolean) => {
                  const item = documents.find((doc) => doc.id === itemId);
                  if (item) {
                    handleSelectItem(item, selected);
                  }
                }}
                selectedItems={selectedDocumentIds}
                actions={renderActions}
                initialSort={{ key: 'title', order: 'asc' }}
                initialFilters={{}}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                loading={isLoading}
                showPagination={true}
              />
            </div>
          </TabsContent>
          <TabsContent value="users" className="flex-grow flex flex-col">
            <div className="flex justify-end items-center space-x-2 mb-2">
              <Button
                onClick={() => setIsAssignUserDialogOpen(true)}
                type="button"
                color="filled"
                shape="rounded"
                className="pl-2 pr-2 text-white py-2 px-4"
                style={{ zIndex: 20 }}
              >
                Manage Users
              </Button>
            </div>
            <div className="flex-grow overflow-auto">
              <Table
                data={users}
                columns={userColumns}
                itemsPerPage={itemsPerPage}
                onSelectAll={(selected) => {
                  // Implement select all for users if needed
                }}
                onSelectItem={(itemId: string, selected: boolean) => {
                  // Implement select item for users if needed
                }}
                selectedItems={[]} // Manage selected users if necessary
                actions={renderUserActions}
                initialSort={{ key: 'name', order: 'asc' }}
                initialFilters={{}}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                loading={isLoading}
                showPagination={true}
              />
            </div>
          </TabsContent>
        </Tabs>
        <div className="-mt-12 flex justify-end">
          <DeleteButton
            collectionId={currentCollectionId}
            isCollection={true}
            onSuccess={() => router.push('/collections')}
            showToast={toast}
            selectedDocumentIds={[]}
            onDelete={() => {}}
          />
        </div>
      </main>
      <DocumentInfoDialog
        id={selectedDocumentId}
        open={isDocumentInfoDialogOpen}
        onClose={() => setIsDocumentInfoDialogOpen(false)}
      />
      <AssignDocumentToCollectionDialog
        open={isAssignDocumentDialogOpen}
        onClose={() => setIsAssignDocumentDialogOpen(false)}
        collection_id={currentCollectionId}
        onAssignSuccess={handleAssignSuccess}
      />
      <AssignUserToCollectionDialog
        open={isAssignUserDialogOpen}
        onClose={() => setIsAssignUserDialogOpen(false)}
        collection_id={currentCollectionId}
        onAssignSuccess={handleAssignSuccess}
      />
    </Layout>
  );
};

export default CollectionIdPage;
