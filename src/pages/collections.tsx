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

const PAGE_SIZE = 1000;
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

  const fetchInitialData = useCallback(async () => {
    setLoading(true);

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('No authenticated client');
      }

      const userId = authState.userId || '';

      const cachedPersonalData = localStorage.getItem('personalCollections');
      const cachedSharedData = localStorage.getItem('sharedCollections');
      const cacheTimestamp = localStorage.getItem('collectionsTimestamp');
      const currentTime = new Date().getTime();

      // Use cache if it exists and is less than 5 minutes old
      if (
        cachedPersonalData &&
        cachedSharedData &&
        cacheTimestamp &&
        currentTime - parseInt(cacheTimestamp) < 5 * 60 * 1000
      ) {
        setPersonalCollections(JSON.parse(cachedPersonalData));
        setSharedCollections(JSON.parse(cachedSharedData));
        setPersonalTotalEntries(JSON.parse(cachedPersonalData).length);
        setAccessibleTotalEntries(
          JSON.parse(cachedSharedData).length +
            JSON.parse(cachedPersonalData).length
        );
        setLoading(false);
        return;
      }

      const [personalBatch, accessibleBatch] = await Promise.all([
        client.users.listCollections({
          id: userId,
          offset: 0,
          limit: PAGE_SIZE,
        }),
        client.collections.list({ offset: 0, limit: PAGE_SIZE }),
      ]);

      setPersonalTotalEntries(personalBatch.totalEntries);
      setAccessibleTotalEntries(accessibleBatch.totalEntries);

      // Determine which accessible are actually shared (not personal)
      const personalIds = new Set(personalBatch.results.map((col) => col.id));
      const initialShared = accessibleBatch.results.filter(
        (col) => !personalIds.has(col.id)
      );

      // Set initial states so user sees first page right away
      setPersonalCollections(personalBatch.results);
      setSharedCollections(initialShared);

      // Save to localStorage with timestamp
      localStorage.setItem(
        'personalCollections',
        JSON.stringify(personalBatch.results)
      );
      localStorage.setItem('sharedCollections', JSON.stringify(initialShared));
      localStorage.setItem('collectionsTimestamp', currentTime.toString());

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

        // Update localStorage with complete data
        localStorage.setItem(
          'personalCollections',
          JSON.stringify(allPersonal)
        );
        localStorage.setItem(
          'sharedCollections',
          JSON.stringify(updatedShared)
        );
      })();
    } catch (error) {
      console.error('Error fetching collections:', error);
      setPersonalCollections([]);
      setSharedCollections([]);
      setLoading(false);
    }
  }, [getClient, authState.userId]);

  useEffect(() => {
    console.log('Component mounted, triggering fetchInitialData');
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

  const renderCollections = () => {
    const currentPersonal = getCurrentPagePersonalCollections();
    const currentShared = getCurrentPageSharedCollections();
    const hasPersonalResults = currentPersonal.length > 0;
    const hasSharedResults = currentShared.length > 0;

    return (
      <>
        {personalCollections.length > 0 && (
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
                  : Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`empty-${index}`}
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
        )}

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
                  : Array.from({ length: 4 }).map((_, index) => (
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
              : accessibleTotalEntries - personalTotalEntries >
                ITEMS_PER_PAGE) && (
              <div className="mb-10">
                <Pagination
                  currentPage={currentSharedPage}
                  totalPages={sharedTotalPages}
                  onPageChange={handleSharedPageChange}
                  isLoading={loading}
                />
              </div>
            )}
          </div>
        )}

        {personalCollections.length === 0 &&
          sharedCollections.length === 0 &&
          !loading && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[300px]">
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
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-white">Collections</h1>
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
