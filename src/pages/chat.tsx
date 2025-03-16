'use client';
import { useSearchParams } from 'next/navigation';
import { MessageResponse } from 'r2r-js';
import React, { useState, useEffect, useRef } from 'react';

import { Result } from '@/components/ChatDemo/result';
import { Search } from '@/components/ChatDemo/search';
import useSwitchManager from '@/components/ChatDemo/SwitchManager';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { Message } from '@/types';

interface Collection {
  id: string;
  name: string;
}

const Index: React.FC = () => {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    []
  );
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [searchLimit, setSearchLimit] = useState<number>(50);
  const [searchFilters, setSearchFilters] = useState('{}');
  const [indexMeasure, setIndexMeasure] = useState<string>('cosine_distance');
  const [includeMetadatas, setIncludeMetadatas] = useState<boolean>(false);
  const [probes, setProbes] = useState<number>();
  const [efSearch, setEfSearch] = useState<number>();
  const [fullTextWeight, setFullTextWeight] = useState<number>(1);
  const [semanticWeight, setSemanticWeight] = useState<number>(10);
  const [fullTextLimit, setFullTextLimit] = useState<number>(100);
  const [rrfK, setRrfK] = useState<number>(5);
  const [maxLlmQueries, setMaxLlmQueries] = useState<number>();
  const [kgSearchLevel, setKgSearchLevel] = useState<number | null>(null);
  const [maxCommunityDescriptionLength, setMaxCommunityDescriptionLength] =
    useState<number>(100);
  const [localSearchLimits, setLocalSearchLimits] = useState<
    Record<string, number>
  >({});
  const [mode, setMode] = useState<'rag' | 'rag_agent'>('rag_agent');
  const [sidebarIsOpen, setSidebarIsOpen] = useState(true);
  const [research, setResearch] = useState<boolean>(false);
  const [thinking, setThinking] = useState(true);


  // NOTE: Grab the selectedModel and its setter from the user context.
  const { pipeline, getClient, selectedModel, setSelectedModel } =
    useUserContext();

  const toggleSidebar = () => {
    setSidebarIsOpen(!sidebarIsOpen);
  };

  const [isLoading, setIsLoading] = useState(true);

  const { switches, initializeSwitch, updateSwitch } = useSwitchManager();

  const getEnabledTools = () => {
    const enabledTools = ['web_search', 'web_scrape', 'search_file_knowledge', 'get_file_content'];
    return enabledTools;
  };

  const [graphDimensions, setGraphDimensions] = useState({
    width: 0,
    height: 0,
  });
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    setQuery('');
  }, [mode]);

  useEffect(() => {
    initializeSwitch(
      'vectorSearch',
      true,
      'Vector Search',
      'Vector search is a search method that uses vectors to represent documents and queries.'
    );
    initializeSwitch(
      'knowledgeGraphSearch',
      true,
      'Graph Search',
      'Please construct a Knowledge Graph to use this feature.'
    );
    initializeSwitch(
      'hybridSearch',
      false,
      'Hybrid Search',
      'Hybrid search is a search method that combines multiple search methods.'
    );
  }, [initializeSwitch]);

  const handleSwitchChange = (id: string, checked: boolean) => {
    updateSwitch(id, checked);
    toast({
      title: `${switches[id].label} status changed`,
      description: (
        <pre className="mt-2 mb-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">
            {JSON.stringify({ [id]: checked }, null, 2)}
          </code>
        </pre>
      ),
    });
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      if (pipeline) {
        try {
          const client = await getClient();
          if (!client) {
            throw new Error('Failed to get authenticated client');
          }
          setIsLoading(true);
          const documents = await client.documents.list();
          setUploadedDocuments(documents.results.map((doc) => doc.id));
        } catch (error) {
          console.error('Error fetching user documents:', error);
        } finally {
          setIsLoading(false);
          setHasAttemptedFetch(true);
        }
      }
    };

    fetchDocuments();
  }, [pipeline, getClient]);

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

  const safeJsonParse = (jsonString: string) => {
    if (typeof jsonString !== 'string') {
      console.warn('Input is not a string:', jsonString);
      return {};
    }
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Invalid JSON input:', error);
      return {};
    }
  };

  const handleAbortRequest = () => {
    setQuery('');
  };

  const handleConversationSelect = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }
      const response = await client.conversations.retrieve({
        id: conversationId,
      });
      const fetchedMessages = response.results.map(
        (message: MessageResponse) => ({
          id: message.id,
          role: message.message?.role || 'user',
          content: message.message?.content || '',
          timestamp: message.metadata?.timestamp || new Date().toISOString(),
        })
      );
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  // Make sure we have a default model if none is set:
  useEffect(() => {
    if (!selectedModel) {
      setSelectedModel('anthropic/claude-3-5-sonnet-20241022');
    }
  }, [selectedModel, setSelectedModel]);

  return (
    <Layout pageTitle="Agentic RAG with R2R" includeFooter={false}>
      {/* <div className="flex flex-col h-screen-[calc(100%-4rem)] overflow-hidden"> */}
      <div className="flex h-[calc(100vh-4rem)]">
        {' '}
        {/* Subtract navbar height */}
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
            showRagGeneration: true,
            showConversations: true,
          }}
          onConversationSelect={handleConversationSelect}
        />
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div
            className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out ${
              sidebarIsOpen ? 'ml-80' : 'ml-6'
            }`}
            ref={contentAreaRef}
          >
            {/* <div className="w-full max-w-4xl flex flex-col flex-grow"> */}
            <div className="w-full max-w-4xl mx-auto px-4 py-4 flex flex-col h-full">
              {/* Chat Interface */}

              {/* Remove the Mode and Model selectors row */}
              <div className="flex-1 overflow-auto p-4">
                <Result
                  query={query}
                  setQuery={setQuery}
                  model={selectedModel}
                  userId={userId}
                  pipelineUrl={pipeline?.deploymentUrl || ''}
                  searchLimit={searchLimit}
                  searchFilters={safeJsonParse(searchFilters)}
                  uploadedDocuments={uploadedDocuments}
                  setUploadedDocuments={setUploadedDocuments}
                  switches={switches}
                  hasAttemptedFetch={hasAttemptedFetch}
                  selectedCollectionIds={selectedCollectionIds}
                  onAbortRequest={handleAbortRequest}
                  messages={messages}
                  setMessages={setMessages}
                  selectedConversationId={selectedConversationId}
                  setSelectedConversationId={setSelectedConversationId}
                  enabledTools={getEnabledTools()}
                  mode={mode}
                  research={research}
                  thinking={thinking || research}
                />
              </div>

              {/* Search Bar */}
              <div className="p-4 w-full">
                <Search
                  pipeline={pipeline || undefined}
                  setQuery={setQuery}
                  placeholder={
                    mode === 'rag'
                      ? 'Ask a question...'
                      : 'Start a conversation...'
                  }
                  disabled={uploadedDocuments?.length === 0 && mode === 'rag'}
                  mode={mode}
                  setMode={setMode}
                  research={research}
                  setResearch={setResearch}
                  thinking={thinking}
                  setThinking={setThinking}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;