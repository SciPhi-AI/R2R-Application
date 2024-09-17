// @/pages/[groupId].tsx

import { Loader, FileSearch2 } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import Table, { Column } from '@/components/ChatDemo/Table';
import UpdateButtonContainer from '@/components/ChatDemo/UpdateButtonContainer';
import { UploadButton } from '@/components/ChatDemo/upload';
import AssignDocumentToGroupDialog from '@/components/ChatDemo/utils/AssignDocumentToGroupDialog';
import AssignUserToGroupDialog from '@/components/ChatDemo/utils/AssignUserToGroupDialog';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { DocumentInfoType, IngestionStatus, User } from '@/types';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;
const ITEMS_PER_PAGE = 10;

const GroupIdPage: React.FC = () => {
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
  const itemsPerPage = ITEMS_PER_PAGE;

  const currentData = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchData = useCallback(
    async (currentGroupId: string, retryCount = 0): Promise<any[]> => {
      if (!pipeline?.deploymentUrl) {
        console.error('No pipeline deployment URL available');
        setError('No pipeline deployment URL available');
        setIsLoading(false);
        return [];
      }

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const [documentsData, usersData] = await Promise.all([
          client.documentsOverview(),
          client.usersOverview(),
        ]);

        const filteredDocuments = (documentsData.results || []).filter(
          (doc: DocumentInfoType) => doc.group_ids?.includes(currentGroupId)
        );
        const filteredUsers = (usersData.results || []).filter((user: User) =>
          user.group_ids?.includes(currentGroupId)
        );

        console.log('rawUsers', usersData.results);
        console.log('filteredUsers:', filteredUsers);

        setDocuments(filteredDocuments);
        setUsers(filteredUsers);
        setPendingDocuments(
          filteredDocuments
            .filter(
              (doc: DocumentInfoType) =>
                doc.ingestion_status !== IngestionStatus.SUCCESS &&
                doc.ingestion_status !== IngestionStatus.FAILURE
            )
            .map((doc: DocumentInfoType) => doc.id)
        );
        setIsLoading(false);
        setError(null);
        setSelectedDocumentIds([]);

        return [filteredDocuments, filteredUsers];
      } catch (error) {
        console.error('Error fetching data:', error);
        if (retryCount < MAX_RETRIES) {
          return new Promise((resolve) =>
            setTimeout(
              () => resolve(fetchData(currentGroupId, retryCount + 1)),
              RETRY_DELAY
            )
          );
        } else {
          setError('Failed to fetch data. Please try again later.');
          setIsLoading(false);
          return [];
        }
      }
    },
    [getClient, pipeline?.deploymentUrl]
  );

  const fetchPendingDocuments = useCallback(
    async (currentGroupId: string) => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const data = await client.documentsOverview();
        const updatedDocuments = data.results.filter((doc: DocumentInfoType) =>
          pendingDocuments.includes(doc.id)
        );

        setDocuments((prevDocuments) => {
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
    },
    [getClient, pendingDocuments]
  );

  useEffect(() => {
    if (router.isReady) {
      const currentGroupId = router.query.groupId;
      if (typeof currentGroupId === 'string') {
        fetchData(currentGroupId);
      } else {
        setError('Invalid group ID');
        setIsLoading(false);
      }
    }
  }, [router.isReady, router.query.groupId, fetchData]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const currentGroupId =
      typeof router.query.groupId === 'string' ? router.query.groupId : '';

    if (pendingDocuments.length > 0 && currentGroupId) {
      intervalId = setInterval(() => {
        fetchPendingDocuments(currentGroupId);
      }, 2500); // 2.5 seconds interval
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pendingDocuments, fetchPendingDocuments, router.query.groupId]);

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
      key: 'group_ids',
      label: 'Group IDs',
      renderCell: (doc) => doc.group_ids.join(', ') || 'N/A',
      selected: false,
    },
    {
      key: 'ingestion_status',
      label: 'Ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failure', 'pending'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.ingestion_status === IngestionStatus.SUCCESS
              ? 'success'
              : doc.ingestion_status === IngestionStatus.FAILURE
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.ingestion_status}
        </Badge>
      ),
    },
    {
      key: 'restructuring_status',
      label: 'Restructuring',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failure', 'pending'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.restructuring_status === 'success'
              ? 'success'
              : doc.restructuring_status === 'failure'
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.restructuring_status}
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
      <UpdateButtonContainer
        id={doc.id}
        onUpdateSuccess={() =>
          fetchData(
            typeof router.query.groupId === 'string' ? router.query.groupId : ''
          )
        }
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
        <FileSearch2 className="h-8 w-8" />
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
      <Button
        onClick={() => {
          // Handle user action
          toast({
            title: 'Action not implemented',
            description: 'This feature is coming soon.',
          });
        }}
        color="primary"
        shape="slim"
      >
        Edit
      </Button>
    </div>
  );

  const handleAssignSuccess = () => {
    if (router.query.groupId && typeof router.query.groupId === 'string') {
      fetchData(router.query.groupId);
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

  const currentGroupId =
    typeof router.query.groupId === 'string' ? router.query.groupId : '';

  return (
    <Layout
      pageTitle={`Group ${currentGroupId} Overview`}
      includeFooter={false}
    >
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)] mt-5">
        <div className="flex space-x-4">
          <div className="w-1/2">
            <h2 className="text-xl font-semibold mb-2">Documents</h2>
            <div className="flex justify-end items-center space-x-2 -mb-6">
              <Button
                onClick={() => setIsAssignDocumentDialogOpen(true)}
                type="button"
                color="filled"
                shape="rounded"
                className={`pl-2 pr-2 text-white py-2 px-4`}
              >
                Add File to Group
              </Button>
              <UploadButton
                userId={null}
                uploadedDocuments={documents}
                setUploadedDocuments={setDocuments}
                onUploadSuccess={() => fetchData(currentGroupId)}
                showToast={toast}
                setPendingDocuments={setPendingDocuments}
                setCurrentPage={() => {}}
                documentsPerPage={itemsPerPage}
              />
              <Button
                onClick={() => setIsAssignDocumentDialogOpen(true)}
                type="button"
                color="danger"
                shape="rounded"
                className={`pl-2 pr-2 text-white py-2 px-4`}
              >
                Remove File(s)
              </Button>
              <DeleteButton
                selectedDocumentIds={selectedDocumentIds}
                onDelete={() => setSelectedDocumentIds([])}
                onSuccess={() => fetchData(currentGroupId)}
                showToast={toast}
              />
            </div>
            <Table
              data={documents}
              currentData={currentData}
              columns={columns}
              itemsPerPage={itemsPerPage}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              selectedItems={documents.filter((doc) =>
                selectedDocumentIds.includes(doc.id)
              )}
              actions={renderActions}
              initialSort={{ key: 'title', order: 'asc' }}
              initialFilters={{}}
              tableHeight="600px"
              currentPage={currentPage}
              onPageChange={handlePageChange}
              totalItems={documents.length}
            />
          </div>
          <div className="w-1/2">
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            <div className="flex justify-end items-center space-x-2 -mb-6">
              <Button
                onClick={() => setIsAssignUserDialogOpen(true)}
                type="button"
                color="filled"
                shape="rounded"
                className={`pl-2 pr-2 text-white py-2 px-4`}
              >
                Add User to Group
              </Button>
              <Button
                onClick={() => setIsAssignDocumentDialogOpen(true)}
                type="button"
                color="danger"
                shape="rounded"
                className={`pl-2 pr-2 text-white py-2 px-4`}
              >
                Remove User(s)
              </Button>
            </div>
            {/* <Table
              data={users}
              currentData={users.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )}
              columns={userColumns}
              itemsPerPage={itemsPerPage}
              onSelectAll={(selected) => {
                // Implement select all for users if needed
              }}
              onSelectItem={(item: User, selected: boolean) => {
                // Implement select item for users if needed
              }}
              selectedItems={[]} // Manage selected users if necessary
              actions={renderUserActions}
              initialSort={{ key: 'name', order: 'asc' }}
              initialFilters={{}}
              tableHeight="600px"
              currentPage={currentPage}
              onPageChange={handlePageChange}
              totalItems={users.length}
            /> */}
          </div>
        </div>
      </main>
      <DocumentInfoDialog
        id={selectedDocumentId}
        open={isDocumentInfoDialogOpen}
        onClose={() => setIsDocumentInfoDialogOpen(false)}
      />
      <AssignDocumentToGroupDialog
        open={isAssignDocumentDialogOpen}
        onClose={() => setIsAssignDocumentDialogOpen(false)}
        groupId={currentGroupId}
        onAssignSuccess={handleAssignSuccess}
      />
      <AssignUserToGroupDialog
        open={isAssignUserDialogOpen}
        onClose={() => setIsAssignUserDialogOpen(false)}
        groupId={currentGroupId}
        onAssignSuccess={handleAssignSuccess}
      />
    </Layout>
  );
};

export default GroupIdPage;
