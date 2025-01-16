import {
  // Example icons – you can swap with your own
  AlertTriangleIcon,
  InfoIcon,
  FileSearch2,
  SlidersHorizontal,
  Loader,
  Plus,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/router';
import {
  CollectionResponse,
  DocumentResponse,
  EntityResponse,
  RelationshipResponse,
  CommunityResponse,
} from 'r2r-js/dist/types';
import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import ExtractButtonContainer from '@/components/ChatDemo/ExtractContainer';
import { RemoveButton } from '@/components/ChatDemo/remove';
import Table, { Column } from '@/components/ChatDemo/Table';
import AssignDocumentToCollectionDialog from '@/components/ChatDemo/utils/AssignDocumentToCollectionDialog';
import CollectionDialog from '@/components/ChatDemo/utils/collectionDialog';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import KnowledgeGraph from '@/components/knowledgeGraph';
import Layout from '@/components/Layout';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectLabel,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { IngestionStatus, KGExtractionStatus } from '@/types';

// You could create modals/dialogs for these steps as well
// Example function to show success or error toasts
function showToast(toast: any, title: string, description?: string) {
  toast({
    title,
    description,
  });
}

/**
 * MAIN PAGE COMPONENT
 */
const KnowledgeGraphsPage: React.FC = () => {
  const router = useRouter();
  const { getClient, authState } = useUserContext();
  const { toast } = useToast();

  console.log('authState =', authState);
  /****************************************
   * Local state
   ****************************************/
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // For the entire "Graph" we might have one or more collections
  // In a simpler scenario, you might show just one or let user pick from a list.
  // For demonstration, we’re just storing them in state.
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  // We also track documents, entities, relationships, communities
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  console.log('documents = ', documents);
  const [entities, setEntities] = useState<EntityResponse[]>([]);
  console.log('entities = ', entities);
  console.log('setEntities = ');
  const [relationships, setRelationships] = useState<RelationshipResponse[]>(
    []
  );
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);

  // For demos, we assume we load all items (like your existing approach)
  const PAGE_SIZE = 200; // you can adjust how many to fetch per batch

  /****************************************
   * UI states (dialogs, expansions, etc.)
   ****************************************/
  const [isAssignDocumentDialogOpen, setIsAssignDocumentDialogOpen] =
    useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);

  // For table selection
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [currentDocumentsPage, setCurrentDocumentsPage] = useState<number>(1);
  const [currentEntitiesPage, setCurrentEntitiesPage] = useState<number>(1);
  const [currentRelationshipsPage, setCurrentRelationshipsPage] =
    useState<number>(1);
  const [currentCommunitiesPage, setCurrentCommunitiesPage] =
    useState<number>(1);

  // Tab states
  const [activeTab, setActiveTab] = useState<
    'documents' | 'entities' | 'relationships' | 'communities' | 'explore'
  >('documents');

  // For searching documents
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, any>>({
    ingestionStatus: ['success', 'failed', 'pending', 'enriched'],
    extractionStatus: [
      'success',
      'failed',
      'pending',
      'processing',
      'enriched',
    ],
  });

  // Container size for the graph explorer
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  /****************************************
   * 1) Fetch collections
   ****************************************/
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const client = await getClient();
      if (!client) throw new Error('No authenticated client.');
      if (!authState?.userId) throw new Error('No authenticated user.');

      // Grab the user’s personal collections as an example
      const { results } = await client.users.listCollections({
        id: authState?.userId,
        offset: 0,
        limit: PAGE_SIZE,
      });

      setCollections(results);

      // Try to find a collection whose name is "Default"
      if (results.length > 0) {
        const defaultCollection = results.find(
          (col) => col.name.toLowerCase() === 'default'
        );
        if (defaultCollection) {
          setSelectedCollectionId(defaultCollection.id);
        } else {
          // Otherwise, select the first one as a fallback
          setSelectedCollectionId(results[0].id);
        }
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch collections.');
      console.error(err);
    }
  }, [getClient]);

  // const fetchCollections = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const client = await getClient();
  //     if (!client) throw new Error('No authenticated client.');

  //     // Grab the user’s personal collections as an example
  //     // const userId = client.users.userId || '';
  //     const { results, totalEntries } = await client.users.listCollections({
  //       id: authState?.userId,
  //       offset: 0,
  //       limit: PAGE_SIZE,
  //     });

  //     setCollections(results);

  //     if (results.length > 0) {
  //       // Optionally auto-select the first collection or let user choose
  //       setSelectedCollectionId(results[0].id);
  //     }

  //     setLoading(false);
  //   } catch (err) {
  //     setLoading(false);
  //     setError('Failed to fetch collections.');
  //     console.error(err);
  //   }
  // }, [getClient]);

  /****************************************
   * 2) Load data for the currently selected collection
   ****************************************/
  const fetchCollectionData = useCallback(
    async (collectionId: string) => {
      if (!collectionId) return;
      setLoading(true);
      setError(null);

      try {
        const client = await getClient();
        if (!client) throw new Error('No authenticated client');

        console.log('collectionId = ', collectionId);
        // 2a) Documents in collection
        let offset = 0;
        let fetchedDocs: DocumentResponse[] = [];
        const firstBatch = await client.collections.listDocuments({
          id: collectionId,
          offset,
          limit: PAGE_SIZE,
        });
        fetchedDocs = firstBatch.results;
        offset += PAGE_SIZE;
        while (offset < firstBatch.totalEntries) {
          const batch = await client.collections.listDocuments({
            id: collectionId,
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) break;
          fetchedDocs = fetchedDocs.concat(batch.results);
          offset += PAGE_SIZE;
        }
        console.log('fetchedDocs = ', fetchedDocs);
        setDocuments(fetchedDocs);

        // 2b) Entities
        offset = 0;
        let fetchedEntities: EntityResponse[] = [];
        const firstEntityBatch = await client.graphs.listEntities({
          collectionId,
          offset,
          limit: PAGE_SIZE,
        });
        fetchedEntities = firstEntityBatch.results;
        console.log('fetchedEntities = ', fetchedEntities);
        offset += PAGE_SIZE;
        while (offset < firstEntityBatch.totalEntries) {
          const batch = await client.graphs.listEntities({
            collectionId,
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) break;
          fetchedEntities = fetchedEntities.concat(batch.results);
          offset += PAGE_SIZE;
        }
        setEntities(fetchedEntities);

        // 2c) Relationships
        offset = 0;
        let fetchedRelationships: RelationshipResponse[] = [];
        const firstRelationBatch = await client.graphs.listRelationships({
          collectionId,
          offset,
          limit: PAGE_SIZE,
        });
        fetchedRelationships = firstRelationBatch.results;
        offset += PAGE_SIZE;
        while (offset < firstRelationBatch.totalEntries) {
          const batch = await client.graphs.listRelationships({
            collectionId,
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) break;
          fetchedRelationships = fetchedRelationships.concat(batch.results);
          offset += PAGE_SIZE;
        }
        setRelationships(fetchedRelationships);

        // 2d) Communities
        offset = 0;
        let fetchedCommunities: CommunityResponse[] = [];
        const firstCommBatch = await client.graphs.listCommunities({
          collectionId,
          offset,
          limit: PAGE_SIZE,
        });
        fetchedCommunities = firstCommBatch.results;
        offset += PAGE_SIZE;
        while (offset < firstCommBatch.totalEntries) {
          const batch = await client.graphs.listCommunities({
            collectionId,
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) break;
          fetchedCommunities = fetchedCommunities.concat(batch.results);
          offset += PAGE_SIZE;
        }
        setCommunities(fetchedCommunities);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching collection data', err);
        setError('Error while loading collection data.');
        setLoading(false);
      }
    },
    [getClient]
  );

  /****************************************
   * On first load, fetch user’s collections
   ****************************************/
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  /****************************************
   * Whenever selected collection changes,
   * fetch docs, entities, relationships, communities
   ****************************************/
  useEffect(() => {
    if (selectedCollectionId) {
      fetchCollectionData(selectedCollectionId);
    }
  }, [selectedCollectionId, fetchCollectionData]);

  /****************************************
   * For the "graph explorer" tab,
   * measure container to pass to <KnowledgeGraph />
   ****************************************/
  useEffect(() => {
    function measureGraphContainer() {
      if (!graphContainerRef.current) return;
      const width = graphContainerRef.current.offsetWidth;
      const height = graphContainerRef.current.offsetHeight;
      setContainerDimensions({ width, height });
    }

    // Re-measure on load and on resize
    measureGraphContainer();
    window.addEventListener('resize', measureGraphContainer);
    return () => window.removeEventListener('resize', measureGraphContainer);
  }, [activeTab]);

  /****************************************
   * Step Explanations / Helper Handlers
   ****************************************/

  /**
   *  (1) Extract Document
   *  Demonstrates how to run extraction on a single doc from the UI.
   */
  async function handleExtractDocument(docId: string) {
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) throw new Error('No authenticated client');

      // By default, run actual extraction:
      const resp = await client.documents.extract({
        id: docId,
        runType: 'run',
      });
      console.log('Extraction response => ', resp);

      showToast(
        toast,
        'Extraction started',
        'Check document’s extraction status shortly.'
      );
      // Re-fetch docs to update statuses
      await fetchCollectionData(selectedCollectionId);
    } catch (err: any) {
      console.error(err);
      showToast(toast, 'Extraction Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * (2) Assign Document(s) to Collection
   * You already have a modal to pick documents from the UI (like AssignDocumentToCollectionDialog).
   * In practice, you might do:
   *     client.collections.addDocuments({id: collectionId, documentIds: [...]})
   * or you can do it from the Documents page directly.
   */

  /**
   * (3) Pull (sync) docs into the graph
   * This ensures that the documents’ extracted entities & relationships
   * are copied into the collection’s knowledge graph tables.
   */
  async function handlePullGraph() {
    if (!selectedCollectionId) return;
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) throw new Error('No authenticated client');

      console.log(
        ' in `handlePullGraph` selectedCollectionId = ',
        selectedCollectionId
      );
      // console.log(' in `handlePullGraph` selectedCollectionId = ', selectedCollectionId)
      const resp = await client.graphs.pull({
        collectionId: selectedCollectionId,
      });
      console.log('Pull response => ', resp);

      showToast(
        toast,
        'Pull successful',
        'The graph is now synced with document knowledge.'
      );
      // Re-fetch data
      await fetchCollectionData(selectedCollectionId);
    } catch (err: any) {
      console.error(err);
      showToast(toast, 'Pull Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * (4) Build the graph (and optionally do community detection)
   * You can do `run_type: 'estimate'` or `'run'`.
   * By default, calling "build" with run_with_orchestration = true will
   * queue a background job that you can poll until it’s done.
   */
  async function handleBuildGraph() {
    if (!selectedCollectionId) return;
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) throw new Error('No authenticated client');

      // This is an example call to build communities:
      const resp = await client.graphs.buildCommunities({
        collectionId: selectedCollectionId,
        runWithOrchestration: true,
      });
      console.log('Build response => ', resp);

      showToast(
        toast,
        'Graph build queued',
        'Community detection and enrichment in progress.'
      );
      // Re-fetch data in a few seconds or poll
      await fetchCollectionData(selectedCollectionId);
    } catch (err: any) {
      console.error(err);
      showToast(toast, 'Graph Build Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  /****************************************
   * Filter + Search for Documents
   ****************************************/
  const filteredDocuments = useMemo(() => {
    let result = [...documents];
    // apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.length > 0 && Array.isArray(value)) {
        result = result.filter((doc) => {
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
    // apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.title?.toLowerCase().includes(q) ||
          doc.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [documents, filters, searchQuery]);
  console.log('filteredDocuments = ', filteredDocuments);
  /****************************************
   * Documents Table Config
   ****************************************/
  const documentColumns: Column<DocumentResponse>[] = [
    {
      key: 'title',
      label: 'Title',
      truncatedSubstring: true,
      copyable: true,
      headerTooltip: 'The title of the document',
    },
    {
      key: 'id',
      label: 'Document ID',
      truncate: true,
      copyable: true,
    },
    // {
    //   key: 'ingestionStatus',
    //   label: 'Ingestion',
    //   filterable: true,
    //   filterType: 'multiselect',
    //   filterOptions: ['success', 'failed', 'pending', 'enriched'],
    //   renderCell: (doc) => (
    //     <Badge
    //       variant={
    //         doc.ingestionStatus === IngestionStatus.SUCCESS ||
    //         doc.ingestionStatus === IngestionStatus.ENRICHED
    //           ? 'success'
    //           : doc.ingestionStatus === IngestionStatus.FAILED
    //           ? 'destructive'
    //           : 'pending'
    //       }
    //     >
    //       {doc.ingestionStatus}
    //     </Badge>
    //   ),
    // },
    {
      key: 'extractionStatus',
      label: 'Extraction Status',
      headerTooltip:
        'The status of the document extraction, which follows ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending', 'processing', 'enriched'],
      renderCell: (doc) => (
        <Badge
          variant={
            doc.extractionStatus === KGExtractionStatus.SUCCESS ||
            doc.extractionStatus === KGExtractionStatus.ENRICHED
              ? 'success'
              : doc.extractionStatus === KGExtractionStatus.FAILED
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.extractionStatus}
        </Badge>
      ),
    },
  ];

  // Document actions in the rightmost column
  const renderDocumentActions = (doc: DocumentResponse) => (
    <div className="flex space-x-2 justify-end">
      {/* Example: run extraction on this doc */}
      {/* <Button
        onClick={() => handleExtractDocument(doc.id)}
        color="text_gray"
        shape="slim"
        tooltip="Extract"
      >
        <SlidersHorizontal className="h-5 w-5" />
        
      </Button> */}
      <ExtractButtonContainer
        id={doc.id}
        ingestionStatus={doc.ingestionStatus}
        showToast={toast}
      />

      {/* Remove from the collection */}
      <RemoveButton
        itemId={doc.id}
        collectionId={selectedCollectionId}
        itemType="document"
        onSuccess={() => fetchCollectionData(selectedCollectionId)}
        showToast={toast}
      />
    </div>
  );

  /****************************************
   * Entities, Relationships, Communities – Table Config
   ****************************************/
  const entityColumns: Column<EntityResponse>[] = [
    { key: 'id', label: 'Entity ID', truncate: true },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description', truncatedSubstring: true },
  ];
  const relationshipColumns: Column<RelationshipResponse>[] = [
    { key: 'id', label: 'Relationship ID', truncate: true },
    { key: 'subject', label: 'Subject' },
    { key: 'predicate', label: 'Predicate' },
    { key: 'object', label: 'Object' },
    { key: 'description', label: 'Description', truncatedSubstring: true },
  ];
  const communityColumns: Column<CommunityResponse>[] = [
    { key: 'id', label: 'Community ID', truncate: true },
    { key: 'name', label: 'Name' },
    { key: 'summary', label: 'Summary' },
  ];

  /****************************************
   *  Render
   ****************************************/
  if (loading && !error) {
    return (
      <Layout pageTitle="Knowledge Graphs" includeFooter={false}>

      {/* left align */}
        <div className="mx-auto max-w-6xl pt-4 flex flex-col container h-screen-[calc(100%-4rem)] justify-center items-left">
          {/* Header + Quick Buttons */}
          {/* <div className="flex  mb-6"> */}
            <h1 className="text-2xl font-bold   gap-2 text-white -ml-1">
              Knowledge Graphs
              <a
                href="https://r2r-docs.sciphi.ai/api-and-sdks/graphs/graphs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex  text-accent-base"
              >
                <ExternalLink size={18} className="-mt-0.5 ml-1" />
              </a>
            </h1>
          </div>
        {/* </div> */}

        <div className="w-full flex flex-col container h-screen-[calc(100%-4rem)] justify-center items-center">

          <Loader className="animate-spin" size={64} />
          <p className="mt-4">Loading knowledge graph data...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout pageTitle="Knowledge Graphs" includeFooter={false}>
        <div className="w-full flex flex-col container h-screen-[calc(100%-4rem)] justify-center items-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  /****************************************
   * Render Page
   ****************************************/
  return (
    <Layout pageTitle="Knowledge Graphs" includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="pl-8 mx-auto max-w-6xl mt-4 mb-12">
          {/* Header + Quick Buttons */}

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              Knowledge Graphs
              <a
                href="https://r2r-docs.sciphi.ai/api-and-sdks/graphs/graphs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-accent-base"
              >
                <ExternalLink size={18} className="-mt-0.5" />
              </a>
            </h1>

            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setIsAssignDocumentDialogOpen(true)}
                color="filled"
                shape="outline_widest"
              >
                <Plus className="w-4 h-4 mr-1 mt-1" />
                Document
              </Button>
              <Button
                onClick={() => setIsCollectionDialogOpen(true)}
                color="light"
                shape="outline_widest"
              >
                <Settings className="w-4 h-4 mr-1 mt-1" />
                Settings
              </Button>
            </div>
          </div>

          {/* Explanation / Steps (Optional) */}
          <Alert className="mb-6 ">
            <div className="flex items-center text-accent-base pb-1">
              <InfoIcon className="h-4 w-4 mr-2 -mt-0.5" />
              <AlertTitle className="pt-1">How to Build a Graph</AlertTitle>
            </div>
            <AlertDescription>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>
                  <strong>Ingest</strong> or upload your documents in the
                  Documents tab (or from your Documents page).
                </li>
                <li>
                  <strong>Extract</strong> each document using the{' '}
                  <em>Extract</em> button, which identifies entities &amp;
                  relationships.
                </li>
                <li>
                  <strong>Assign</strong> these documents to a Collection{' '}
                  <em>(by default, all documents are added to `Default`)</em>.
                </li>
                <li>
                  <strong>Pull</strong> the extracted data into your graph by
                  clicking <em>Pull Graph</em> below.
                </li>
                <li>
                  <strong>Build</strong> communities or run advanced graph
                  operations using <em>Build Graph</em> below.
                </li>
              </ol>
            </AlertDescription>
          </Alert>
          <Alert variant="default">
            <div className="flex items-center text-red-400">
              {/* <Rocket className="h-4 w-4 mr-2  -mt-1  text-accent-base" /> */}
              <AlertTriangleIcon className="h-5 w-5 mr-2 -mt-2" />
              <AlertTitle>
                SciPhi Knowledge Graphs are still under development. Please
                report any issues you encounter.
              </AlertTitle>
            </div>
          </Alert>

          <div className="mb-6 flex items-center gap-2 mt-6 pl-2">
            {/* Only show if user has multiple collections */}
            {/* {collections.length > 1 && (
            <>
              <label className="text-white mr-2">Select Collection:</label>
              <select
                className="border border-gray-300 rounded p-2"
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({col.id})
                  </option>
                ))}
              </select>
            </>
          )} */}
            {collections.length > 1 && (
              <>
                <Select
                  value={selectedCollectionId}
                  onValueChange={(val) => setSelectedCollectionId(val)}
                >
                  <SelectTrigger id="collection-select" className="w-[200px]">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name} ({col.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handlePullGraph} color="filled">
                    Pull Graph
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {
                    'Pulls latest document entities and relationships for this collection'
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleBuildGraph} color="filled">
                    Build Graph
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {'Rebuilds the communities for this collection'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Tabs for each area */}
          <Tabs
            value={activeTab}
            onValueChange={
              // @ts-expect-error Tab value type mismatch
              (val) => setActiveTab(val)
            }
          >
            <TabsList className="grid w-full grid-cols-6">
              {/* <TabsTrigger value="overview">Overview</TabsTrigger> */}
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="entities">Entities</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="communities">Communities</TabsTrigger>
              {/* <TabsTrigger value="explore">Explorer</TabsTrigger> */}
            </TabsList>

            {/* 1) Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              <Alert>
                <AlertTriangleIcon className="h-4 w-4 mt-0.5 text-accent-base" />
                <AlertTitle>Graph Overview</AlertTitle>
                <AlertDescription>
                  <p>
                    Here you can find a high-level summary of your graph, see
                    how many documents are in it, how many entities and
                    relationships you have, and kick off bigger operations like
                    community detection or further enrichment.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Show quick stats for doc, entity, relationship counts, etc. */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-800 p-4 rounded">
                  <h3 className="text-white text-lg">Documents in Graph</h3>
                  <p className="text-2xl font-bold text-accent-base">
                    {documents.length}
                  </p>
                </div>
                <div className="bg-zinc-800 p-4 rounded">
                  <h3 className="text-white text-lg">Entities</h3>
                  <p className="text-2xl font-bold text-accent-base">
                    {entities.length}
                  </p>
                </div>
                <div className="bg-zinc-800 p-4 rounded">
                  <h3 className="text-white text-lg">Relationships</h3>
                  <p className="text-2xl font-bold text-accent-base">
                    {relationships.length}
                  </p>
                </div>
                <div className="bg-zinc-800 p-4 rounded">
                  <h3 className="text-white text-lg">Communities</h3>
                  <p className="text-2xl font-bold text-accent-base">
                    {communities.length}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* 2) Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder="Search by Title or Document ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow"
                />
              </div>

              <Table<DocumentResponse>
                loading={loading}
                data={filteredDocuments}
                columns={documentColumns}
                actions={renderDocumentActions}
                // selection
                onSelectAll={(selected) => {
                  if (selected) {
                    setSelectedDocumentIds(filteredDocuments.map((d) => d.id));
                  } else {
                    setSelectedDocumentIds([]);
                  }
                }}
                onSelectItem={(id, isSelected) => {
                  setSelectedDocumentIds((prev) =>
                    isSelected ? [...prev, id] : prev.filter((x) => x !== id)
                  );
                }}
                selectedItems={selectedDocumentIds}
                // Sort & Filter
                initialSort={{ key: 'title', order: 'asc' }}
                initialFilters={filters}
                onFilter={(newFilters) => setFilters(newFilters)}
                itemsPerPage={10}
                // If you want pagination from server, you'd do so here
                showPagination={true}
                currentPage={currentDocumentsPage}
                onPageChange={(page) => setCurrentDocumentsPage(page)}
                emptyTableText={
                  'No data available, try ingesting a document first.'
                }
              />
            </TabsContent>

            {/* 3) Entities Tab */}
            <TabsContent value="entities" className="mt-4">
              <Table<EntityResponse>
                loading={loading}
                data={entities}
                columns={entityColumns}
                itemsPerPage={10}
                showPagination={true}
                // If you want to support removing/editing entities, define actions:
                actions={(entity: EntityResponse) => (
                  <div className="flex space-x-2 justify-end">
                    <RemoveButton
                      itemId={entity.id}
                      collectionId={selectedCollectionId}
                      itemType="entity"
                      onSuccess={() =>
                        fetchCollectionData(selectedCollectionId)
                      }
                      showToast={toast}
                    />
                  </div>
                )}
                currentPage={currentEntitiesPage}
                onPageChange={(page) => setCurrentEntitiesPage(page)}
                emptyTableText={
                  'No data available, try clicking "Sync Graph" above after ingesting and extracting a document.'
                }
              />
            </TabsContent>

            {/* 4) Relationships Tab */}
            <TabsContent value="relationships" className="mt-4">
              <Table<RelationshipResponse>
                loading={loading}
                data={relationships}
                columns={relationshipColumns}
                itemsPerPage={10}
                showPagination={true}
                actions={(rel: RelationshipResponse) => (
                  <div className="flex space-x-2 justify-end">
                    <RemoveButton
                      itemId={rel.id}
                      collectionId={selectedCollectionId}
                      itemType="relationship"
                      onSuccess={() =>
                        fetchCollectionData(selectedCollectionId)
                      }
                      showToast={toast}
                    />
                  </div>
                )}
                emptyTableText={
                  'No data available, try clicking "Sync Graph" above after ingesting and extracting a document.'
                }
                currentPage={currentRelationshipsPage}
                onPageChange={(page) => setCurrentRelationshipsPage(page)}
              />
            </TabsContent>

            {/* 5) Communities Tab */}
            <TabsContent value="communities" className="mt-4">
              <Table<CommunityResponse>
                loading={loading}
                data={communities}
                columns={communityColumns}
                itemsPerPage={10}
                showPagination={true}
                actions={(community: CommunityResponse) => (
                  <div className="flex space-x-2 justify-end">
                    <RemoveButton
                      itemId={community.id}
                      collectionId={selectedCollectionId}
                      itemType="community"
                      onSuccess={() =>
                        fetchCollectionData(selectedCollectionId)
                      }
                      showToast={toast}
                    />
                  </div>
                )}
                currentPage={currentCommunitiesPage}
                onPageChange={(page) => setCurrentCommunitiesPage(page)}
                emptyTableText={
                  'No data available, try clicking "Build Graph" above after successfully syncing entities and relationships.'
                }
              />
            </TabsContent>

            {/* 6) Graph Explorer / Visualization */}
            <TabsContent value="explore" className="mt-4">
              <div
                ref={graphContainerRef}
                className="w-full h-[600px] border border-zinc-700 rounded"
              >
                {/* If you have any custom logic for converting Entities/Relationships into nodes + edges, do it in <KnowledgeGraph /> */}
                {(containerDimensions.width > 0 ||
                  containerDimensions.height > 0) && (
                  <KnowledgeGraph
                    entities={entities}
                    width={containerDimensions.width}
                    height={containerDimensions.height}
                    // You can also pass relationships if you want
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/** Assign Documents to Collection Dialog */}
        <AssignDocumentToCollectionDialog
          open={isAssignDocumentDialogOpen}
          onClose={() => setIsAssignDocumentDialogOpen(false)}
          collection_id={selectedCollectionId}
          onAssignSuccess={() => fetchCollectionData(selectedCollectionId)}
        />

        {/** View / Edit Collection Settings */}
        <CollectionDialog
          id={selectedCollectionId}
          open={isCollectionDialogOpen}
          onClose={() => setIsCollectionDialogOpen(false)}
        />

        {/** Document Info Dialog */}
        <DocumentInfoDialog
          id={selectedDocumentId}
          open={isDocumentInfoDialogOpen}
          onClose={() => {
            setIsDocumentInfoDialogOpen(false);
            setSelectedDocumentId('');
          }}
        />
      </main>
    </Layout>
  );
};

export default KnowledgeGraphsPage;
