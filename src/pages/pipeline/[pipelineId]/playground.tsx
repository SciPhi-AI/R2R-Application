'use client';
import { Cog8ToothIcon } from '@heroicons/react/24/outline';
import { Loader } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { Result } from '@/components/ChatDemo/result';
import { Search } from '@/components/ChatDemo/search';
import SingleSwitch from '@/components/ChatDemo/SingleSwitch';
import useSwitchManager from '@/components/ChatDemo/SwitchManager';
import { Title } from '@/components/ChatDemo/title';
import Layout from '@/components/Layout';
import { InfoIcon } from '@/components/ui/InfoIcon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModelSelector from '@/components/ui/ModelSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

import Neo4jGraph from './Neo4jGraph';
import { R2RClient } from '../../../r2r-js-client';

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
  const userId = '063edaf8-3e63-4cb9-a4d6-a855f36376c3';

  // OSS specific pipeline logic
  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;
  console.log('passing apiUrl = ', apiUrl);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('query');

  const { switches, initializeSwitch, updateSwitch } = useSwitchManager();

  const [temperature, setTemperature] = useState(0.1);
  const [topP, setTopP] = useState(1);
  const [top_k, setTop_k] = useState(100);
  const [max_tokens_to_sample, setMax_tokens_to_sample] = useState(1024);

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
      const client = new R2RClient(apiUrl);
      setIsLoading(true);
      client
        .getDocumentsInfo()
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
                      <span className="inline-block ml-1 relative cursor-pointer">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoIcon width="w-4" height="h-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                The URL where your R2R pipeline is deployed.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
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

              <div className="mx-auto max-w-7xl inset-4 md:inset-8 flex">
                <div
                  className="bg-zinc-800 p-3 rounded-l-2xl border-2 border-zinc-600"
                  style={{ width: `${sidebarWidth}px` }}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between pt-4">
                      <h2 className="text-lg text-ellipsis font-bold text-blue-500">
                        Control Panel
                      </h2>
                    </div>
                    <div className="border-b border-zinc-600"></div>
                    <div className="mt-2 mb-2">
                      <div>
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
                    <div className="mt-2 mb-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="model"
                          className="text-sm font-medium text-zinc-300 mb-3"
                        >
                          Model
                        </label>
                        <Sheet>
                          <SheetTrigger>
                            <Cog8ToothIcon className="h-6 w-6 mb-3" />
                          </SheetTrigger>
                          <SheetContent side="left">
                            <SheetHeader>
                              <SheetTitle>RAG Generation Config</SheetTitle>
                              <SheetDescription>
                                Set the parameters for your model.
                              </SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                              <div className="flex items-center justify-between gap-4">
                                <Label
                                  htmlFor="temperature"
                                  className="text-right"
                                >
                                  temperature
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Slider
                                    defaultValue={[temperature]}
                                    max={2}
                                    step={0.01}
                                    className="w-40"
                                    onValueChange={(value) =>
                                      setTemperature(value[0])
                                    }
                                  />
                                  <span className="text-sm">
                                    {temperature.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <Label htmlFor="topP" className="text-right">
                                  top_p
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Slider
                                    defaultValue={[topP]}
                                    max={1}
                                    step={0.01}
                                    className="w-40"
                                    onValueChange={(value) => setTopP(value[0])}
                                  />
                                  <span className="text-sm">
                                    {topP.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <Label htmlFor="top_k" className="text-right">
                                  top_k
                                </Label>
                                <Input
                                  id="top_k"
                                  value={top_k}
                                  className="col-span-1 w-24"
                                  onChange={(e) =>
                                    setTop_k(Number(e.target.value))
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <Label
                                  htmlFor="max_tokens_to_sample"
                                  className="text-right"
                                >
                                  max_tokens_to_sample
                                </Label>
                                <Input
                                  id="max_tokens_to_sample"
                                  value={max_tokens_to_sample}
                                  className="col-span-1 w-24"
                                  onChange={(e) =>
                                    setMax_tokens_to_sample(
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                      <ModelSelector
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                      />
                    </div>
                    <div className="mt-2 mb-2">
                      <label
                        htmlFor="userId"
                        className="block text-sm font-medium text-zinc-300"
                      >
                        User ID
                        <span className="inline-block ml-1 relative cursor-pointer">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoIcon width="w-4" height="h-4" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Each user interacts with the deployed pipeline
                                  through an allocated User ID.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      </label>
                      <Select value={userId}>
                        <SelectTrigger>
                          <SelectValue>{userId}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="userId">{userId}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-zinc-800 rounded-r-2xl relative border-2 border-zinc-600">
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
                      <div className="h-[calc(100vh-380px)] w-full">
                        <Neo4jGraph width={200} height={300} />
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
