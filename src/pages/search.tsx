import { ArrowRight } from 'lucide-react';
import { GraphSearchResult } from 'r2r-js';
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
  const [entitySearchResults, setEntitySearchResults] = useState<any[]>([]);
  const [relationshipSearchResults, setRelationshipSearchResults] = useState<
    any[]
  >([]);
  const [communitySearchResults, setCommunitySearchResults] = useState<any[]>(
    []
  );

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
      'Graph Search',
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

      const searchResponse = await client.retrieval.search({
        query: query,
      });

      setVectorSearchResults(searchResponse.results.chunkSearchResults || []);

      const graphResults = searchResponse.results.graphSearchResults || [];

      setEntitySearchResults(
        graphResults.filter(
          (result: GraphSearchResult) => result.resultType === 'entity'
        ) as any[]
      );

      setRelationshipSearchResults(
        graphResults.filter(
          (result: GraphSearchResult) => result.resultType === 'relationship'
        ) as any[]
      );

      setCommunitySearchResults(
        graphResults.filter(
          (result: GraphSearchResult) => result.resultType === 'community'
        ) as any[]
      );
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
                <div className="relative flex items-center focus-within:ring-2 focus-within:ring-accent-dark focus-within:ring-offset-2 focus-within:ring-offset-zinc-800 rounded-full">
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
                <Tabs defaultValue="chunk" className="w-full">
                  <TabsList>
                    <TabsTrigger value="chunk">Chunks</TabsTrigger>
                    <TabsTrigger value="entity">Entities</TabsTrigger>
                    <TabsTrigger value="relationship">
                      Relationships
                    </TabsTrigger>
                    <TabsTrigger value="community">Communites</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chunk">
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
                      <p>No chunk search results found.</p>
                    )}
                  </TabsContent>
                  <TabsContent value="entity">
                    {entitySearchResults.length > 0 ? (
                      entitySearchResults.map((result, index) => (
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
                      <p>No entity results found.</p>
                    )}
                  </TabsContent>
                  <TabsContent value="relationship">
                    {relationshipSearchResults.length > 0 ? (
                      relationshipSearchResults.map((result, index) => (
                        <div
                          key={index}
                          className="mb-4 p-4 bg-zinc-800 rounded"
                        >
                          <h3 className="text-lg font-semibold mb-2">
                            {result.content.subject} {result.content.predicate}{' '}
                            {result.content.object}
                          </h3>
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
                      <p>No relationship results found.</p>
                    )}
                  </TabsContent>
                  <TabsContent value="community">
                    {communitySearchResults.length > 0 ? (
                      communitySearchResults.map((result, index) => (
                        <div
                          key={index}
                          className="mb-4 p-4 bg-zinc-800 rounded"
                        >
                          <h3 className="text-lg font-semibold mb-2">
                            {result.content.name}
                          </h3>
                          <p className="text-sm mb-2">
                            {result.content.summary}
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
                      <p>No community results found.</p>
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
