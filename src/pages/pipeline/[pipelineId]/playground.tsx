import { Loader } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';

import ConfigurationSheet from '@/components/ChatDemo/ConfigurationSheet';
import { Result } from '@/components/ChatDemo/result';
import { Search } from '@/components/ChatDemo/search';
import SingleSwitch from '@/components/ChatDemo/SingleSwitch';
import useSwitchManager from '@/components/ChatDemo/SwitchManager';
import { Title } from '@/components/ChatDemo/title';
import Layout from '@/components/Layout';
import ModelSelector from '@/components/ui/ModelSelector';
import { useToast } from '@/components/ui/use-toast';
import UserSelector from '@/components/ui/UserSelector';
import { useUserContext } from '@/context/UserContext';

import { R2RClient } from '../../../r2r-ts-client';
import { R2RDocumentsOverviewRequest } from '../../../r2r-ts-client/models';

import Neo4jGraph from './Neo4jGraph';

const Index: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  let query = '';
  if (searchParams) {
    query = decodeURIComponent(searchParams.get('q') || '');
  }

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('query');

  const { switches, initializeSwitch, updateSwitch } = useSwitchManager();

  const [temperature, setTemperature] = useState(0.1);
  const [topP, setTopP] = useState(1);
  const [top_k, setTop_k] = useState(100);
  const [max_tokens_to_sample, setMax_tokens_to_sample] = useState(1024);
  const [kg_temperature, setKgTemperature] = useState(0.1);
  const [kg_top_p, setKgTopP] = useState(1);
  const [kg_top_k, setKgTop_k] = useState(100);
  const [kg_max_tokens_to_sample, setKgMax_tokens_to_sample] = useState(1024);

  const [graphDimensions, setGraphDimensions] = useState({
    width: 0,
    height: 0,
  });
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState('063edaf8-3e63-4cb9-a4d6-a855f36376c3');

  useEffect(() => {
    initializeSwitch(
      'vector_search',
      true,
      'Vector Search',
      'Vector search is a search method that uses vectors to represent documents and queries. It is used to find similar documents to a given query.'
    );
    initializeSwitch(
      'hybrid_search',
      false,
      'Hybrid Search',
      'Hybrid search is a search method that combines multiple search methods to provide more accurate and relevant search results.'
    );
    initializeSwitch(
      'knowledge_graph_search',
      false,
      'Knowledge Graph Search',
      'Knowledge graph search is a search method that uses knowledge graphs to provide more accurate and relevant search results.'
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
    if (apiUrl) {
      const documentsOverviewRequest: R2RDocumentsOverviewRequest = {
        document_ids: [],
        user_ids: [],
      };
      const client = new R2RClient(apiUrl);
      setIsLoading(true);
      client
        .documentsOverview(documentsOverviewRequest)
        .then((documents) => {
          setUploadedDocuments(documents['results']);
        })
        .catch((error) => {
          console.error('Error fetching user documents:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [apiUrl]);

  useEffect(() => {
    const updateDimensions = () => {
      if (contentAreaRef.current) {
        setGraphDimensions({
          width: contentAreaRef.current.offsetWidth,
          height: contentAreaRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen">
        <div className="relative inset-0 bg-zinc-900 mt-1 mt-[4rem]">
          {isLoading && (
            <Loader className="mx-auto mt-20 animate-spin" size={64} />
          )}
          {!isLoading && (
            <>
              <div className="mx-auto max-w-7xl mb-8 mt-4 relative inset-4 md:inset-1">
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <label
                      htmlFor="apiUrl"
                      className="block text-sm font-medium text-zinc-300"
                    >
                      Pipeline URL
                    </label>
                    <input
                      type="text"
                      id="apiUrl"
                      name="apiUrl"
                      value={pipeline?.deploymentUrl}
                      disabled={true}
                      className="text-gray-500 mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-not-allowed"
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex">
                      <button
                        className={`px-4 py-2 rounded-l ${
                          activeTab === 'query'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => setActiveTab('query')}
                      >
                        Query
                      </button>
                      <button
                        className={`px-4 py-2 rounded-r ${
                          activeTab === 'graph'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => setActiveTab('graph')}
                      >
                        Graph
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-auto max-w-7xl inset-4 md:inset-8 flex h-[calc(100vh-180px)]">
                <div
                  className="bg-zinc-800 p-4 rounded-l-2xl border-2 border-zinc-600 flex flex-col justify-between h-full"
                  style={{ width: `${sidebarWidth}px` }}
                >
                  <div className="flex flex-col space-y-6">
                    <div className="flex items-center space-y-6">
                      <h2 className="text-lg font-bold text-blue-500 mb-4">
                        Control Panel
                      </h2>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-300">
                        Generation Configs
                      </label>
                      <ConfigurationSheet
                        temperature={temperature}
                        setTemperature={setTemperature}
                        top_p={topP}
                        setTopP={setTopP}
                        top_k={top_k}
                        setTop_k={setTop_k}
                        max_tokens_to_sample={max_tokens_to_sample}
                        setMax_tokens_to_sample={setMax_tokens_to_sample}
                        kg_temperature={kg_temperature}
                        setKgTemperature={setKgTemperature}
                        kg_top_p={kg_top_p}
                        setKgTopP={setKgTopP}
                        kg_top_k={kg_top_k}
                        setKgTop_k={setKgTop_k}
                        kg_max_tokens_to_sample={kg_max_tokens_to_sample}
                        setKgMax_tokens_to_sample={setKgMax_tokens_to_sample}
                      />
                    </div>

                    {/* Switches */}
                    <div className="space-y-2">
                      {Object.keys(switches).map((id) => (
                        <SingleSwitch
                          key={id}
                          id={id}
                          initialChecked={switches[id].checked}
                          onChange={handleSwitchChange}
                          label={switches[id].label}
                          tooltipText={switches[id].tooltipText}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 mt-auto">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="model-selector"
                          className="text-sm font-medium text-zinc-300"
                        >
                          Model
                        </label>
                      </div>
                      <div id="model-selector">
                        <ModelSelector
                          selectedModel={selectedModel}
                          setSelectedModel={setSelectedModel}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="user-selector"
                          className="text-sm font-medium text-zinc-300"
                        >
                          User ID
                        </label>
                      </div>
                      <div id="user-selector">
                        <UserSelector
                          selectedUserId={userId}
                          setSelectedUserId={setUserId}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  ref={contentAreaRef}
                  className="flex-1 bg-zinc-800 rounded-r-2xl relative border-2 border-zinc-600 h-full overflow-hidden"
                >
                  <div className="h-20 pointer-events-none w-full backdrop-filter absolute top-0"></div>
                  <div className="px-4 md:px-8 pt-6 pb-24 h-full">
                    {activeTab === 'query' && (
                      <>
                        <Title
                          query={query}
                          userId={userId}
                          model={selectedModel}
                          setModel={setSelectedModel}
                        ></Title>
                        <Result
                          query={query}
                          model={selectedModel}
                          userId={userId}
                          apiUrl={apiUrl}
                          temperature={temperature}
                          topP={topP}
                          topK={top_k}
                          maxTokensToSample={max_tokens_to_sample}
                          uploadedDocuments={uploadedDocuments}
                          setUploadedDocuments={setUploadedDocuments}
                          switches={switches}
                        ></Result>
                      </>
                    )}
                    {activeTab === 'graph' && (
                      <div className="w-full h-full">
                        <Neo4jGraph
                          width={graphDimensions.width}
                          height={graphDimensions.height}
                        />
                      </div>
                    )}
                  </div>
                  <div className="h-80 pointer-events-none w-full backdrop-filter absolute bottom-0 bg-gradient-to-b from-transparent to-zinc-900 [mask-image:linear-gradient(to_top,zinc-800,transparent)]"></div>
                  <div className="absolute inset-x-0 bottom-6 px-4 md:px-8">
                    <div className="w-full">
                      <Search pipeline={pipeline}></Search>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default Index;
