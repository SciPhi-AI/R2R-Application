import { ArrowRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import useSwitchManager from '@/components/ChatDemo/SwitchManager';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '@/context/UserContext';

interface Collection {
  id: string;
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
  const [kgSearchLevel, setKgSearchLevel] = useState<number | null>(null);
  const [maxCommunityDescriptionLength, setMaxCommunityDescriptionLength] =
    useState<number>(100);
  const [localSearchLimits, setLocalSearchLimits] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    initializeSwitch(
      'vectorSearch',
      true,
      'Vector Search',
      'Vector search is a search method that uses vectors to represent documents and queries.'
    );
    initializeSwitch(
      'hybridSearch',
      false,
      'Hybrid Search',
      'Hybrid search combines multiple search methods to provide more accurate and relevant search results.'
    );
    initializeSwitch(
      'knowledgeGraphSearch',
      true,
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
          const collectionsData = await client.collections.list();
          setCollections(
            collectionsData.results.map((collection: Collection) => ({
              id: collection.id,
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
        useVectorSearch: switches.vectorSearch.checked,
        useHybridSearch: switches.hybridSearch.checked,
        searchLimit: searchLimit,
        indexMeasure: indexMeasure,
        // include_metadatas: includeMetadatas,
        probes,
        efSearch: efSearch,
        selectedCollectionIds: selectedCollectionIds,
        filters: JSON.parse(searchFilters),
        fullTextWeight: fullTextWeight,
        semanticWeight: semanticWeight,
        fullTextLimit: fullTextLimit,
        rrfK: rrfK,
      };

      const kgSearchSettings = {
        use_kg_search: switches.knowledgeGraphSearch.checked,
        // kg_search_level: kgSearchLevel,
        // max_community_description_length: maxCommunityDescriptionLength,
        // local_search_limits: localSearchLimits,
        selected_collection_ids: selectedCollectionIds,
        filters: JSON.parse(searchFilters),
      };

      const results = await client.retrieval.search({
        query: query,
        vectorSearchSettings: vectorSearchSettings,
        kgSearchSettings: kgSearchSettings,
      });

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
            showKGSearch: false,
            showRagGeneration: false,
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
                            {result.metadata?.title || `Result ${index + 1}`}
                          </h3>
                          <p className="text-sm mb-2">{result.text}</p>
                          <p className="text-sm mb-2">
                            Score: {result.score.toFixed(4)}
                          </p>
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            <AccordionItem value={`item-${index}`}>
                              <AccordionTrigger>View Details</AccordionTrigger>
                              <AccordionContent>
                                <pre className="text-xs overflow-auto bg-zinc-900 p-4 rounded">
                                  {JSON.stringify(result, null, 2)}
                                </pre>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
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
                          <p className="text-sm mb-2">
                            {result.content.description}
                          </p>
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            <AccordionItem value={`item-${index}`}>
                              <AccordionTrigger>View Details</AccordionTrigger>
                              <AccordionContent>
                                <pre
                                  className="text-xs bg-zinc-900 p-4 rounded"
                                  style={{ whiteSpace: 'pre-wrap' }}
                                >
                                  {JSON.stringify(result, null, 2)}
                                </pre>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
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
