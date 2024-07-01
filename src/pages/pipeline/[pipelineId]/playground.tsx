'use client';
import { Loader } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { r2rClient } from 'r2r-js';
import React, { useState, useEffect, useRef } from 'react';

import ConfigurationSheet from '@/components/ChatDemo/ConfigurationSheet';
import { Result } from '@/components/ChatDemo/result';
import { Search } from '@/components/ChatDemo/search';
import SingleSwitch from '@/components/ChatDemo/SingleSwitch';
import { Sources } from '@/components/ChatDemo/sources';
import useSwitchManager from '@/components/ChatDemo/SwitchManager';
import { Title } from '@/components/ChatDemo/title';
import Layout from '@/components/Layout';
import ModelSelector from '@/components/ui/ModelSelector';
import { useToast } from '@/components/ui/use-toast';
import UserSelector from '@/components/ui/UserSelector';
import { usePipelineInfo } from '@/context/PipelineInfo';
import { useUserContext } from '@/context/UserContext';

import Neo4jGraph from './Neo4jGraph';

const Index: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (searchParams) {
      setQuery(decodeURIComponent(searchParams.get('q') || ''));
    }
  }, [searchParams]);

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const { pipeline, isLoading: isPipelineLoading } = usePipelineInfo();

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
    if (pipeline?.deploymentUrl) {
      const client = new r2rClient(pipeline?.deploymentUrl);
      setIsLoading(true);
      client
        .documentsOverview()
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
  }, [pipeline?.deploymentUrl]);

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
    <Layout isConnected={true} pageTitle="Playground">
      <div className="flex h-[calc(100vh)] pt-16">
        {/* Sidebar */}
        <div className="w-80 bg-zinc-800 p-4 flex flex-col">
          <h2 className="text-xl font-bold text-blue-500 mb-4">
            Control Panel
          </h2>

          {/* Configuration */}
          <div className="mb-4">
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
          <div className="space-y-2 mb-4">
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

          <div className="mt-auto">
            {/* Pipeline URL */}
            <input
              type="text"
              value={pipeline?.deploymentUrl}
              disabled={true}
              className="w-full bg-zinc-700 text-zinc-300 p-2 rounded"
            />
            {/* Model Selector */}
            <ModelSelector
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Chat Interface */}
          <div className="flex-1 overflow-auto p-4 mt-5">
            <Result
              query={query}
              setQuery={setQuery}
              model={selectedModel}
              userId={userId}
              apiUrl={pipeline?.deploymentUrl}
              temperature={temperature}
              topP={topP}
              topK={top_k}
              maxTokensToSample={max_tokens_to_sample}
              uploadedDocuments={uploadedDocuments}
              setUploadedDocuments={setUploadedDocuments}
              switches={switches}
            />
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-zinc-800">
            <Search pipeline={pipeline || undefined} setQuery={setQuery} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
