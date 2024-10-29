'use client';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';

import { Result } from '@/components/ChatDemo/result';
import { Search } from '@/components/ChatDemo/search';
import useSwitchManager from '@/components/ChatDemo/SwitchManager';
import Layout from '@/components/Layout';
import AppSidebar from '@/components/Sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { Message } from '@/types';

interface Collection {
  collection_id: string;
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
  const [maxLlmQueries, setMaxLlmQueries] = useState<number>();
  const [kgSearchLevel, setKgSearchLevel] = useState<number | null>(null);
  const [maxCommunityDescriptionLength, setMaxCommunityDescriptionLength] =
    useState<number>(100);
  const [localSearchLimits, setLocalSearchLimits] = useState<
    Record<string, number>
  >({});
  const [mode, setMode] = useState<'rag' | 'rag_agent'>('rag_agent');

  useEffect(() => {
    if (searchParams) {
      setQuery(decodeURIComponent(searchParams.get('q') || ''));
    }
  }, [searchParams]);

  const { pipeline, getClient, selectedModel } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const { switches, initializeSwitch, updateSwitch } = useSwitchManager();

  const [temperature, setTemperature] = useState(0.1);
  const [topP, setTopP] = useState(1);
  const [top_k, setTop_k] = useState(100);
  const [max_tokens_to_sample, setMax_tokens_to_sample] = useState(1024);
  const [kg_temperature, setKgTemperature] = useState(0.1);
  const [kg_top_p, setKgTopP] = useState(1);
  const [kg_top_k, setKgTop_k] = useState(100);
  const [kg_max_tokens_to_sample, setKgMax_tokens_to_sample] = useState(1024);

  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setQuery('');
  }, [mode]);

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
          const documents = await client.documentsOverview();
          setUploadedDocuments(documents['results']);
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

  const handleModeChange = (newMode: 'rag' | 'rag_agent') => {
    setMode(newMode);
  };

  const handleConversationSelect = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }
      const response = await client.getConversation(conversationId);
      const fetchedMessages = response.results.map(
        ([id, message]: [string, Message]) => ({
          ...message,
          id,
        })
      );
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  return (
    <Layout pageTitle="Chat" includeFooter={false}>
      <SidebarProvider defaultOpen={false}>
        {/* Main container */}
        <div className="flex flex-1 h-[calc(100vh-var(--header-height))] overflow-hidden">
          {/* Sidebar */}
          <AppSidebar
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

          <div className="flex-1 flex flex-col min-h-0 pt-[var(--header-height)]">
            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Internal Top Bar */}
              <div className="flex-shrink-0 h-10 bg-zinc-900">
                <div className="flex items-center h-10 px-8">
                  <div className="flex-shrink-0">
                    <SidebarTrigger className="h-9 w-9 p-2 hover:bg-zinc-800 rounded-md">
                      <span>Toggle Sidebar</span>
                    </SidebarTrigger>
                  </div>
                  <div className="ml-4">
                    <Select value={mode} onValueChange={handleModeChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rag_agent">RAG Agent</SelectItem>
                        <SelectItem value="rag">Question and Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Scrollable Result Area */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="max-w-4xl mx-auto py-4">
                  <Result
                    query={query}
                    setQuery={setQuery}
                    model={selectedModel}
                    userId={userId}
                    pipelineUrl={pipeline?.deploymentUrl || ''}
                    search_limit={searchLimit}
                    search_filters={safeJsonParse(searchFilters)}
                    rag_temperature={temperature}
                    rag_topP={topP}
                    rag_topK={top_k}
                    rag_maxTokensToSample={max_tokens_to_sample}
                    uploadedDocuments={uploadedDocuments}
                    setUploadedDocuments={setUploadedDocuments}
                    switches={switches}
                    hasAttemptedFetch={hasAttemptedFetch}
                    mode={mode}
                    selectedCollectionIds={selectedCollectionIds}
                    onAbortRequest={handleAbortRequest}
                    messages={messages}
                    setMessages={setMessages}
                    selectedConversationId={selectedConversationId}
                    setSelectedConversationId={setSelectedConversationId}
                  />
                </div>
              </div>

              {/* Fixed Bottom Search Bar */}
              <div className="flex-shrink-0 sticky bottom-0">
                <div className="max-w-4xl mx-auto px-4 py-2">
                  <Search
                    pipeline={pipeline || undefined}
                    setQuery={setQuery}
                    placeholder={
                      mode === 'rag'
                        ? 'Ask a question...'
                        : 'Start a conversation...'
                    }
                    disabled={uploadedDocuments?.length === 0 && mode === 'rag'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </Layout>
  );
};

export default Index;
