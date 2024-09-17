import { Loader, Plus } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import CollectionCreationModal from '@/components/ChatDemo/utils/collectionCreationModal';
import { CollectionCard } from '@/components/CollectionsCard';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import Pagination from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { Collection } from '@/types';

const ITEMS_PER_PAGE = 8;

const Index: React.FC = () => {
  const { getClient, pipeline } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toast } = useToast();

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const fetchCollections = useCallback(
    async (retryCount = 0) => {
      if (!pipeline?.deploymentUrl) {
        console.error('No pipeline deployment URL available');
        return [];
      }

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const data = await client.groupsOverview();

        const collectionsArray = Array.isArray(data.results)
          ? data.results
          : [];

        setCollections(collectionsArray);
        setIsLoading(false);
        return collectionsArray;
      } catch (error) {
        console.error('Error fetching collections:', error);
        setCollections([]);
        setIsLoading(false);
      }
      return [];
    },
    [pipeline?.deploymentUrl, getClient]
  );

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Mock data removed. Assuming fetchCollections handles real data.

  const handleAddCollection = () => {
    setIsModalOpen(true);
  };

  const handleCollectionCreated = () => {
    // Refresh the collections list after a new collection is created
    fetchCollections();
  };

  const getCurrentPageCollections = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return collections.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const renderCollections = () => {
    const currentCollections = getCurrentPageCollections();
    const items = [...currentCollections];

    while (items.length < ITEMS_PER_PAGE) {
      items.push({ group_id: `empty-${items.length}`, name: '' });
    }

    return items.map((collection) => (
      <div
        key={collection.group_id}
        className="w-full h-[120px] flex justify-center"
      >
        {collection.name ? (
          <CollectionCard collection={collection} className="w-64 h-full" />
        ) : (
          <div className="w-48 sm:w-64 md:w-72 h-full" />
        )}
      </div>
    ));
  };

  return (
    <Layout pageTitle="Collections" includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="mx-auto max-w-6xl mb-12 mt-20">
          {isLoading ? (
            <Loader className="mx-auto mt-20 animate-spin" size={64} />
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">
                  Your Collections
                </h1>
                <Button
                  onClick={handleAddCollection}
                  color="primary"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Collection</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10 mb-10">
                {renderCollections()}
              </div>

              {collections.length > ITEMS_PER_PAGE && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(collections.length / ITEMS_PER_PAGE)}
                  onPageChange={handlePageChange}
                />
              )}
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
