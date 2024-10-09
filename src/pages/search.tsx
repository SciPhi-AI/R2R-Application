import { ArrowRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import useSwitchManager from '@/components/ChatDemo/SwitchManager';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '@/context/UserContext';

interface Collection {
  collection_id: string;
  name: string;
}

const SearchPage: React.FC = () => {
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const { pipeline, getClient } = useUserContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const toggleSidebar = () => setSidebarIsOpen(!sidebarIsOpen);

  // Search results
  const [vectorSearchResults, setVectorSearchResults] = useState<any[]>([]);
  const [kgSearchResults, setKgSearchResults] = useState<any[]>([]);

  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    []
  );

  // Switch manager
  const { switches, initializeSwitch, updateSwitch } = useSwitchManager();

  // Search settings
  const [searchLimit, setSearchLimit] = useState<number>(10);
  const [searchFilters, setSearchFilters] = useState('{}');
  const [indexMeasure, setIndexMeasure] = useState<string>('cosine_distance');
  const [includeMetadatas, setIncludeMetadatas] = useState<boolean>(false);
  const [probes, setProbes] = useState<number>();
  const [efSearch, setEfSearch] = useState<number>();
  const [fullTextWeight, setFullTextWeight] = useState<number>();
  const [semanticWeight, setSemanticWeight] = useState<number>();
  const [fullTextLimit, setFullTextLimit] = useState<number>();
  const [rrfK, setRrfK] = useState<number>();
  const [kgSearchType, setKgSearchType] = useState<'global' | 'local'>('local');
  const [maxLlmQueries, setMaxLlmQueries] = useState<number>();
  const [kgSearchLevel, setKgSearchLevel] = useState<number | null>(null);
  const [maxCommunityDescriptionLength, setMaxCommunityDescriptionLength] =
    useState<number>(100);
  const [localSearchLimits, setLocalSearchLimits] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    initializeSwitch(
      'vector_search',
      true,
      'Vector Search',
      'Vector search is a search method that uses vectors to represent documents and queries.'
    );
    initializeSwitch(
      'hybrid_search',
      false,
      'Hybrid Search',
      'Hybrid search combines multiple search methods to provide more accurate and relevant search results.'
    );
    initializeSwitch(
      'knowledge_graph_search',
      false,
      'Knowledge Graph Search',
      'Please construct a Knowledge Graph to use this feature.'
    );
  }, [initializeSwitch]);

  const handleSwitchChange = (id: string, checked: boolean) => {
    updateSwitch(id, checked);
  };

  useEffect(() => {
    const fetchCollections = async () => {
      if (pipeline) {
        try {
          const client = await getClient();
          if (!client) {
            throw new Error('Failed to get authenticated client');
          }
          const collectionsData = await client.collectionsOverview();
          setCollections(
            collectionsData.results.map((collection: Collection) => ({
              collection_id: collection.collection_id,
              name: collection.name,
            }))
          );
        } catch (error) {
          console.error('Error fetching collections:', error);
        }
      }
    };

    fetchCollections();
  }, [pipeline, getClient]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const vectorSearchSettings = {
        use_vector_search: switches.vector_search.checked,
        use_hybrid_search: switches.hybrid_search.checked,
        search_limit: searchLimit,
        index_measure: indexMeasure,
        // include_metadatas: includeMetadatas,
        probes,
        ef_search: efSearch,
        selected_collection_ids: selectedCollectionIds,
        filters: JSON.parse(searchFilters),
        hybrid_search_settings: {
          full_text_weight: fullTextWeight,
          semantic_weight: semanticWeight,
          full_text_limit: fullTextLimit,
          rrf_k: rrfK,
        },
      };

      const kgSearchSettings = {
        use_kg_search: switches.knowledge_graph_search.checked,
        kg_search_type: kgSearchType,
        // max_llm_queries_for_global_search: maxLlmQueries,
        // kg_search_level: kgSearchLevel,
        // max_community_description_length: maxCommunityDescriptionLength,
        // local_search_limits: localSearchLimits,
        selected_collection_ids: selectedCollectionIds,
        filters: JSON.parse(searchFilters),
      };

      const results = await client.search(
        query,
        vectorSearchSettings,
        kgSearchSettings
      );

      setVectorSearchResults(results.results.vector_search_results || []);
      setKgSearchResults(results.results.kg_search_results || []);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageTitle="Search" includeFooter={false}>
      <div className="flex flex-col h-screen-[calc(100%-4rem)] overflow-hidden">
        <Sidebar
          isOpen={sidebarIsOpen}
          onToggle={toggleSidebar}
          switches={switches}
          handleSwitchChange={handleSwitchChange}
          searchLimit={searchLimit}
          setSearchLimit={setSearchLimit}
          searchFilters={searchFilters}
          setSearchFilters={setSearchFilters}
          kgSearchType={kgSearchType}
          setKgSearchType={setKgSearchType}
          max_llm_queries_for_global_search={maxLlmQueries}
          setMax_llm_queries_for_global_search={setMaxLlmQueries}
          collections={collections}
          selectedCollectionIds={selectedCollectionIds}
          setSelectedCollectionIds={setSelectedCollectionIds}
          indexMeasure={indexMeasure}
          setIndexMeasure={setIndexMeasure}
          includeMetadatas={includeMetadatas}
          setIncludeMetadatas={setIncludeMetadatas}
          probes={probes}
          setProbes={setProbes}
          efSearch={efSearch}
          setEfSearch={setEfSearch}
          fullTextWeight={fullTextWeight}
          setFullTextWeight={setFullTextWeight}
          semanticWeight={semanticWeight}
          setSemanticWeight={setSemanticWeight}
          fullTextLimit={fullTextLimit}
          setFullTextLimit={setFullTextLimit}
          rrfK={rrfK}
          setRrfK={setRrfK}
          kgSearchLevel={kgSearchLevel}
          setKgSearchLevel={setKgSearchLevel}
          maxCommunityDescriptionLength={maxCommunityDescriptionLength}
          setMaxCommunityDescriptionLength={setMaxCommunityDescriptionLength}
          localSearchLimits={localSearchLimits}
          setLocalSearchLimits={setLocalSearchLimits}
          config={{
            showVectorSearch: true,
            showHybridSearch: true,
            showKGSearch: true,
          }}
        />

        <div
          className={`main-content-wrapper ${sidebarIsOpen ? '' : 'sidebar-closed'}`}
        >
          <div
            className={`main-content ${sidebarIsOpen ? '' : 'sidebar-closed'}`}
            ref={contentAreaRef}
          >
            <div className="sticky top-0 z-10 bg-zinc-900 shadow-md">
              <form onSubmit={handleSearch} className="py-4">
                <div className="relative flex items-center focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-800 rounded-full">
                  <input
                    id="search-bar"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    placeholder="Enter your search query..."
                    className="w-full px-4 py-2 h-10 bg-zinc-700 text-zinc-200 rounded-l-full focus:outline-none"
                  />
                  <Button
                    type="submit"
                    color="filled"
                    className="px-4 py-2 h-10 rounded-r-full"
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : <ArrowRight size={20} />}
                  </Button>
                </div>
              </form>
            </div>

            <div
              className={`main-content ${sidebarIsOpen ? '' : 'sidebar-closed'} p-4`}
              ref={contentAreaRef}
            >
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Search Results</h2>
                <Tabs defaultValue="vector" className="w-full">
                  <TabsList>
                    <TabsTrigger value="vector">Vector Search</TabsTrigger>
                    <TabsTrigger value="kg">Knowledge Graph</TabsTrigger>
                  </TabsList>
                  <TabsContent value="vector">
                    {vectorSearchResults.length > 0 ? (
                      vectorSearchResults.map((result, index) => (
                        <div
                          key={index}
                          className="mb-4 p-4 bg-zinc-800 rounded"
                        >
                          <h3 className="text-lg font-semibold mb-2">
                            {result.text.substring(0, 50)}...
                          </h3>
                          <p className="text-sm">
                            Score: {result.score.toFixed(4)}
                          </p>
                          <pre className="mt-2 text-xs overflow-auto">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      ))
                    ) : (
                      <p>No vector search results found.</p>
                    )}
                  </TabsContent>
                  <TabsContent value="kg">
                    {kgSearchResults.length > 0 ? (
                      kgSearchResults.map((result, index) => (
                        <div
                          key={index}
                          className="mb-4 p-4 bg-zinc-800 rounded"
                        >
                          <h3 className="text-lg font-semibold mb-2">
                            {result.content.name}
                          </h3>
                          <p className="text-sm">
                            {result.content.description}
                          </p>
                          <pre className="mt-2 text-xs overflow-auto">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      ))
                    ) : (
                      <p>No knowledge graph results found.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
