import { Loader, Plus, UserRound } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import CollectionCreationModal from '@/components/ChatDemo/utils/collectionCreationModal';
import { CollectionCard } from '@/components/CollectionsCard';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/ui/pagination';
import { useUserContext } from '@/context/UserContext';
import { Collection } from '@/types';

const ITEMS_PER_PAGE = 8;

const Index: React.FC = () => {
  const { getClient, pipeline } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const [personalCollections, setPersonalCollections] = useState<Collection[]>(
    []
  );
  const [sharedCollections, setSharedCollections] = useState<Collection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPersonalPage, setCurrentPersonalPage] = useState(1);
  const [currentSharedPage, setCurrentSharedPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCollections = useCallback(
    async (retryCount = 0) => {
      if (!pipeline?.deploymentUrl) {
        console.error('No pipeline deployment URL available');
        return;
      }

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const getUserResponse = await client.user();
        const userId = getUserResponse.results?.id;

        // Just fetch once since we don't have pagination parameters in the API yet
        const personalData = await client.getCollectionsForUser(userId);
        // TODO: We really need to synchronize the API to allow for better pagination
        const overviewData = await client.collectionsOverview(
          undefined,
          undefined,
          1000
        );

        const personalCollectionsArray = Array.isArray(personalData.results)
          ? personalData.results
          : [];

        const allCollectionsArray = Array.isArray(overviewData.results)
          ? overviewData.results
          : [];

        // Filter out shared collections (collections in overview but not in personal)
        const personalCollectionIds = new Set(
          personalCollectionsArray.map((col) => col.collection_id)
        );

        const sharedCollectionsArray = allCollectionsArray.filter(
          (col) => !personalCollectionIds.has(col.collection_id)
        );

        setPersonalCollections(personalCollectionsArray);
        setSharedCollections(sharedCollectionsArray);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching collections:', error);
        setPersonalCollections([]);
        setSharedCollections([]);
        setIsLoading(false);
      }
    },
    [pipeline?.deploymentUrl, getClient]
  );

  const filteredPersonalCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return personalCollections;
    }

    const query = searchQuery.toLowerCase();
    return personalCollections.filter(
      (collection) =>
        collection.name?.toLowerCase().includes(query) ||
        collection.collection_id?.toLowerCase().includes(query) ||
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
        collection.collection_id?.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
    );
  }, [sharedCollections, searchQuery]);

  const SharedCollectionCard: React.FC<{ collection: Collection }> = ({
    collection,
  }) => (
    <div className="relative">
      <CollectionCard collection={collection} className="w-64 h-full" />
      <div className="absolute bottom-2 right-2 bg-gray-800 rounded-full p-1">
        <UserRound className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleAddCollection = () => {
    setIsModalOpen(true);
  };

  const handleCollectionCreated = () => {
    fetchCollections();
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
                        key={collection.collection_id}
                        className="w-full h-[120px] flex justify-center"
                      >
                        <CollectionCard
                          collection={collection}
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
                  isLoading={isLoading}
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
                        key={collection.collection_id}
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
                  isLoading={isLoading}
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
          {isLoading ? (
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
                    onClick={handleAddCollection}
                    color="filled"
                    shape="outline"
                    className="flex items-center space-x-2 whitespace-nowrap min-w-fit"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create New Collection</span>
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
