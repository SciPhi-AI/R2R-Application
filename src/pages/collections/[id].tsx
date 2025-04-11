import { Loader, FileSearch2, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import {
  CollectionResponse,
  CommunityResponse,
  DocumentResponse,
  EntityResponse,
  RelationshipResponse,
  User,
} from 'r2r-js/dist/types';
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { RemoveButton } from '@/components/ChatDemo/remove';
import Table, { Column } from '@/components/ChatDemo/Table';
import CollectionDialog from '@/components/ChatDemo/utils/collectionDialog';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import KnowledgeGraph from '@/components/knowledgeGraph';
import KnowledgeGraphD3 from '@/components/knowledgeGraphD3';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { IngestionStatus, KGExtractionStatus } from '@/types';

const PAGE_SIZE = 100;
const ITEMS_PER_PAGE = 10;

const CollectionIdPage: React.FC = () => {
  const router = useRouter();
  const { getClient } = useUserContext();

  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const [collection, setCollection] = useState<CollectionResponse | null>(null);

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [totalDocumentEntries, setTotalDocumentEntries] = useState<number>(0);

  const [users, setUsers] = useState<User[]>([]);
  const [totalUserEntries, setTotalUserEntries] = useState<number>(0);

  const [entities, setEntities] = useState<EntityResponse[]>([]);
  const [totalEntityEntries, setTotalEntityEntries] = useState<number>(0);

  const [relationships, setRelationships] = useState<RelationshipResponse[]>(
    []
  );
  const [totalRelationshipEntries, setTotalRelationshipEntries] =
    useState<number>(0);

  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [totalCommunityEntries, setTotalCommunityEntries] = useState<number>(0);

  const [nodeLimit, setNodeLimit] = useState<number>(250);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    documents: 1,
    users: 1,
    entities: 1,
    relationships: 1,
    communities: 1,
  });
  const [activeTab, setActiveTab] = useState('documents');
  const itemsPerPage = ITEMS_PER_PAGE;

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    ingestionStatus: ['success', 'failed', 'pending'],
    extractionStatus: ['success', 'failed', 'pending', 'processing'],
  });

  const currentCollectionId =
    typeof router.query.id === 'string' ? router.query.id : '';

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const width = graphContainerRef.current.offsetWidth;
        const height = graphContainerRef.current.offsetHeight;
        setContainerDimensions({
          width,
          height,
        });
      }
    };

    updateDimensions();

    // Small delay to ensure the tab content is rendered
    const timeoutId = setTimeout(updateDimensions, 100);

    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeoutId);
    };
  }, [activeTab]);

  const fetchCollection = useCallback(async () => {
    if (!currentCollectionId) {
      return;
    }

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const collection = await client.collections.retrieve({
        id: currentCollectionId,
      });

      setCollection(collection.results);
    } catch (error) {
      console.error('Error fetching collection:', error);
    }
  }, [currentCollectionId, getClient]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  /*** Fetching Documents in Batches ***/
  const fetchAllDocuments = useCallback(async () => {
    if (!currentCollectionId) {
      return;
    }

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allDocs: DocumentResponse[] = [];
      let totalDocumentEntries = 0;

      // Fetch first batch
      const firstBatch = await client.collections.listDocuments({
        id: currentCollectionId,
        offset: offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        totalDocumentEntries = firstBatch.totalEntries;
        setTotalDocumentEntries(totalDocumentEntries);

        allDocs = firstBatch.results;
        setDocuments(allDocs);

        // Set loading to false after the first batch is fetched
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      offset += PAGE_SIZE;

      // Continue fetching in the background
      while (offset < totalDocumentEntries) {
        const batch = await client.collections.listDocuments({
          id: currentCollectionId,
          offset: offset,
          limit: PAGE_SIZE,
        });

        if (batch.results.length === 0) {
          break;
        }

        allDocs = allDocs.concat(batch.results);
        setDocuments([...allDocs]);

        offset += PAGE_SIZE;
      }

      setDocuments(allDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  }, [currentCollectionId, getClient]);

  useEffect(() => {
    fetchAllDocuments();
  }, [fetchAllDocuments]);

  /*** Fetching Users in Batches ***/
  const fetchAllUsers = useCallback(async () => {
    if (!currentCollectionId) {
      return;
    }

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allUsers: User[] = [];
      let totalUserEntries = 0;

      // Fetch first batch
      const firstBatch = await client.collections.listUsers({
        id: currentCollectionId,
        offset: offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        totalUserEntries = firstBatch.totalEntries;
        setTotalUserEntries(totalUserEntries);

        allUsers = firstBatch.results;
        setUsers(allUsers);

        // Set loading to false after the first batch is fetched
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      offset += PAGE_SIZE;

      // Continue fetching in the background
      while (offset < totalUserEntries) {
        const batch = await client.collections.listUsers({
          id: currentCollectionId,
          offset: offset,
          limit: PAGE_SIZE,
        });

        if (batch.results.length === 0) {
          break;
        }

        allUsers = allUsers.concat(batch.results);
        setUsers([...allUsers]);

        offset += PAGE_SIZE;
      }

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  }, [currentCollectionId, getClient]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  /*** Fetching Entities in Batches ***/
  const fetchAllEntities = useCallback(async () => {
    if (!currentCollectionId) {
      return;
    }

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allEntities: EntityResponse[] = [];
      let totalEntityEntries = 0;

      // Fetch first batch
      const firstBatch = await client.graphs.listEntities({
        collectionId: currentCollectionId,
        offset: offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        totalEntityEntries = firstBatch.totalEntries;
        setTotalEntityEntries(totalEntityEntries);

        allEntities = firstBatch.results;
        setEntities(allEntities);

        // Set loading to false after the first batch is fetched
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      offset += PAGE_SIZE;

      // Continue fetching in the background
      while (offset < totalEntityEntries) {
        const batch = await client.graphs.listEntities({
          collectionId: currentCollectionId,
          offset: offset,
          limit: PAGE_SIZE,
        });

        if (batch.results.length === 0) {
          break;
        }

        allEntities = allEntities.concat(batch.results);
        setEntities([...allEntities]);

        offset += PAGE_SIZE;
      }

      setEntities(allEntities);
    } catch (error) {
      console.error('Error fetching entities:', error);
      setLoading(false);
    }
  }, [currentCollectionId, getClient]);

  useEffect(() => {
    fetchAllEntities();
  }, [fetchAllEntities]);

  /*** Fetching Entities in Batches ***/
  const fetchAllRelationships = useCallback(async () => {
    if (!currentCollectionId) {
      return;
    }

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allRelationships: RelationshipResponse[] = [];
      let totalRelationshipEntries = 0;

      // Fetch first batch
      const firstBatch = await client.graphs.listRelationships({
        collectionId: currentCollectionId,
        offset: offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        totalRelationshipEntries = firstBatch.totalEntries;
        setTotalRelationshipEntries(totalRelationshipEntries);

        allRelationships = firstBatch.results;
        setRelationships(allRelationships);

        // Set loading to false after the first batch is fetched
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      offset += PAGE_SIZE;

      // Continue fetching in the background
      while (offset < totalRelationshipEntries) {
        const batch = await client.graphs.listRelationships({
          collectionId: currentCollectionId,
          offset: offset,
          limit: PAGE_SIZE,
        });

        if (batch.results.length === 0) {
          break;
        }

        allRelationships = allRelationships.concat(batch.results);
        setRelationships([...allRelationships]);

        offset += PAGE_SIZE;
      }

      setRelationships(allRelationships);
    } catch (error) {
      console.error('Error fetching entities:', error);
      setLoading(false);
    }
  }, [currentCollectionId, getClient]);

  useEffect(() => {
    fetchAllRelationships();
  }, [fetchAllRelationships]);

  /*** Fetching Entities in Batches ***/
  const fetchAllCommunities = useCallback(async () => {
    if (!currentCollectionId) {
      return;
    }

    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allCommunities: CommunityResponse[] = [];
      let totalCommunityEntries = 0;

      // Fetch first batch
      const firstBatch = await client.graphs.listCommunities({
        collectionId: currentCollectionId,
        offset: offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        totalCommunityEntries = firstBatch.totalEntries;
        setTotalCommunityEntries(totalCommunityEntries);

        allCommunities = firstBatch.results;
        setCommunities(allCommunities);

        // Set loading to false after the first batch is fetched
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      offset += PAGE_SIZE;

      // Continue fetching in the background
      while (offset < totalCommunityEntries) {
        const batch = await client.graphs.listCommunities({
          collectionId: currentCollectionId,
          offset: offset,
          limit: PAGE_SIZE,
        });

        if (batch.results.length === 0) {
          break;
        }

        allCommunities = allCommunities.concat(batch.results);
        setCommunities([...allCommunities]);

        offset += PAGE_SIZE;
      }

      setCommunities(allCommunities);
    } catch (error) {
      console.error('Error fetching entities:', error);
      setLoading(false);
    }
  }, [currentCollectionId, getClient]);

  useEffect(() => {
    fetchAllCommunities();
  }, [fetchAllCommunities]);

  const refetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAllDocuments(), fetchAllUsers()]);
    setSelectedDocumentIds([]);
  }, [fetchAllDocuments, fetchAllUsers]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { id } = router.query;
    if (typeof id === 'string') {
      refetchData();
    }
  }, [router.isReady, router.query.id, refetchData]);

  /*** Client-Side Filtering and Pagination ***/
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.length > 0 && Array.isArray(value)) {
        filtered = filtered.filter((doc) => {
          switch (key) {
            case 'ingestionStatus':
              return value.includes(doc.ingestionStatus);
            case 'extractionStatus':
              return value.includes(doc.extractionStatus);
            default:
              return true;
          }
        });
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

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, [activeTab]: page }));
  };

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, [activeTab]: 1 }));
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, [activeTab]: 1 }));
  };

  const renderActionButtons = () => {
    return (
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-white">{collection?.name}</h1>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              setIsCollectionDialogOpen(true);
            }}
            className={`pl-4 pr-4 py-2 px-4`}
            color="filled"
            shape="rounded"
            style={{ zIndex: 20 }}
          >
            <Settings className="mr-2 h-4 w-4 mt-1" />
            Manage
          </Button>
        </div>
      </div>
    );
  };

  const renderDocumentActions = (doc: DocumentResponse) => (
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
        color="text_gray"
        shape="slim"
        disabled={doc.ingestionStatus !== IngestionStatus.SUCCESS}
        tooltip="View Document Info"
      >
        <FileSearch2 className="h-6 w-6" />
      </Button>
    </div>
  );

  const documentColumns: Column<DocumentResponse>[] = [
    {
      key: 'title',
      label: 'Title',
      truncatedSubstring: true,
      sortable: true,
      copyable: true,
    },
    { key: 'id', label: 'Document ID', truncate: true, copyable: true },
    {
      key: 'ingestionStatus',
      label: 'Ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.ingestionStatus === IngestionStatus.SUCCESS
              ? 'success'
              : doc.ingestionStatus === IngestionStatus.FAILED
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.ingestionStatus}
        </Badge>
      ),
    },
    {
      key: 'extractionStatus',
      label: 'Extraction',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending', 'processing'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.extractionStatus === KGExtractionStatus.SUCCESS
              ? 'success'
              : doc.extractionStatus === KGExtractionStatus.FAILED
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.extractionStatus}
        </Badge>
      ),
      selected: false,
    },
  ];

  const userColumns: Column<User>[] = [
    { key: 'id', label: 'User ID', truncate: true, copyable: true },
    { key: 'email', label: 'Email', truncate: true, copyable: true },
  ];

  const entityColumns: Column<EntityResponse>[] = [
    { key: 'id', label: 'Entity ID', truncate: true, copyable: true },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Type' },
  ];

  const relationshipColumns: Column<RelationshipResponse>[] = [
    { key: 'id', label: 'Relationship ID', truncate: true, copyable: true },
    { key: 'subject', label: 'Subject' },
    { key: 'predicate', label: 'Predicate' },
    { key: 'object', label: 'Object' },
    { key: 'subjectId', label: 'Subject ID', truncate: true, copyable: true },
    { key: 'objectId', label: 'Object ID', truncate: true, copyable: true },
  ];

  const communityColumns: Column<CommunityResponse>[] = [
    { key: 'id', label: 'Community ID', truncate: true, copyable: true },
    { key: 'name', label: 'Name' },
    { key: 'summary', label: 'Summary' },
    { key: 'findings', label: 'Findings' },
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

  const renderEntityActions = (entity: EntityResponse) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={entity.id?.toString() || ''}
        collectionId={currentCollectionId}
        itemType="entity"
        onSuccess={() => refetchData()}
        showToast={toast}
      />
    </div>
  );

  const renderRelationshipActions = (relationship: RelationshipResponse) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={relationship.id?.toString() || ''}
        collectionId={currentCollectionId}
        itemType="relationship"
        onSuccess={() => refetchData()}
        showToast={toast}
      />
    </div>
  );

  const renderCommunityActions = (community: CommunityResponse) => (
    <div className="flex space-x-1 justify-end">
      <RemoveButton
        itemId={community.id?.toString() || ''}
        collectionId={currentCollectionId}
        itemType="community"
        onSuccess={() => refetchData()}
        showToast={toast}
      />
    </div>
  );

  if (loading) {
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="documents" className="flex items-center">
              Documents
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              Users
            </TabsTrigger>
            <TabsTrigger value="entities" className="flex items-center">
              Entities
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center">
              Relationships
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center">
              Communities
            </TabsTrigger>
            <TabsTrigger value="knowledgeGraph" className="flex items-center">
              Knowledge Graph
            </TabsTrigger>
            <TabsTrigger value="viewEntities" className="flex items-center">
              Explore
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
              currentPage={pagination['documents']}
              totalEntries={totalDocumentEntries}
              onPageChange={handlePageChange}
              loading={loading}
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
              currentPage={pagination['users']}
              totalEntries={totalUserEntries}
              onPageChange={handlePageChange}
              loading={loading}
              showPagination={true}
            />
          </TabsContent>
          <TabsContent value="entities" className="flex-1 overflow-auto">
            <Table
              data={entities}
              columns={entityColumns}
              itemsPerPage={itemsPerPage}
              onSelectAll={() => {}}
              onSelectItem={() => {}}
              selectedItems={[]}
              actions={renderEntityActions}
              initialSort={{ key: 'id', order: 'asc' }}
              initialFilters={{}}
              currentPage={pagination['entities']}
              totalEntries={totalEntityEntries}
              onPageChange={handlePageChange}
              loading={loading}
              showPagination={true}
            />
          </TabsContent>
          <TabsContent value="relationships" className="flex-1 overflow-auto">
            <Table
              data={relationships}
              columns={relationshipColumns}
              itemsPerPage={itemsPerPage}
              onSelectAll={() => {}}
              onSelectItem={() => {}}
              selectedItems={[]}
              actions={renderRelationshipActions}
              initialSort={{ key: 'id', order: 'asc' }}
              initialFilters={{}}
              currentPage={pagination['relationships']}
              totalEntries={totalRelationshipEntries}
              onPageChange={handlePageChange}
              loading={loading}
              showPagination={true}
            />
          </TabsContent>
          <TabsContent value="communities" className="flex-1 overflow-auto">
            <Table
              data={communities}
              columns={communityColumns}
              itemsPerPage={itemsPerPage}
              onSelectAll={() => {}}
              onSelectItem={() => {}}
              selectedItems={[]}
              actions={renderCommunityActions}
              initialSort={{ key: 'id', order: 'asc' }}
              initialFilters={{}}
              currentPage={pagination['communities']}
              totalEntries={totalCommunityEntries}
              onPageChange={handlePageChange}
              loading={loading}
              showPagination={true}
            />
          </TabsContent>
          <TabsContent value="knowledgeGraph" className="flex-1 overflow-auto">
            <div
              ref={graphContainerRef}
              className="w-full h-[550px] flex items-center justify-center"
            >
              {containerDimensions.width > 0 && (
                <KnowledgeGraphD3
                  entities={entities}
                  relationships={relationships}
                  width={containerDimensions.width}
                  height={containerDimensions.height}
                  maxNodes={nodeLimit}
                />
              )}
            </div>
          </TabsContent>
          <TabsContent value="viewEntities" className="flex-1 overflow-auto">
            <div
              ref={graphContainerRef}
              className="w-full h-[600px] flex items-center justify-center"
            >
              {containerDimensions.width > 0 && entities.length > 0 && (
                <KnowledgeGraph
                  entities={entities}
                  width={containerDimensions.width}
                  height={containerDimensions.height}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <DocumentInfoDialog
        id={selectedDocumentId}
        open={isDocumentInfoDialogOpen}
        onClose={() => {
          setIsDocumentInfoDialogOpen(false);
          setSelectedDocumentId('');
        }}
      />
      <CollectionDialog
        id={currentCollectionId}
        open={isCollectionDialogOpen}
        onClose={() => setIsCollectionDialogOpen(false)}
      />
    </Layout>
  );
};

export default CollectionIdPage;
