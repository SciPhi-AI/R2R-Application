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
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams) {
      setQuery(decodeURIComponent(searchParams.get('q') || ''));
    }
  }, [searchParams]);

  const { pipeline, getClient, selectedModel } = useUserContext();

  const toggleSidebar = () => {
    setSidebarIsOpen(!sidebarIsOpen);
  };

  const [isLoading, setIsLoading] = useState(true);

  const { switches, initializeSwitch, updateSwitch } = useSwitchManager();

  const [temperature, setTemperature] = useState(0.1);
  const [topP, setTopP] = useState(1);
  const [top_k, setTop_k] = useState(100);
  const [maxTokensToSample, setmaxTokensToSample] = useState(1024);
  const [kg_temperature, setKgTemperature] = useState(0.1);
  const [kg_topP, setKgTopP] = useState(1);
  const [kg_top_k, setKgTop_k] = useState(100);
  const [kg_maxTokensToSample, setKgmaxTokensToSample] = useState(1024);

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
      'Vector search is a search method that uses vectors to represent documents and queries. It is used to find similar documents to a given query.'
    );
    initializeSwitch(
      'hybridSearch',
      false,
      'Hybrid Search',
      'Hybrid search is a search method that combines multiple search methods to provide more accurate and relevant search results.'
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
      const response = await client.conversations.retrieve({
        id: conversationId,
      });
      const fetchedMessages = response.results.map(
        (message: MessageResponse) => ({
          id: message.id,
          role: message.metadata?.role || 'user',
          content: message.metadata?.content || '',
          timestamp: message.metadata?.timestamp || new Date().toISOString(),
        })
      );
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  return (
    <Layout pageTitle="Chat" includeFooter={false}>
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
          temperature={temperature}
          setTemperature={setTemperature}
          topP={topP}
          setTopP={setTopP}
          topK={top_k}
          setTopK={setTop_k}
          maxTokensToSample={maxTokensToSample}
          setMaxTokensToSample={setmaxTokensToSample}
          config={{
            showVectorSearch: true,
            showHybridSearch: true,
            showKGSearch: false,
            showRagGeneration: true,
            showConversations: true,
          }}
          onConversationSelect={handleConversationSelect}
        />

        {/* top_k={top_k}
          setTop_k={setTop_k}
          maxTokensToSample={maxTokensToSample}
          setmaxTokensToSample={setmaxTokensToSample}
          temperature={temperature}
          setTemperature={setTemperature}
          topP={topP}
          setTopP={setTopP} */}

        {/* Main Content */}
        <div
          className={`main-content-wrapper ${sidebarIsOpen ? '' : 'sidebar-closed'}`}
        >
          <div
            className={`main-content ${sidebarIsOpen ? '' : 'sidebar-closed'}`}
            ref={contentAreaRef}
          >
            {/* Mode Selector */}
            <div className="mode-selector h-0">
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
            <div className="w-full max-w-4xl flex flex-col flex-grow overflow-hidden">
              {/* Chat Interface */}
              <div className="flex-1 overflow-auto p-4 mt-16">
                <Result
                  query={query}
                  setQuery={setQuery}
                  model={selectedModel}
                  userId={userId}
                  pipelineUrl={pipeline?.deploymentUrl || ''}
                  searchLimit={searchLimit}
                  searchFilters={safeJsonParse(searchFilters)}
                  ragTemperature={temperature}
                  ragTopP={topP}
                  ragTopK={top_k}
                  ragMaxTokensToSample={maxTokensToSample}
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
