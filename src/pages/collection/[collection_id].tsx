import { Loader, FileSearch2, Users, FileText, Contact } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import KGDescriptionDialog from '@/components/ChatDemo/KGDescriptionDialog';
import { KnowledgeGraphButton } from '@/components/ChatDemo/knowledgeGraphButton';
import { RemoveButton } from '@/components/ChatDemo/remove';
import Table, { Column } from '@/components/ChatDemo/Table';
import AssignDocumentToCollectionDialog from '@/components/ChatDemo/utils/AssignDocumentToCollectionDialog';
import AssignUserToCollectionDialog from '@/components/ChatDemo/utils/AssignUserToCollectionDialog';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import {
  DocumentInfoType,
  IngestionStatus,
  KGExtractionStatus,
  User,
  Entity,
  Community,
  Triple,
} from '@/types';

const PAGE_SIZE = 100; // Fetch in batches of 100
const ITEMS_PER_PAGE = 10;

const CollectionIdPage: React.FC = () => {
  const router = useRouter();
  const { getClient, pipeline } = useUserContext();
  const [documents, setDocuments] = useState<DocumentInfoType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [triples, setTriples] = useState<Triple[]>([]);
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedKGItem, setSelectedKGItem] = useState<any>(null);
  const [isKGDescriptionDialogOpen, setIsKGDescriptionDialogOpen] =
    useState(false);
  const [selectedKGType, setSelectedKGType] = useState<
    'entity' | 'community' | 'triple'
  >('entity');
  const itemsPerPage = ITEMS_PER_PAGE;

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    ingestion_status: ['success', 'failed', 'pending', 'enriched'],
    kg_extraction_status: ['success', 'failed', 'pending'],
  });

  const currentCollectionId =
    typeof router.query.collection_id === 'string'
      ? router.query.collection_id
      : '';

  /*** Fetching Documents in Batches ***/
  const fetchAllDocuments = useCallback(async () => {
    if (!pipeline?.deploymentUrl) {
      console.error('No pipeline deployment URL available');
      setError('No pipeline deployment URL available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allDocs: DocumentInfoType[] = [];

      // Fetch batches until all documents are fetched
      while (true) {
        const batch = await client.getDocumentsInCollection(
          currentCollectionId,
          offset,
          PAGE_SIZE
        );

        if (batch.results.length === 0) {
          break;
        }

        allDocs = allDocs.concat(batch.results);
        offset += PAGE_SIZE;
      }

      // Sort documents by a consistent key (e.g., 'id') to maintain order
      allDocs.sort((a, b) => a.id.localeCompare(b.id));

      setDocuments(allDocs);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents. Please try again later.');
      setIsLoading(false);
    }
  }, [getClient, pipeline?.deploymentUrl, currentCollectionId]);

  /*** Fetching Users, Entities, Communities, and Triples ***/
  const fetchOtherData = useCallback(async () => {
    if (!pipeline?.deploymentUrl) {
      console.error('No pipeline deployment URL available');
      setError('No pipeline deployment URL available');
      setIsLoading(false);
      return;
    }

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const [usersData, entitiesData, communitiesData, triplesData] =
        await Promise.all([
          client.getUsersInCollection(currentCollectionId),
          client.getEntities(currentCollectionId),
          client.getCommunities(currentCollectionId),
          client.getTriples(currentCollectionId),
        ]);

      setUsers(usersData.results);
      setEntities(entitiesData.results?.entities || []);
      setCommunities(communitiesData.results?.communities || []);
      setTriples(triplesData.results?.triples || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
    }
  }, [getClient, pipeline?.deploymentUrl, currentCollectionId]);

  const refetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchAllDocuments(), fetchOtherData()]);
    setSelectedDocumentIds([]);
    setIsLoading(false);
  }, [fetchAllDocuments, fetchOtherData]);

  useEffect(() => {
    if (router.isReady && currentCollectionId) {
      refetchData();
    }
  }, [router.isReady, currentCollectionId, refetchData]);

  /*** Handle Pending Documents ***/
  useEffect(() => {
    const pending = documents
      .filter(
        (doc) =>
          doc.ingestion_status !== IngestionStatus.SUCCESS &&
          doc.ingestion_status !== IngestionStatus.ENRICHED &&
          doc.ingestion_status !== IngestionStatus.FAILED
      )
      .map((doc) => doc.id);
    setPendingDocuments(pending);
  }, [documents]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (pendingDocuments.length > 0 && currentCollectionId) {
      intervalId = setInterval(() => {
        fetchAllDocuments();
      }, 2500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pendingDocuments, fetchAllDocuments, currentCollectionId]);

  /*** Client-Side Filtering and Pagination ***/
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        if (Array.isArray(value)) {
          filtered = filtered.filter((doc) => {
            switch (key) {
              case 'ingestion_status':
                return value.includes(doc.ingestion_status);
              case 'kg_extraction_status':
                return value.includes(doc.kg_extraction_status);
              default:
                return true;
            }
          });
        }
      }
    });

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title?.toLowerCase().includes(query) ||
          doc.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [documents, filters, searchQuery]);

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedDocumentIds(filteredDocuments.map((doc) => doc.id));
      } else {
        setSelectedDocumentIds([]);
      }
    },
    [filteredDocuments]
  );

  const handleSelectItem = useCallback((itemId: string, selected: boolean) => {
    setSelectedDocumentIds((prev) => {
      if (selected) {
        return [...prev, itemId];
      } else {
        return prev.filter((id) => id !== itemId);
      }
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search query changes
  };

  const renderActionButtons = () => {
    return (
      <div className="flex justify-end items-center space-x-2 mb-2">
        <KnowledgeGraphButton
          collectionId={currentCollectionId}
          showToast={toast}
        />
        {activeTab === 'documents' && (
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
        )}
        {activeTab === 'users' && (
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
        )}
      </div>
    );
  };

  const renderDocumentActions = (doc: DocumentInfoType) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={doc.id}
        collectionId={currentCollectionId}
        itemType="document"
        onSuccess={() => refetchData()}
        showToast={toast}
      />
      <Button
        onClick={() => {
          setSelectedDocumentId(doc.id);
          setIsDocumentInfoDialogOpen(true);
        }}
        color={
          doc.ingestion_status === IngestionStatus.SUCCESS ||
          doc.ingestion_status === IngestionStatus.ENRICHED
            ? 'filled'
            : 'disabled'
        }
        shape="slim"
        disabled={
          doc.ingestion_status !== IngestionStatus.SUCCESS &&
          doc.ingestion_status !== IngestionStatus.ENRICHED
        }
      >
        <FileSearch2 className="h-6 w-6" />
      </Button>
    </div>
  );

  const renderEntityActions = (entity: Entity) => (
    <div className="flex space-x-1 justify-end">
      <Button
        onClick={() => {
          setSelectedKGItem(entity);
          setSelectedKGType('entity');
          setIsKGDescriptionDialogOpen(true);
        }}
        color="filled"
        shape="slim"
      >
        <FileSearch2 className="h-6 w-6" />
      </Button>
    </div>
  );

  const renderCommunityActions = (community: Community) => (
    <div className="flex space-x-1 justify-end">
      <Button
        onClick={() => {
          setSelectedKGItem(community);
          setSelectedKGType('community');
          setIsKGDescriptionDialogOpen(true);
        }}
        color="filled"
        shape="slim"
      >
        <FileSearch2 className="h-6 w-6" />
      </Button>
    </div>
  );

  const renderTripleActions = (triple: Triple) => (
    <div className="flex space-x-1 justify-end">
      <Button
        onClick={() => {
          setSelectedKGItem(triple);
          setSelectedKGType('triple');
          setIsKGDescriptionDialogOpen(true);
        }}
        color="filled"
        shape="slim"
      >
        <FileSearch2 className="h-6 w-6" />
      </Button>
    </div>
  );

  const documentColumns: Column<DocumentInfoType>[] = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'id', label: 'Document ID', truncate: true, copyable: true },
    {
      key: 'ingestion_status',
      label: 'Ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending', 'enriched'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.ingestion_status === IngestionStatus.SUCCESS ||
            doc.ingestion_status === IngestionStatus.ENRICHED
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
  ];

  const userColumns: Column<User>[] = [
    { key: 'id', label: 'User ID', truncate: true, copyable: true },
    { key: 'email', label: 'Email', truncate: true, copyable: true },
  ];

  const entityColumns: Column<Entity>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', truncate: true },
    { key: 'extraction_ids', label: 'Extraction IDs', truncate: true },
    {
      key: 'document_id',
      label: 'Document ID',
      truncate: true,
      copyable: true,
    },
    { key: 'attributes', label: 'Attributes', truncate: true },
  ];

  const communityColumns: Column<Community>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'community_number', label: 'Community Number', sortable: true },
    { key: 'rating', label: 'Rating', sortable: true },
  ];

  const tripleColumns: Column<Triple>[] = [
    { key: 'subject', label: 'Subject', sortable: true },
    { key: 'predicate', label: 'Predicate', sortable: true },
    { key: 'object', label: 'Object', sortable: true },
  ];

  const renderUserActions = (user: User) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={user.id?.toString() || ''}
        collectionId={currentCollectionId}
        itemType="user"
        onSuccess={() => refetchData()}
        showToast={toast}
      />
    </div>
  );

  const handleAssignSuccess = () => {
    refetchData();
  };

  // Add key getters for each type
  const getEntityKey = (entity: Entity) => entity.extraction_ids[0] || '';
  const getCommunityKey = (community: Community) =>
    community.community_number.toString();
  const getTripleKey = (triple: Triple) =>
    `${triple.subject}-${triple.predicate}-${triple.object}`;

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

  return (
    <Layout
      pageTitle={`Collection ${currentCollectionId} Overview`}
      includeFooter={false}
    >
      <main className="flex flex-col container h-screen-[calc(100%-4rem)] mt-5 pb-4">
        {renderActionButtons()}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 mt-4 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="entities" className="flex items-center">
              <Contact className="w-4 h-4 mr-2" />
              Entities
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="triples" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Triples
            </TabsTrigger>
          </TabsList>
          <TabsContent value="documents" className="flex-1 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              {/* Search Input */}
              <div className="flex-grow mx-4">
                <Input
                  placeholder="Search by Title or Document ID"
                  value={searchQuery}
                  onChange={(e) => {
                    handleSearchQueryChange(e.target.value);
                  }}
                />
              </div>
            </div>
            <Table
              data={filteredDocuments}
              columns={documentColumns}
              itemsPerPage={itemsPerPage}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              selectedItems={selectedDocumentIds}
              actions={renderDocumentActions}
              initialSort={{ key: 'title', order: 'asc' }}
              initialFilters={filters}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              loading={isLoading}
              showPagination={true}
              filters={filters} // Add this line
              onFilter={handleFiltersChange}
            />
          </TabsContent>
          <TabsContent value="users" className="flex-1 overflow-auto">
            <Table
              data={users}
              columns={userColumns}
              itemsPerPage={itemsPerPage}
              onSelectAll={() => {}}
              onSelectItem={() => {}}
              selectedItems={[]}
              actions={renderUserActions}
              initialSort={{ key: 'id', order: 'asc' }}
              initialFilters={{}}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              loading={isLoading}
              showPagination={true}
            />
          </TabsContent>
          <TabsContent value="entities" className="flex-1 overflow-auto">
            <Table
              data={entities}
              columns={entityColumns}
              itemsPerPage={itemsPerPage}
              actions={renderEntityActions}
              onSelectAll={() => {}}
              onSelectItem={() => {}}
              selectedItems={[]}
              initialSort={{ key: 'name', order: 'asc' }}
              initialFilters={{}}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              loading={isLoading}
              showPagination={true}
              getRowKey={getEntityKey}
            />
          </TabsContent>
          <TabsContent value="communities" className="flex-1 overflow-auto">
            <Table
              data={communities}
              columns={communityColumns}
              itemsPerPage={itemsPerPage}
              actions={renderCommunityActions}
              onSelectAll={() => {}}
              onSelectItem={() => {}}
              selectedItems={[]}
              initialSort={{ key: 'name', order: 'asc' }}
              initialFilters={{}}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              loading={isLoading}
              showPagination={true}
              getRowKey={getCommunityKey}
            />
          </TabsContent>
          <TabsContent value="triples" className="flex-1 overflow-auto">
            <Table
              data={triples}
              columns={tripleColumns}
              itemsPerPage={itemsPerPage}
              actions={renderTripleActions}
              onSelectAll={() => {}}
              onSelectItem={() => {}}
              selectedItems={[]}
              initialSort={{ key: 'subject', order: 'asc' }}
              initialFilters={{}}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              loading={isLoading}
              showPagination={true}
              getRowKey={getTripleKey}
            />
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
        onClose={() => {
          setIsDocumentInfoDialogOpen(false);
          setSelectedDocumentId('');
        }}
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
      <KGDescriptionDialog
        open={isKGDescriptionDialogOpen}
        onClose={() => setIsKGDescriptionDialogOpen(false)}
        item={selectedKGItem}
        type={selectedKGType}
      />
    </Layout>
  );
};

export default CollectionIdPage;
