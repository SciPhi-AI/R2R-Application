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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPersonalPage, setCurrentPersonalPage] = useState(1);
  const [currentSharedPage, setCurrentSharedPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUserCollections = useCallback(async () => {
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // Start both fetches in parallel
      const [firstPersonalBatch, firstAccessibleBatch] = await Promise.all([
        client.users.listCollections({
          id: authState.userId || '',
          offset: 0,
          limit: PAGE_SIZE,
        }),
        client.collections.list({
          offset: 0,
          limit: PAGE_SIZE,
        }),
      ]);

      // Set initial data as soon as we have the first batches
      const personalCollectionIds = new Set(
        firstPersonalBatch.results.map((col) => col.id)
      );

      const initialSharedCollections = firstAccessibleBatch.results.filter(
        (col) => !personalCollectionIds.has(col.id)
      );

      setPersonalCollections(firstPersonalBatch.results);
      setSharedCollections(initialSharedCollections);
      setLoading(false);

      // Continue fetching remaining data in the background
      const fetchRemainingData = async () => {
        let offset = PAGE_SIZE;
        let allPersonalCollections = [...firstPersonalBatch.results];
        let allAccessibleCollections = [...firstAccessibleBatch.results];

        // Fetch remaining personal collections
        if (offset < firstPersonalBatch.total_entries) {
          while (true) {
            const batch = await client.users.listCollections({
              id: authState.userId || '',
              offset,
              limit: PAGE_SIZE,
            });

            if (batch.results.length === 0) {
              break;
            }

            allPersonalCollections = allPersonalCollections.concat(
              batch.results
            );
            setPersonalCollections(allPersonalCollections);
            offset += PAGE_SIZE;

            if (offset >= firstPersonalBatch.total_entries) {
              break;
            }
          }
        }

        // Reset offset for accessible collections
        offset = PAGE_SIZE;

        // Fetch remaining accessible collections
        if (offset < firstAccessibleBatch.total_entries) {
          while (true) {
            const batch = await client.collections.list({
              offset,
              limit: PAGE_SIZE,
            });

            if (batch.results.length === 0) {
              break;
            }

            allAccessibleCollections = allAccessibleCollections.concat(
              batch.results
            );

            // Update shared collections, filtering out personal ones
            const updatedPersonalCollectionIds = new Set(
              allPersonalCollections.map((col) => col.id)
            );
            const updatedSharedCollections = allAccessibleCollections.filter(
              (col) => !updatedPersonalCollectionIds.has(col.id)
            );
            setSharedCollections(updatedSharedCollections); // Update UI as we get more

            offset += PAGE_SIZE;

            if (offset >= firstAccessibleBatch.total_entries) {
              break;
            }
          }
        }
      };

      // Start fetching remaining data in the background
      fetchRemainingData().catch((error) => {
        console.error('Error fetching remaining collections:', error);
      });
    } catch (error) {
      console.error('Error fetching collections:', error);
      setPersonalCollections([]);
      setSharedCollections([]);
      setLoading(false);
    }
  }, [getClient]);

  const filteredPersonalCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return personalCollections;
    }

    const query = searchQuery.toLowerCase();
    return personalCollections.filter(
      (collection) =>
        collection.name?.toLowerCase().includes(query) ||
        collection.id?.toLowerCase().includes(query) ||
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
        collection.id?.toLowerCase().includes(query) ||
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

  useEffect(() => {
    fetchUserCollections();
  }, [fetchUserCollections]);

  const handleAddCollection = () => {
    setIsModalOpen(true);
  };

  const handleCollectionCreated = () => {
    fetchUserCollections();
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

  const renderCollections = () => {
    const hasPersonalResults = getCurrentPagePersonalCollections().length > 0;
    const hasSharedResults = getCurrentPageSharedCollections().length > 0;

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
                  ? getCurrentPagePersonalCollections().map((collection) => (
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
                  : // Fill empty grid spaces to maintain layout
                    Array.from({ length: 4 }).map((_, index) => (
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
            {filteredPersonalCollections.length > ITEMS_PER_PAGE && (
              <div className="mb-10">
                <Pagination
                  currentPage={currentPersonalPage}
                  totalPages={Math.ceil(
                    filteredPersonalCollections.length / ITEMS_PER_PAGE
                  )}
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
                  ? getCurrentPageSharedCollections().map((collection) => (
                      <div
                        key={collection.id}
                        className="w-full h-[120px] flex justify-center"
                      >
                        <SharedCollectionCard collection={collection} />
                      </div>
                    ))
                  : // Fill empty grid spaces to maintain layout
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
            {filteredSharedCollections.length > ITEMS_PER_PAGE && (
              <div className="mb-10">
                <Pagination
                  currentPage={currentSharedPage}
                  totalPages={Math.ceil(
                    filteredSharedCollections.length / ITEMS_PER_PAGE
                  )}
                  onPageChange={handleSharedPageChange}
                  isLoading={loading}
                />
              </div>
            )}
          </div>
        )}

        {personalCollections.length === 0 && sharedCollections.length === 0 && (
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
          {loading ? (
            <Loader className="mx-auto mt-20 animate-spin" size={64} />
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
