import { ExternalLink } from 'lucide-react'; // Add this to your existing imports at the top
import { Loader, Plus, UserRound } from 'lucide-react';
import { CollectionResponse } from 'r2r-js';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import CollectionCreationModal from '@/components/ChatDemo/utils/collectionCreationModal';
import { ContainerObjectCard } from '@/components/ContainerObjectCard';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/ui/pagination';
import { useUserContext } from '@/context/UserContext';

const PAGE_SIZE = 100;
const ITEMS_PER_PAGE = 8;

const Index: React.FC = () => {
  const { getClient, authState } = useUserContext();
  const [loading, setLoading] = useState(true);

  const [personalCollections, setPersonalCollections] = useState<
    CollectionResponse[]
  >([]);
  const [sharedCollections, setSharedCollections] = useState<
    CollectionResponse[]
  >([]);

  const [personalTotalEntries, setPersonalTotalEntries] = useState<number>(0);
  const [accessibleTotalEntries, setAccessibleTotalEntries] =
    useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPersonalPage, setCurrentPersonalPage] = useState(1);
  const [currentSharedPage, setCurrentSharedPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // For displaying / propagating errors (including 429)
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(''); // reset any old errors

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('No authenticated client');
      }

      const userId = authState.userId || '';

      // Fetch first batch of personal and accessible collections in parallel
      const [personalBatch, accessibleBatch] = await Promise.all([
        client.users.listCollections({
          id: userId,
          offset: 0,
          limit: PAGE_SIZE,
        }),
        client.collections.list({ offset: 0, limit: PAGE_SIZE }),
      ]);

      // Determine personal total
      setPersonalTotalEntries(personalBatch.totalEntries);
      // Determine accessible total
      setAccessibleTotalEntries(accessibleBatch.totalEntries);

      // Determine which accessible are actually shared (not personal)
      const personalIds = new Set(personalBatch.results.map((col) => col.id));
      const initialShared = accessibleBatch.results.filter(
        (col) => !personalIds.has(col.id)
      );

      // Set initial states so user sees first page right away
      setPersonalCollections(personalBatch.results);
      setSharedCollections(initialShared);
      setLoading(false);

      // Now fetch remaining in the background
      void (async function fetchRemainder() {
        let allPersonal = [...personalBatch.results];
        let allAccessible = [...accessibleBatch.results];

        // Fetch remaining personal collections
        let offset = PAGE_SIZE;
        while (offset < personalBatch.totalEntries) {
          const batch = await client.users.listCollections({
            id: userId,
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) {
            break;
          }
          allPersonal = allPersonal.concat(batch.results);
          offset += PAGE_SIZE;
        }

        // Fetch remaining accessible collections
        offset = PAGE_SIZE;
        while (offset < accessibleBatch.totalEntries) {
          const batch = await client.collections.list({
            offset,
            limit: PAGE_SIZE,
          });
          if (batch.results.length === 0) {
            break;
          }
          allAccessible = allAccessible.concat(batch.results);
          offset += PAGE_SIZE;
        }

        // After all background fetching is done, recalculate shared
        const updatedPersonalIds = new Set(allPersonal.map((col) => col.id));
        const updatedShared = allAccessible.filter(
          (col) => !updatedPersonalIds.has(col.id)
        );

        setPersonalCollections(allPersonal);
        setSharedCollections(updatedShared);
      })();
    } catch (error: any) {
      // Handle 429 'Too Many Requests' specifically
      if (error?.response?.status === 429) {
        console.error('429 Too Many Requests', error);
        setErrorMessage(
          'Too Many Requests: The server is throttling requests. Please try again later.'
        );
      } else {
        console.error('Error fetching collections:', error);
        setErrorMessage('Error fetching collections. Please try again later.');
      }

      setPersonalCollections([]);
      setSharedCollections([]);
      setLoading(false);
    }
  }, [getClient, authState.userId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredPersonalCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return personalCollections;
    }
    const query = searchQuery.toLowerCase();
    return personalCollections.filter(
      (collection) =>
        collection.name?.toLowerCase().includes(query) ||
        collection.id.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
    );
  }, [personalCollections, searchQuery]);

  const filteredSharedCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return sharedCollections;
    }
    const query = searchQuery.toLowerCase();
    return sharedCollections.filter(
      (collection) =>
        collection.name?.toLowerCase().includes(query) ||
        collection.id.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
    );
  }, [sharedCollections, searchQuery]);

  const SharedCollectionCard: React.FC<{ collection: CollectionResponse }> = ({
    collection,
  }) => (
    <div className="relative">
      <ContainerObjectCard
        containerObject={collection}
        className="w-64 h-full"
      />
      <div className="absolute bottom-2 right-2 bg-gray-800 rounded-full p-1">
        <UserRound className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  const handleAddCollection = () => {
    setIsModalOpen(true);
  };

  const handleCollectionCreated = () => {
    fetchInitialData();
  };

  const getCurrentPagePersonalCollections = () => {
    const startIndex = (currentPersonalPage - 1) * ITEMS_PER_PAGE;
    return filteredPersonalCollections.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  };

  const getCurrentPageSharedCollections = () => {
    const startIndex = (currentSharedPage - 1) * ITEMS_PER_PAGE;
    return filteredSharedCollections.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  };

  const handlePersonalPageChange = (pageNumber: number) => {
    setCurrentPersonalPage(pageNumber);
  };

  const handleSharedPageChange = (pageNumber: number) => {
    setCurrentSharedPage(pageNumber);
  };

  // Compute total pages:
  // If no search, use totalEntries from initial fetches
  // If search, use filtered arrays length
  const personalTotalPages = useMemo(() => {
    if (searchQuery.trim()) {
      return Math.ceil(filteredPersonalCollections.length / ITEMS_PER_PAGE);
    } else {
      return Math.ceil(personalTotalEntries / ITEMS_PER_PAGE);
    }
  }, [searchQuery, filteredPersonalCollections.length, personalTotalEntries]);

  const sharedTotalPages = useMemo(() => {
    if (searchQuery.trim()) {
      return Math.ceil(filteredSharedCollections.length / ITEMS_PER_PAGE);
    } else {
      // Shared total = accessibleTotalEntries - personalTotalEntries (inferred)
      const sharedTotalCount = accessibleTotalEntries - personalTotalEntries;
      return Math.ceil(sharedTotalCount / ITEMS_PER_PAGE);
    }
  }, [
    searchQuery,
    filteredSharedCollections.length,
    accessibleTotalEntries,
    personalTotalEntries,
  ]);

  // Always render the two main sections so the layout doesn't collapse.
  // Show placeholders or "No matching" text if we have no data.
  const renderCollections = () => {
    const currentPersonal = getCurrentPagePersonalCollections();
    const currentShared = getCurrentPageSharedCollections();

    const hasPersonalResults = currentPersonal.length > 0;
    const hasSharedResults = currentShared.length > 0;

    return (
      <>
        {/* YOUR COLLECTIONS */}
        <div className="w-full mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            Your Collections
          </h2>
          <div className="min-h-[300px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {hasPersonalResults
                ? currentPersonal.map((collection) => (
                    <div
                      key={collection.id}
                      className="w-full h-[120px] flex justify-center"
                    >
                      <ContainerObjectCard
                        containerObject={collection}
                        className="w-64 h-full"
                      />
                    </div>
                  ))
                : // If no results, show placeholders
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="w-full h-[40px] flex justify-center"
                      >
                      <div className="w-64 h-full flex items-center justify-center text-gray-400">
                        {index === 0 && 'No matching collections found'}
                      </div>
                    </div>
                  ))}
            </div>
          </div>
          {(searchQuery.trim()
            ? filteredPersonalCollections.length > ITEMS_PER_PAGE
            : personalTotalEntries > ITEMS_PER_PAGE) && (
            <div className="mb-10">
              <Pagination
                currentPage={currentPersonalPage}
                totalPages={personalTotalPages}
                onPageChange={handlePersonalPageChange}
                isLoading={loading}
              />
            </div>
          )}
        </div>

        {/* SHARED COLLECTIONS */}
        {sharedCollections.length > 0 && (
          <div className="w-full">
          <h2 className="text-xl font-semibold text-white mb-4">
            Shared With You
          </h2>
          <div className="min-h-[300px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
              {hasSharedResults
                ? currentShared.map((collection) => (
                    <div
                      key={collection.id}
                      className="w-full h-[120px] flex justify-center"
                    >
                      <SharedCollectionCard collection={collection} />
                    </div>
                  ))
                : // If no results, show placeholders
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`empty-shared-${index}`}
                      className="w-full h-[120px] flex justify-center"
                    >
                      <div className="w-64 h-full flex items-center justify-center text-gray-400">
                        {index === 0 && 'No matching collections found'}
                      </div>
                    </div>
                  ))}
            </div>
          </div>
          {(searchQuery.trim()
            ? filteredSharedCollections.length > ITEMS_PER_PAGE
            : accessibleTotalEntries - personalTotalEntries > ITEMS_PER_PAGE) && (
            <div className="mb-10">
              <Pagination
                currentPage={currentSharedPage}
                totalPages={sharedTotalPages}
                onPageChange={handleSharedPageChange}
                isLoading={loading}
              />
            </div>
          )}
        </div> )}

        {/* If truly nothing and not loading, show fallback */}
        {personalCollections.length === 0 &&
          sharedCollections.length === 0 &&
          !loading && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[300px] mt-4">
              <div className="w-full h-[120px] flex justify-center col-span-full">
                <div className="w-64 h-full flex items-center justify-center text-gray-400">
                  No collections found
                </div>
              </div>
            </div>
          )}
      </>
    );
  };

  return (
    <Layout pageTitle="Collections" includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="mx-auto max-w-6xl mb-12 mt-20">
          {loading &&
          personalCollections.length === 0 &&
          sharedCollections.length === 0 ? (
            <div className="flex justify-center mt-20">
              <Loader className="animate-spin" size={64} />
            </div>
          ) : (
            <>
              {/* Error Message (including 429) */}
              {errorMessage && (
                <div className="bg-red-500 text-white p-3 mb-4 rounded">
                  {errorMessage}
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Collections
                  <a 
                    href="https://r2r-docs.sciphi.ai/api-and-sdks/collections/collections"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center hover:text-blue-400 text-gray-400"
                    title="View Collections Documentation"
                  >
                    <ExternalLink size={18} />
                  </a>
                </h1>
                </div>

                <div className="flex items-center mt-6 gap-2">
                  <Input
                    placeholder="Search by Name or Collection ID"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPersonalPage(1);
                      setCurrentSharedPage(1);
                    }}
                    className="flex-grow"
                  />
                  <Button
                    className="pl-2 pr-2 py-2 px-4"
                    onClick={handleAddCollection}
                    color="filled"
                    shape="rounded"
                    style={{ zIndex: 20, minWidth: '100px' }}
                  >
                    <Plus className="w-5 h-5" />
                    <span>New</span>
                  </Button>
                </div>
              </div>

              <hr className="w-full border-t border-gray-300" />

              <div className="mt-10">{renderCollections()}</div>
            </>
          )}
        </div>
      </main>

      <CollectionCreationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCollectionCreated={handleCollectionCreated}
      />
    </Layout>
  );
};

export default Index;
