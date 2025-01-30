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

  useEffect(() => {
    if (searchParams) {
      setQuery(decodeURIComponent(searchParams.get('q') || ''));
    }
  }, [searchParams]);

  // NOTE: Grab the selectedModel and its setter from the user context.
  const { pipeline, getClient, selectedModel, setSelectedModel } =
    useUserContext();

  const toggleSidebar = () => {
    setSidebarIsOpen(!sidebarIsOpen);
  };

  const [isLoading, setIsLoading] = useState(true);

  const { switches, initializeSwitch, updateSwitch } = useSwitchManager();

  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1);
  const [top_k, setTop_k] = useState(100);
  const [maxTokensToSample, setmaxTokensToSample] = useState(4096);
  const [kg_temperature, setKgTemperature] = useState(0.1);
  const [kg_topP, setKgTopP] = useState(1);
  const [kg_top_k, setKgTop_k] = useState(100);
  const [kg_maxTokensToSample, setKgmaxTokensToSample] = useState(1024);
  // Add new state for tool toggles
  const [webSearch, setWebSearch] = useState(true);
  const [magnify, setMagnify] = useState(true);
  const [contextTool, setContextTool] = useState(true);

  const getEnabledTools = () => {
    const enabledTools = [];
    if (webSearch) enabledTools.push('web_search');
    if (magnify) enabledTools.push('local_search');
    if (contextTool) enabledTools.push('content');
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

  // console.log('getEnabledTools() = ', getEnabledTools());

  return (
    <Layout pageTitle="Agentic RAG with R2R" includeFooter={false}>
      {/* <div className="flex flex-col h-screen-[calc(100%-4rem)] overflow-hidden"> */}
      <div className="flex h-[calc(100vh-4rem)]"> {/* Subtract navbar height */}

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

        {/* Main Content */}
        <div className='flex-1 flex flex-col overflow-y-auto'>
          <div
            className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out ${
              sidebarIsOpen ? 'ml-80' : 'ml-6'
            }`}
            ref={contentAreaRef}
          >
            {/* <div className="w-full max-w-4xl flex flex-col flex-grow"> */}
            <div className="w-full max-w-4xl mx-auto px-4 py-4 flex flex-col h-full">

              {/* Chat Interface */}

              {/* Mode and Model selectors in a single row */}
              <div className="flex items-center justify-between mb-4">
                {/* Left: Mode Selector */}
                <div className="mode-selector">
                  <Select value={mode} onValueChange={handleModeChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="rag">RAG Q&A</SelectItem> */}
                      <SelectItem value="rag_agent">Reasoning Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Right: Model Selector */}
                <div className="model-selector">
                  <Select
                    value={selectedModel || 'azure/gpt-4o'}
                    onValueChange={(val) => setSelectedModel(val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                    {/* <SelectItem value="gemini/gemini-2.0-flash-thinking-exp-01-21">gemini-2.0-flash</SelectItem> */}
                    {/* <SelectItem value="azure/gpt-4o">gpt-4o</SelectItem> */}
                    <SelectItem value="anthropic/claude-3-5-sonnet-20241022">
                        claude-3-5-sonnet
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                  enabledTools={getEnabledTools()}
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
                  webSearch={webSearch}
                  setWebSearch={setWebSearch}
                  magnify={magnify}
                  setMagnify={setMagnify}
                  contextTool={contextTool}
                  setContextTool={setContextTool}
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


// 'use client';
// import { useSearchParams } from 'next/navigation';
// import { MessageResponse } from 'r2r-js';
// import React, { useState, useEffect, useRef } from 'react';

// import { Result } from '@/components/ChatDemo/result';
// import { Search } from '@/components/ChatDemo/search';
// import useSwitchManager from '@/components/ChatDemo/SwitchManager';
// import Layout from '@/components/Layout';
// import Sidebar from '@/components/Sidebar';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { useToast } from '@/components/ui/use-toast';
// import { useUserContext } from '@/context/UserContext';
// import { Message } from '@/types';

// interface Collection {
//   id: string;
//   name: string;
// }

// const Index: React.FC = () => {
//   const searchParams = useSearchParams();
//   const { toast } = useToast();
//   const [query, setQuery] = useState('');
//   const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
//   const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
//     []
//   );
//   const [selectedConversationId, setSelectedConversationId] = useState<
//     string | null
//   >(null);
//   const [messages, setMessages] = useState<Message[]>([]);

//   const [searchLimit, setSearchLimit] = useState<number>(50);
//   const [searchFilters, setSearchFilters] = useState('{}');
//   const [indexMeasure, setIndexMeasure] = useState<string>('cosine_distance');
//   const [includeMetadatas, setIncludeMetadatas] = useState<boolean>(false);
//   const [probes, setProbes] = useState<number>();
//   const [efSearch, setEfSearch] = useState<number>();
//   const [fullTextWeight, setFullTextWeight] = useState<number>(1);
//   const [semanticWeight, setSemanticWeight] = useState<number>(10);
//   const [fullTextLimit, setFullTextLimit] = useState<number>(100);
//   const [rrfK, setRrfK] = useState<number>(5);
//   const [maxLlmQueries, setMaxLlmQueries] = useState<number>();
//   const [kgSearchLevel, setKgSearchLevel] = useState<number | null>(null);
//   const [maxCommunityDescriptionLength, setMaxCommunityDescriptionLength] =
//     useState<number>(100);
//   const [localSearchLimits, setLocalSearchLimits] = useState<
//     Record<string, number>
//   >({});
//   const [mode, setMode] = useState<'rag' | 'rag_agent'>('rag_agent');
//   const [sidebarIsOpen, setSidebarIsOpen] = useState(true);

//   useEffect(() => {
//     if (searchParams) {
//       setQuery(decodeURIComponent(searchParams.get('q') || ''));
//     }
//   }, [searchParams]);

//   // NOTE: Grab the selectedModel and its setter from the user context.
//   const { pipeline, getClient, selectedModel, setSelectedModel } = useUserContext();

//   const toggleSidebar = () => {
//     setSidebarIsOpen(!sidebarIsOpen);
//   };

//   const [isLoading, setIsLoading] = useState(true);

//   const { switches, initializeSwitch, updateSwitch } = useSwitchManager();

//   const [temperature, setTemperature] = useState(0.7);
//   const [topP, setTopP] = useState(1);
//   const [top_k, setTop_k] = useState(100);
//   const [maxTokensToSample, setmaxTokensToSample] = useState(4096);
//   const [kg_temperature, setKgTemperature] = useState(0.1);
//   const [kg_topP, setKgTopP] = useState(1);
//   const [kg_top_k, setKgTop_k] = useState(100);
//   const [kg_maxTokensToSample, setKgmaxTokensToSample] = useState(1024);
//   // Add new state for tool toggles
//   const [webSearch, setWebSearch] = useState(true);
//   const [magnify, setMagnify] = useState(true);
//   const [contextTool, setContextTool] = useState(true);

//   const getEnabledTools = () => {
//     const enabledTools = [];
//     if (webSearch) enabledTools.push('web_search');
//     if (magnify) enabledTools.push('local_search');
//     if (contextTool) enabledTools.push('content');
//     return enabledTools;
//   };

//   const [graphDimensions, setGraphDimensions] = useState({
//     width: 0,
//     height: 0,
//   });
//   const contentAreaRef = useRef<HTMLDivElement>(null);
//   const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
//   const [collections, setCollections] = useState<Collection[]>([]);

//   const [userId, setUserId] = useState(null);

//   useEffect(() => {
//     setQuery('');
//   }, [mode]);

//   useEffect(() => {
//     initializeSwitch(
//       'vectorSearch',
//       true,
//       'Vector Search',
//       'Vector search is a search method that uses vectors to represent documents and queries.'
//     );
//     initializeSwitch(
//       'knowledgeGraphSearch',
//       true,
//       'Graph Search',
//       'Please construct a Knowledge Graph to use this feature.'
//     );
//     initializeSwitch(
//       'hybridSearch',
//       false,
//       'Hybrid Search',
//       'Hybrid search is a search method that combines multiple search methods.'
//     );
//   }, [initializeSwitch]);

//   const handleSwitchChange = (id: string, checked: boolean) => {
//     updateSwitch(id, checked);
//     toast({
//       title: `${switches[id].label} status changed`,
//       description: (
//         <pre className="mt-2 mb-2 w-[340px] rounded-md bg-slate-950 p-4">
//           <code className="text-white">
//             {JSON.stringify({ [id]: checked }, null, 2)}
//           </code>
//         </pre>
//       ),
//     });
//   };

//   useEffect(() => {
//     const fetchDocuments = async () => {
//       if (pipeline) {
//         try {
//           const client = await getClient();
//           if (!client) {
//             throw new Error('Failed to get authenticated client');
//           }
//           setIsLoading(true);
//           const documents = await client.documents.list();
//           setUploadedDocuments(documents.results.map((doc) => doc.id));
//         } catch (error) {
//           console.error('Error fetching user documents:', error);
//         } finally {
//           setIsLoading(false);
//           setHasAttemptedFetch(true);
//         }
//       }
//     };

//     fetchDocuments();
//   }, [pipeline, getClient]);

//   useEffect(() => {
//     const fetchCollections = async () => {
//       if (pipeline) {
//         try {
//           const client = await getClient();
//           if (!client) {
//             throw new Error('Failed to get authenticated client');
//           }
//           const collectionsData = await client.collections.list();
//           setCollections(
//             collectionsData.results.map((collection: Collection) => ({
//               id: collection.id,
//               name: collection.name,
//             }))
//           );
//         } catch (error) {
//           console.error('Error fetching collections:', error);
//         }
//       }
//     };

//     fetchCollections();
//   }, [pipeline, getClient]);

//   const safeJsonParse = (jsonString: string) => {
//     if (typeof jsonString !== 'string') {
//       console.warn('Input is not a string:', jsonString);
//       return {};
//     }
//     try {
//       return JSON.parse(jsonString);
//     } catch (error) {
//       console.warn('Invalid JSON input:', error);
//       return {};
//     }
//   };

//   const handleAbortRequest = () => {
//     setQuery('');
//   };

//   const handleModeChange = (newMode: 'rag' | 'rag_agent') => {
//     setMode(newMode);
//   };

//   const handleConversationSelect = async (conversationId: string) => {
//     setSelectedConversationId(conversationId);
//     try {
//       const client = await getClient();
//       if (!client) {
//         throw new Error('Failed to get authenticated client');
//       }
//       const response = await client.conversations.retrieve({
//         id: conversationId,
//       });
//       const fetchedMessages = response.results.map(
//         (message: MessageResponse) => ({
//           id: message.id,
//           role: message.message?.role || 'user',
//           content: message.message?.content || '',
//           timestamp: message.metadata?.timestamp || new Date().toISOString(),
//         })
//       );
//       setMessages(fetchedMessages);
//     } catch (error) {
//       console.error('Error fetching conversation:', error);
//     }
//   };

//   // Make sure we have a default model if none is set:
//   useEffect(() => {
//     if (!selectedModel) {
//       setSelectedModel('anthropic/claude-3-5-sonnet-20241022');
//     }
//   }, [selectedModel, setSelectedModel]);

//   console.log('getEnabledTools() = ', getEnabledTools());

//   return (
//     <Layout pageTitle="Chat" includeFooter={false}>
//       <div className="flex flex-col h-screen-[calc(100%-4rem)] overflow-hidden">
//         <Sidebar
//           isOpen={sidebarIsOpen}
//           onToggle={toggleSidebar}
//           switches={switches}
//           handleSwitchChange={handleSwitchChange}
//           searchLimit={searchLimit}
//           setSearchLimit={setSearchLimit}
//           searchFilters={searchFilters}
//           setSearchFilters={setSearchFilters}
//           collections={collections}
//           selectedCollectionIds={selectedCollectionIds}
//           setSelectedCollectionIds={setSelectedCollectionIds}
//           indexMeasure={indexMeasure}
//           setIndexMeasure={setIndexMeasure}
//           includeMetadatas={includeMetadatas}
//           setIncludeMetadatas={setIncludeMetadatas}
//           probes={probes}
//           setProbes={setProbes}
//           efSearch={efSearch}
//           setEfSearch={setEfSearch}
//           fullTextWeight={fullTextWeight}
//           setFullTextWeight={setFullTextWeight}
//           semanticWeight={semanticWeight}
//           setSemanticWeight={setSemanticWeight}
//           fullTextLimit={fullTextLimit}
//           setFullTextLimit={setFullTextLimit}
//           rrfK={rrfK}
//           setRrfK={setRrfK}
//           kgSearchLevel={kgSearchLevel}
//           setKgSearchLevel={setKgSearchLevel}
//           maxCommunityDescriptionLength={maxCommunityDescriptionLength}
//           setMaxCommunityDescriptionLength={setMaxCommunityDescriptionLength}
//           localSearchLimits={localSearchLimits}
//           setLocalSearchLimits={setLocalSearchLimits}
//           temperature={temperature}
//           setTemperature={setTemperature}
//           topP={topP}
//           setTopP={setTopP}
//           topK={top_k}
//           setTopK={setTop_k}
//           maxTokensToSample={maxTokensToSample}
//           setMaxTokensToSample={setmaxTokensToSample}
//           config={{
//             showVectorSearch: true,
//             showHybridSearch: true,
//             showKGSearch: false,
//             showRagGeneration: true,
//             showConversations: true,
//           }}
//           onConversationSelect={handleConversationSelect}
//         />

//         {/* Main Content */}
//         <div
//           className={`main-content-wrapper ${sidebarIsOpen ? '' : 'sidebar-closed'}`}
//         >
//           <div
//             className={`main-content ${sidebarIsOpen ? '' : 'sidebar-closed'}`}
//             ref={contentAreaRef}
//           >
    

//             <div className="w-full max-w-4xl flex flex-col flex-grow overflow-hidden">
//               {/* Chat Interface */}
              
//             {/* Mode and Model selectors in a single row */}
//             <div className="flex items-center justify-between mb-4">
//                   {/* Left: Mode Selector */}
//                   <div className="mode-selector">
//                     <Select value={mode} onValueChange={handleModeChange}>
//                       <SelectTrigger className="w-[180px]">
//                         <SelectValue placeholder="Select Mode" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="rag">RAG Q&A</SelectItem>
//                         <SelectItem value="rag_agent">RAG Agent</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {/* Right: Model Selector */}
//                   <div className="model-selector">
//                     <Select
//                       value={selectedModel || 'azure/gpt-4o'}
//                       onValueChange={(val) => setSelectedModel(val)}
//                     >
//                       <SelectTrigger className="w-[180px]">
//                         <SelectValue placeholder="Select Model" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {/* <SelectItem value="azure/gpt-4o">gpt-4o</SelectItem> */}
//                         <SelectItem value="anthropic/claude-3-5-sonnet-20241022">claude-3-5-sonnet</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>              
//               <div className="flex-1 overflow-auto p-4 mt-16">
                
//                 <Result
//                   query={query}
//                   setQuery={setQuery}
//                   model={selectedModel}
//                   userId={userId}
//                   pipelineUrl={pipeline?.deploymentUrl || ''}
//                   searchLimit={searchLimit}
//                   searchFilters={safeJsonParse(searchFilters)}
//                   ragTemperature={temperature}
//                   ragTopP={topP}
//                   ragTopK={top_k}
//                   ragMaxTokensToSample={maxTokensToSample}
//                   uploadedDocuments={uploadedDocuments}
//                   setUploadedDocuments={setUploadedDocuments}
//                   switches={switches}
//                   hasAttemptedFetch={hasAttemptedFetch}
//                   mode={mode}
//                   selectedCollectionIds={selectedCollectionIds}
//                   onAbortRequest={handleAbortRequest}
//                   messages={messages}
//                   setMessages={setMessages}
//                   selectedConversationId={selectedConversationId}
//                   setSelectedConversationId={setSelectedConversationId}
//                   enabledTools={getEnabledTools()}
//                 />
//               </div>

//               {/* Search Bar */}
//               <div className="p-4 w-full">
//                 <Search
//                   pipeline={pipeline || undefined}
//                   setQuery={setQuery}
//                   placeholder={
//                     mode === 'rag'
//                       ? 'Ask a question...'
//                       : 'Start a conversation...'
//                   }
//                   disabled={uploadedDocuments?.length === 0 && mode === 'rag'}
//                   mode={mode}
//                   webSearch={webSearch}
//                   setWebSearch={setWebSearch}
//                   magnify={magnify}
//                   setMagnify={setMagnify}
//                   contextTool={contextTool}
//                   setContextTool={setContextTool}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Index;