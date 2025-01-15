import { ExternalLink, Loader } from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React, { useState, useCallback, useEffect, useMemo } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import { IngestionStatus } from '@/types';

const PAGE_SIZE = 1000;
const ITEMS_PER_PAGE = 10;

const Index: React.FC = () => {
  const { pipeline, getClient, authState } = useUserContext();

  // ------------------ NEW STATES HERE ------------------
  // Distinguish between the very first load vs. subsequent refetches
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    title: true,
    id: true,
    ownerId: true,
    collectionIds: false,
    ingestionStatus: true,
    extractionStatus: true,
    documentType: false,
    metadata: false,
    version: false,
    createdAt: true,
    updatedAt: false,
  });

  // New states for filters and search query
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    ingestionStatus: ['success', 'failed', 'pending', 'enriched'],
    extractionStatus: ['success', 'failed', 'pending'],
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  /*** Fetching Documents in Batches ***/
  const fetchAllDocuments = useCallback(async () => {
    try {
      // If we have no data yet, it's the initial load
      if (documents.length === 0) {
        setInitialLoad(true);
      } else {
        // We do have some data, so this is a "refetch"
        setIsRefetching(true);
      }

      setLoading(true);

      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allDocs: DocumentResponse[] = [];
      let totalCount = 0;

      // Fetch first batch
      const firstBatch = await client.documents.list({
        offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        totalCount = firstBatch.totalEntries;
        setTotalEntries(totalCount);

        allDocs = firstBatch.results;
        setDocuments(allDocs);

        offset += PAGE_SIZE;
      } else {
        // If no documents at all, update state and return
        setDocuments([]);
        setLoading(false);
        setInitialLoad(false);
        setIsRefetching(false);
        return;
      }

      // Continue fetching in the background if needed
      while (offset < totalCount) {
        const batch = await client.documents.list({
          offset,
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
    } finally {
      setLoading(false);
      setInitialLoad(false);
      setIsRefetching(false);
    }
  }, [documents.length, pipeline?.deploymentUrl, getClient]);

  const refetchDocuments = useCallback(async () => {
    await fetchAllDocuments();
    setSelectedDocumentIds([]);
  }, [fetchAllDocuments]);

  // Delay initial fetch by 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllDocuments();
    }, 1000); // Wait 1s before the first fetch

    return () => clearTimeout(timer);
  }, [fetchAllDocuments]);

  /*** Monitor Documents for Pending Status ***/
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Identify documents that are not SUCCESS, ENRICHED, or FAILED
    const pending = documents.filter(
      (doc) =>
        (doc.ingestionStatus !== IngestionStatus.SUCCESS &&
          doc.ingestionStatus !== IngestionStatus.ENRICHED &&
          doc.ingestionStatus !== IngestionStatus.FAILED) ||
        (doc.extractionStatus !== IngestionStatus.SUCCESS &&
          doc.extractionStatus !== IngestionStatus.ENRICHED &&
          doc.extractionStatus !== IngestionStatus.FAILED)
    );
    setPendingDocuments(pending.map((doc) => doc.id));

    // 2) Poll if we still have pending documents
    if (pending.length > 0) {
      const pollInterval = setInterval(() => {
        if (!authState.isAuthenticated) return;
        fetchAllDocuments();
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [documents, fetchAllDocuments, authState.isAuthenticated]);

  /*** Client-Side Filtering ***/
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value &&
        value.length > 0 &&
        (key === 'ingestionStatus' || key === 'extractionStatus')
      ) {
        filtered = filtered.filter((doc) => {
          const status = doc[key];
          return Array.isArray(value) && value.includes(status);
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

  /*** Handle Selection ***/
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

  /*** Handle Filters and Search ***/
  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  /*** Handle Column Visibility ***/
  const handleToggleColumn = useCallback(
    (columnKey: string, isVisible: boolean) => {
      setVisibleColumns((prev) => ({ ...prev, [columnKey]: isVisible }));
    },
    []
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Layout pageTitle="Documents" includeFooter={false}>
        <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
          <div className="relative flex-grow bg-zinc-900 pl-10">
            {initialLoad && documents.length === 0 ? (
              // Large spinner if we truly have no data yet
              <div className="flex justify-center items-center mt-12">
                <Loader className="animate-spin" size={64} />
              </div>
            ) : (
              // Once we have data (or at least tried once), show the table
              <div className="mx-auto max-w-6xl mb-12 p-4 h-full">
                <h1
                  className={
                    'text-2xl font-bold text-white flex items-center gap-2 mb-4' +
                    (loading ? ' -ml-1' : '')
                  }
                >
                  Documents
                  <a
                    href="https://r2r-docs.sciphi.ai/api-and-sdks/collections/collections"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center hover:text-blue-400 text-gray-400"
                    title="View Collections Documentation"
                  >
                    <ExternalLink size={18} className="text-accent-base -mt-0.5" />
                  </a>
                </h1>

                <DocumentsTable
                  documents={filteredDocuments}
                  loading={loading}
                  isRefetching={isRefetching}
                  onRefresh={refetchDocuments}
                  pendingDocuments={pendingDocuments}
                  setPendingDocuments={setPendingDocuments}
                  onSelectAll={handleSelectAll}
                  onSelectItem={handleSelectItem}
                  selectedItems={selectedDocumentIds}
                  visibleColumns={visibleColumns}
                  onToggleColumn={handleToggleColumn}
                  totalEntries={totalEntries}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  itemsPerPage={ITEMS_PER_PAGE}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  searchQuery={searchQuery}
                  onSearchQueryChange={handleSearchQueryChange}
                />
              </div>
            )}
          </div>
        </main>
      </Layout>
    </>
  );
};

export default Index;

// import { Clipboard, Check, ExternalLink } from 'lucide-react';
// import { FileText, Boxes, MessageCircle, ScanSearch, GitGraph } from 'lucide-react';
// import { PlusCircle, Trash2 } from 'lucide-react';
// import { Rocket, Star } from 'lucide-react';
// import Link from 'next/link';
// import { useRouter } from 'next/router';
// import { User } from 'r2r-js';
// import { useState, useEffect, useCallback } from 'react';
// import { ReactTyped } from 'react-typed';

// import Layout from '@/components/Layout';
// import { Logo } from '@/components/shared/Logo';
// import {
//   CardTitle,
//   CardHeader,
//   CardContent,
//   AdvancedCard,
// } from '@/components/ui/AdvancedCard';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { Button } from '@/components/ui/Button';
// import {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog'; // <--- Adjust path or component as needed
// import { Progress } from '@/components/ui/progress';
// import { useToast } from '@/components/ui/use-toast';
// import { useUserContext } from '@/context/UserContext';

// // ------- IMPORT YOUR DIALOG/MODAL COMPONENTS HERE -------

// const HomePage = () => {
//   const router = useRouter();
//   const { isAuthenticated, authState, getClient } = useUserContext();
//   const [limits, setLimits] = useState<any>(null);

//   console.log(' limits = ', limits);
//   const [isLoadingLimits, setIsLoadingLimits] = useState(false);
//   const [isLoadingUser, setLoadingUser] = useState(true);
//   const [apiKeys, setApiKeys] = useState<[] | null>(null);
//   console.log('apiKeys = ', apiKeys);
//   const [userProfile, setUserProfile] = useState<User | null>(null);
//   const { toast } = useToast();

//   // State to manage Create Key modal
//   const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
//   // Fields for the new API key
//   const [newApiKeyName, setNewApiKeyName] = useState('');
//   const [newApiKeyDescription, setNewApiKeyDescription] = useState('');

//   // Redirect if user is not authenticated
//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.push('/auth/login');
//     } else {
//       // Fetch the user's limit usage once they are authenticated
//       fetchLimits();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isAuthenticated]);

//   // async function fetchLimits() {
//   //   try {
//   //     setIsLoadingLimits(true);
//   //     const client: any = await getClient();
//   //     const result = await client.users.getLimits({ id: authState.userId });
//   //     setLimits(result.results);
//   //   } catch (error) {
//   //     console.error('Failed to fetch user limits:', error);
//   //   } finally {
//   //     setIsLoadingLimits(false);
//   //   }
//   // }
//   function copyToClipboard(text: string) {
//     if (navigator?.clipboard?.writeText) {
//       navigator.clipboard.writeText(text);
//     } else {
//       document.execCommand('copy', true, text);
//     }
//   }
//   const [hasCopied, setHasCopied] = useState(false);

//   const handleCopy = (text: string) => {
//     copyToClipboard(text);
//     setHasCopied(true);
//     console.log('set has copied true');
//     // setTimeout(() => setHasCopied(false), 2000); // Reset after 2 seconds
//   };

//   async function fetchLimits() {
//     try {
//       setIsLoadingLimits(true);
//       const client: any = await getClient();
//       const result = await client.users.getLimits({ id: authState.userId });
//       const limitsData = result.results;
//       console.log('limitsData = ', limitsData);

//       // Extract limits for Search and RAG
//       const searchLimits = limitsData.usage.routes['/v3/retrieval/search'];
//       console.log('searchLimits = ', searchLimits);
//       const ragLimits = limitsData.usage.routes['/v3/retrieval/rag'];
//       const agentLimits = limitsData.usage.routes['/v3/retrieval/agent'];

//       setLimits({
//         chunks: limitsData.storageLimits.chunks,
//         documents: limitsData.storageLimits.documents,
//         agent: {
//           routePerMin: agentLimits?.routePerMin?.limit || 0,
//           routePerMinUsed: agentLimits?.routePerMin?.used || 0,
//           routePerMinRemaining: agentLimits?.routePerMin?.remaining || 0,
//           monthlyLimit: agentLimits?.monthlyLimit?.limit || 0,
//           monthlyUsed: agentLimits?.monthlyLimit?.used || 0,
//           monthlyRemaining: agentLimits?.monthlyLimit?.remaining || 0,
//         },
//         search: {
//           routePerMin: searchLimits?.routePerMin?.limit || 0,
//           routePerMinUsed: searchLimits?.routePerMin?.used || 0,
//           routePerMinRemaining: searchLimits?.routePerMin?.remaining || 0,
//           monthlyLimit: searchLimits?.monthlyLimit?.limit || 0,
//           monthlyUsed: searchLimits?.monthlyLimit?.used || 0,
//           monthlyRemaining: searchLimits?.monthlyLimit?.remaining || 0,
//         },
//         rag: {
//           routePerMin: ragLimits?.routePerMin?.limit || 0,
//           routePerMinUsed: ragLimits?.routePerMin?.used || 0,
//           routePerMinRemaining: ragLimits?.routePerMin?.remaining || 0,
//           monthlyLimit: ragLimits?.monthlyLimit?.limit || 0,
//           monthlyUsed: ragLimits?.monthlyLimit?.used || 0,
//           monthlyRemaining: ragLimits?.monthlyLimit?.remaining || 0,
//         },
//       });
//     } catch (error) {
//       console.error('Failed to fetch user limits:', error);
//     } finally {
//       setIsLoadingLimits(false);
//     }
//   }

//   const fetchUserAccount = useCallback(async () => {
//     try {
//       setLoadingUser(true);
//       const client: any = await getClient();
//       if (!client) {
//         throw new Error('Failed to get authenticated client');
//       }

//       const user = await client.users.me();
//       setUserProfile(user.results);
//       setLoadingUser(false);
//     } catch (error) {
//       console.error('Error fetching user:', error);
//       setLoadingUser(false);
//     }
//   }, [getClient]);

//   // Fetch the user's API keys
//   const fetchApiKeys = useCallback(async () => {
//     if (!userProfile) return;
//     try {
//       const client: any = await getClient();
//       if (!client) {
//         throw new Error('Failed to get authenticated client');
//       }
//       const keysResp: any = await client.users.listApiKeys({
//         id: userProfile.id,
//       });
//       setApiKeys(keysResp.results);
//     } catch (error) {
//       console.error('Error fetching API keys:', error);
//     }
//   }, [getClient, userProfile]);

//   // Combined effect for user & keys
//   useEffect(() => {
//     fetchUserAccount();
//   }, [fetchUserAccount]);

//   // Once userProfile is loaded, fetch keys
//   useEffect(() => {
//     if (userProfile?.id) {
//       fetchApiKeys();
//     }
//   }, [userProfile, fetchApiKeys]);

//   // -------------------------------------------------
//   // Handler for creating a new API key (called by modal)
//   // -------------------------------------------------
//   const handleCreateApiKey = async () => {
//     try {
//       if (!userProfile) return;
//       const client: any = await getClient();

//       // Create the API key with the user-entered name/description
//       const resp: any = await client.users.createApiKey({
//         id: userProfile.id,
//         name: newApiKeyName,
//         description: newApiKeyDescription,
//       });
//       const { publicKey, apiKey } = resp.results;

//       // Display the new keys in a toast
//       toast({
//         variant: 'default',
//         title: 'API Key Created',
//         description: (
//           <div className="space-y-4 max-w-full">
//             <div>
//               <p className="font-semibold">Name:</p>
//               <p className="text-sm">{newApiKeyName}</p>
//             </div>
//             <div>
//               <p className="font-semibold">Description:</p>
//               <p className="text-sm">{newApiKeyDescription}</p>
//             </div>
//             <div>
//               <p className="font-semibold">Public Key:</p>
//               <textarea
//                 readOnly
//                 value={publicKey}
//                 className="w-full mt-1 bg-zinc-800 text-white p-2 rounded resize-none focus:outline-none"
//                 rows={2}
//                 onFocus={(e) => e.target.select()}
//               />
//             </div>
//             <div>
//               <div className="w-full">
//                 <p className="text-sm font-semibold">
//                   Your new API Key (formatted `pk_....sk_...`):
//                 </p>
//                 <div className="relative w-full">
//                   <textarea
//                     readOnly
//                     value={apiKey}
//                     className="w-full bg-zinc-800 text-white p-2 rounded resize-none focus:outline-none pr-10"
//                     rows={4}
//                   />
//                   <button
//                     onClick={() => handleCopy(apiKey)}
//                     className={`absolute right-2 top-2 inline-flex items-center justify-center rounded-md border
//                  px-2 py-1 text-sm font-medium transition-colors duration-200 
//                  ${hasCopied ? 'bg-green-600 text-white' : 'bg-transparent hover:bg-secondary'}`}
//                   >
//                     {hasCopied ? (
//                       <span className="flex items-center">
//                         <Check className="w-4 h-4 mr-1" />
//                       </span>
//                     ) : (
//                       <Clipboard className="w-4 h-4" />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ),
//         duration: 20000, // Increase duration for easier copying
//       });

//       // Clear modal fields
//       setNewApiKeyName('');
//       setNewApiKeyDescription('');
//       // Close modal
//       setIsCreateKeyModalOpen(false);

//       // Re-fetch the list of keys
//       fetchApiKeys();
//     } catch (error) {
//       console.error('Error creating API key:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Error Creating API Key',
//         description: String(error),
//       });
//     }
//   };

//   // Delete an API key
//   const handleDeleteApiKey = async (keyId: string) => {
//     try {
//       if (!userProfile) return;
//       const client: any = await getClient();
//       await client.users.deleteApiKey({ id: userProfile.id, keyId });

//       toast({
//         variant: 'success',
//         title: 'API Key Deleted',
//         description: 'The API key was successfully removed.',
//       });

//       // Refresh the list of API keys
//       fetchApiKeys();
//     } catch (error) {
//       console.error('Error deleting API key:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Error Deleting API Key',
//         description: String(error),
//       });
//     }
//   };

//   const [isBannerVisible, setIsBannerVisible] = useState(true);

//   useEffect(() => {
//     // Check localStorage to see if the banner has been dismissed
//     const bannerDismissed = localStorage.getItem('isBannerDismissed');
//     if (bannerDismissed === 'true') {
//       setIsBannerVisible(false);
//     }
//   }, []);

//   const handleCloseBanner = () => {
//     setIsBannerVisible(false);
//     localStorage.setItem('isBannerDismissed', 'true'); // Persist dismissal
//   };

//   if (!isAuthenticated) {
//     return null;
//   }

//   return (
//     <Layout includeFooter>
//       <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
//         <div className="relative bg-zinc-900 p-5">
//           {isBannerVisible && (
//             <Alert
//               variant="default"
//               // className="relative bg-indigo-700 text-white flex items-center justify-between"
//             >
//               <div className="flex items-center">
//                 <Rocket className="h-4 w-4 mr-2  -mt-1  text-accent-base" />
//                 <AlertTitle>
//                   SciPhi Cloud is powered entirely by the open source R2R
//                   library -{' '}
//                   <Link
//                     className="text-accent-base"
//                     href="https://github.com/SciPhi-AI/R2R"
//                   >
//                     give us a <Star className="inline w-4 h-4 " />
//                   </Link>
//                 </AlertTitle>
//               </div>
//               <button
//                 className="absolute top-2 right-2 text-white hover:text-gray-300"
//                 onClick={handleCloseBanner}
//               >
//                 &times;
//               </button>
//             </Alert>
//           )}

//           <div className="flex flex-col items-center justify-center relative bg-gradient-to-r from-zinc-900/80 via-green-500/25 bg-zinc-900/80 ">
//             <Logo className="w-48 h-48" />
//             <h1 className="mt-4 text-3xl font-bold text-gray-100 text-center ">
//               Welcome to SciPhi Cloud
//             </h1>
//             {/* <h3 className="mt-4 text-lg  text-gray-100 text-center pb-10">
//               The most advanced AI retrieval system.
//             </h3> */}
//             <div className="mt-4 text-lg  text-gray-100 text-center pb-10">
//               <ReactTyped
//                 strings={[
//                   "We're taking RAG to the next level!",
//                   // "Your next step in R2R excellence.",
//                 ]}
//                 typeSpeed={40}
//                 backSpeed={30}
//                 backDelay={800}
//                 // loop
//                 showCursor
//               />
//             </div>
//           </div>
//           <div className="flex flex-col lg:flex-row gap-4 ">
//             {/* Left column - Alert */}
//             <div className="w-full flex flex-col gap-4">
//               <Alert variant="default" className="flex flex-col">
//                 <AlertTitle className="text-lg ">
//                   <div className="flex gap-2 text-xl">
//                     {/* <span className="text-gray-500 dark:text-gray-200 font-semibold">
//                       Welcome to SciPhi Cloud!
//                     </span> */}
//                   </div>
//                 </AlertTitle>
//                 <AlertDescription>
//                   {/* <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
//                     Here, you'll find a number of tools to help your journey
//                     with R2R.
//                   </p> */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                     <div className="flex items-start space-x-3">
//                       <FileText className="w-5 h-5 text-accent-base" />
//                       <div>
//                         <h3 className="text-sm font-semibold mb-1">
//                           <Link href="/documents"> Documents </Link>
//                         </h3>
//                         <p className="text-xs text-gray-500 dark:text-gray-400">
//                           Upload, update, and delete documents and their
//                           metadata.
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-start space-x-3">
//                       <Boxes className="w-5 h-5 text-accent-base" />
//                       <div>
//                         <h3 className="text-sm font-semibold mb-1">
//                           <Link href="/collections"> Collections </Link>
//                         </h3>
//                         <p className="text-xs text-gray-500 dark:text-gray-400">
//                           Manage and share groups of documents.
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-start space-x-3">
//                       <GitGraph className="w-5 h-5 text-accent-base" />
//                       <div>
//                         <h3 className="text-sm font-semibold mb-1">
//                           <Link href="/graphs"> Graphs </Link>
//                         </h3>
//                         <p className="text-xs text-gray-500 dark:text-gray-400">
//                           Construct knowledge graphs from input collections
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-start space-x-3">
//                       <MessageCircle className="w-5 h-5 text-accent-base" />
//                       <div>
//                         <h3 className="text-sm font-semibold mb-1">
//                           <Link href="/chat"> Chat </Link>
//                         </h3>
//                         <p className="text-xs text-gray-500 dark:text-gray-400">
//                           Generate RAG responses.
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-start space-x-3">
//                       <ScanSearch className="w-5 h-5 text-accent-base" />
//                       <div>
//                         <h3 className="text-sm font-semibold mb-1">
//                           <Link href="/search"> Search </Link>
//                         </h3>
//                         <p className="text-xs text-gray-500 dark:text-gray-400">
//                           Conduct search over your documents and collections.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
//                     <div className="flex justify-between items-center">
//                       {/* Left section: Feature Request and Bug Report */}
//                       <div className="flex items-center space-x-4">
//                         <Button
//                           className="flex items-center justify-center px-4 py-2 text-sm"
//                           color="transparent"
//                           onClick={() =>
//                             window.open(
//                               'https://github.com/SciPhi-AI/R2R/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=',
//                               '_blank'
//                             )
//                           }
//                         >
//                           Feature Request
//                         </Button>
//                         <Button
//                           className="flex items-center justify-center px-4 py-2 text-sm"
//                           color="transparent"
//                           onClick={() =>
//                             window.open(
//                               'https://github.com/SciPhi-AI/R2R/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=',
//                               '_blank'
//                             )
//                           }
//                         >
//                           Report a Bug
//                         </Button>
//                       </div>

//                       {/* Right section: Free Tier and Upgrade Account */}
//                       <div className="flex items-center space-x-4">
//                         {authState?.metadata?.tier != 'starter' && (
//                           <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded px-4 py-2">
//                             <span className="text-sm font-semibold">
//                               Free Tier
//                             </span>
//                           </div>
//                         )}
//                         {authState?.metadata?.tier == 'starter' && (
//                           <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded px-4 py-2">
//                             <span className="text-sm font-semibold">
//                               Starter Tier
//                             </span>
//                           </div>
//                         )}

//                         <Button
//                           className="flex items-center justify-center px-4 py-2 text-sm bg-primary text-white hover:bg-primary-dark rounded"
//                           onClick={() => router.push('/account?tab=plans')}
//                         >
//                           Upgrade Account
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 </AlertDescription>
//               </Alert>

//               {!isLoadingLimits && limits && (
//                 <div className="flex flex-col gap-4">
//                   <div className="flex flex-col sm:flex-row gap-4">
//                     <AdvancedCard className="w-full sm:w-3/6 flex flex-col">
//                       <CardHeader className="flex flex-row items-center space-x-2">
//                         <CardTitle className="text-muted-foreground">
//                           Monthly Requests
//                           <a
//                             href="https://r2r-docs.sciphi.ai/documentation/limits"
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="inline-flex items-center hover:text-blue-400 text-accent-base pl-1.5"
//                             title="View Collections Documentation"
//                           >
//                             <ExternalLink size={18} />
//                           </a>
//                         </CardTitle>
//                       </CardHeader>
//                       <CardContent className="flex flex-col justify-end flex-grow">
//                         <div className="flex flex-row space-x-2 mb-3">
//                           <div className="w-[100%]">
//                             <div className="flex justify-between text-sm">
//                               <div>
//                                 <div className="font-bold">Search</div>
//                               </div>
//                               {/* <span className="font-bold">{`0 / 3000`}</span> */}
//                               <span className="font-bold">{`${limits.search.monthlyUsed} / ${limits.search.monthlyLimit}`}</span>
//                             </div>
//                             <Progress
//                               value={Math.max(
//                                 1,
//                                 Math.round(
//                                   (100 * limits.search.monthlyUsed) /
//                                     limits.search.monthlyLimit
//                                 )
//                               )}
//                               className="h-2"
//                             />
//                           </div>
//                         </div>
//                         <div className="flex flex-row justify-between w-full space-x-4">
//                           {/* RAG Q&A */}
//                           <div className="flex flex-col w-1/2">
//                             <div className="flex justify-between text-sm mb-1">
//                               <div className="font-bold">RAG Q&A</div>
//                               <span className="font-bold">{`${limits.rag.monthlyUsed} / ${limits.rag.monthlyLimit}`}</span>
//                             </div>
//                             <Progress
//                               value={Math.max(
//                                 1,
//                                 Math.round(
//                                   (100 * limits.rag.monthlyUsed) /
//                                     limits.rag.monthlyLimit
//                                 )
//                               )}
//                               className="h-2"
//                             />
//                           </div>

//                           {/* Agent */}
//                           <div className="flex flex-col w-1/2">
//                             <div className="flex justify-between text-sm mb-1">
//                               <div className="font-bold">Agent</div>
//                               <span className="font-bold">{`${limits.agent.monthlyUsed} / ${limits.agent.monthlyLimit}`}</span>
//                             </div>
//                             <Progress
//                               value={Math.max(
//                                 1,
//                                 Math.round(
//                                   (100 * limits.agent.monthlyUsed) /
//                                     limits.agent.monthlyLimit
//                                 )
//                               )}
//                               className="h-2"
//                             />
//                           </div>
//                         </div>

//                         {/* <div className="flex flex-row space-x-2 mt-3">
//                           <div className="w-[100%]">
//                             <div className="flex justify-between text-sm">
//                               <div>
//                                 <div className="font-bold">RAG</div>
//                               </div>
//                               <span className="font-bold">{`${limits.rag.monthlyUsed} / ${limits.rag.monthlyLimit}`}</span>
//                             </div>
//                             <Progress
//                               value={Math.max(
//                                 1,
//                                 Math.round(
//                                   (100 * limits.rag.monthlyUsed) /
//                                     limits.rag.monthlyLimit
//                                 )
//                               )}
//                               className="h-2"
//                             />
//                           </div>
//                         </div> */}
//                       </CardContent>
//                     </AdvancedCard>
//                     <AdvancedCard className="w-full sm:w-3/6 flex flex-col">
//                       <CardHeader className="flex flex-row items-center space-x-2">
//                         <CardTitle className="text-muted-foreground">
//                           Storage
//                         </CardTitle>
//                       </CardHeader>
//                       <CardContent className="flex flex-col justify-end flex-grow">
//                         <div className="flex flex-row space-x-2 mb-3">
//                           <div className="w-[100%]">
//                             <div className="flex justify-between text-sm">
//                               <div>
//                                 <div className="font-bold">Documents</div>
//                               </div>
//                               <span className="font-bold">{`${limits.documents.used} / ${limits.documents.limit.toLocaleString()}`}</span>
//                             </div>
//                             <Progress
//                               value={Math.max(
//                                 1,
//                                 Math.round(
//                                   (100 * limits.documents.used) /
//                                     limits.documents.limit
//                                 )
//                               )}
//                               className="h-2"
//                             />
//                           </div>
//                         </div>
//                         <div className="flex flex-row space-x-2 mt-3">
//                           <div className="w-[100%]">
//                             <div className="flex justify-between text-sm">
//                               <div>
//                                 <div className="font-bold">Chunks</div>
//                               </div>
//                               <span className="font-bold">{`${limits.chunks.used} / ${limits.chunks.limit.toLocaleString()}`}</span>
//                             </div>
//                             <Progress
//                               value={Math.max(
//                                 1,
//                                 Math.round(
//                                   (100 * limits.chunks.used) /
//                                     limits.chunks.limit
//                                 )
//                               )}
//                               className="h-2"
//                             />
//                           </div>
//                         </div>
//                       </CardContent>
//                     </AdvancedCard>
//                   </div>
//                   <div className="flex flex-col sm:flex-row gap-4">
//                     <div className="w-full sm:w-1/2"></div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Developer API Keys Section */}
//           <div className="pt-6 border-t border-zinc-800">
//             <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
//               <h3 className="text-sm font-medium text-gray-400 mb-4">
//                 Developer API Keys
//               </h3>

//               {/* Button that triggers the modal */}
//               <Button
//                 onClick={() => setIsCreateKeyModalOpen(true)}
//                 className="pr-4 pl-2"
//               >
//                 <PlusCircle className="mr-2 w-4 h-4 mt-1" />
//                 Create New Key
//               </Button>
//             </div>

//             {/* List of existing API Keys */}
//             <div className="mt-4">
//               {apiKeys && apiKeys.length > 0 ? (
//                 <table className="min-w-full text-sm">
//                   <thead>
//                     <tr className="text-left border-b border-zinc-800">
//                       <th className="py-2">Name</th>
//                       <th className="py-2">Description</th>
//                       <th className="py-2">Public Key</th>
//                       <th className="py-2">Key ID</th>
//                       <th className="py-2">Last Updated</th>
//                       <th className="py-2"></th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {apiKeys.map((key: any) => (
//                       <tr key={key.keyId} className="border-b border-zinc-800">
//                         <td className="py-2 pr-4 break-all">
//                           {key.name || '—'}
//                         </td>
//                         <td className="py-2 pr-4 break-all">
//                           {key.description || '—'}
//                         </td>
//                         <td className="py-2 pr-4 break-all">{key.publicKey}</td>
//                         <td className="py-2 pr-4 break-all">{key.keyId}</td>
//                         <td className="py-2 pr-4">
//                           {new Date(key.updatedAt).toLocaleString()}
//                         </td>
//                         <td className="py-2 text-right pr-4">
//                           <Button onClick={() => handleDeleteApiKey(key.keyId)}>
//                             <Trash2 className="w-4 h-4" />
//                           </Button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-gray-500">No API keys found.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* ---------------------
//           CREATE KEY MODAL
//       ---------------------- */}
//       <Dialog
//         open={isCreateKeyModalOpen}
//         onOpenChange={setIsCreateKeyModalOpen}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Create a New API Key</DialogTitle>
//             <DialogDescription>
//               Give your new API key a name and description for easy reference.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <label
//                 htmlFor="apiKeyName"
//                 className="block text-sm font-medium text-gray-300"
//               >
//                 Name
//               </label>
//               <input
//                 id="apiKeyName"
//                 type="text"
//                 className="mt-1 block w-full rounded-md bg-zinc-800 border-zinc-600 focus:border-primary-light focus:ring focus:ring-primary-light focus:ring-opacity-50"
//                 placeholder="E.g. My Production Key"
//                 value={newApiKeyName}
//                 onChange={(e) => setNewApiKeyName(e.target.value)}
//               />
//             </div>
//             <div>
//               <label
//                 htmlFor="apiKeyDescription"
//                 className="block text-sm font-medium text-gray-300"
//               >
//                 Description
//               </label>
//               <textarea
//                 id="apiKeyDescription"
//                 className="mt-1 block w-full rounded-md bg-zinc-800 border-zinc-600 focus:border-primary-light focus:ring focus:ring-primary-light focus:ring-opacity-50"
//                 placeholder="A short description of what this key will be used for..."
//                 value={newApiKeyDescription}
//                 onChange={(e) => setNewApiKeyDescription(e.target.value)}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button
//               // variant="outline"
//               onClick={() => setIsCreateKeyModalOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button onClick={handleCreateApiKey}>Create Key</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </Layout>
//   );
// };

// export default HomePage;
