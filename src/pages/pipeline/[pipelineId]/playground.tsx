'use client';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';

import { Result } from '@/components/ChatDemo/result';
import { Search } from '@/components/ChatDemo/search';
import SingleSwitch from '@/components/ChatDemo/SingleSwitch';
import useSwitchManager from '@/components/ChatDemo/SwitchManager';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';
import { InfoIcon } from '@/components/ui/InfoIcon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModelSelector from '@/components/ui/ModelSelector';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { usePipelineInfo } from '@/context/PipelineInfo';
import { useUserContext } from '@/context/UserContext';

const Index: React.FC = () => {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [searchLimit, setSearchLimit] = useState(10);
  const [searchFilters, setSearchFilters] = useState('{}');

  useEffect(() => {
    if (searchParams) {
      setQuery(decodeURIComponent(searchParams.get('q') || ''));
    }
  }, [searchParams]);

  const { selectedModel } = useUserContext();
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const { pipeline, isLoading: isPipelineLoading } = usePipelineInfo();
  const [sidebarIsOpen, setSidebarIsOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarIsOpen(!sidebarIsOpen);
  };

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

  const [userId, setUserId] = useState(null);
  const { getClient } = useUserContext();

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
      if (pipeline?.pipelineId) {
        try {
          const client = await getClient(pipeline.pipelineId);
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
  }, [pipeline?.pipelineId, getClient]);

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

  const safeJsonParse = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Invalid JSON input:', error);
      return {};
    }
  };

  return (
    <Layout pageTitle="Playground" includeFooter={false}>
      <div className="flex h-[calc(100vh)] pt-16">
        <Sidebar
          isOpen={sidebarIsOpen}
          onToggle={toggleSidebar}
          switches={switches}
          handleSwitchChange={handleSwitchChange}
          searchLimit={searchLimit}
          setSearchLimit={setSearchLimit}
          searchFilters={searchFilters}
          setSearchFilters={setSearchFilters}
          selectedModel={selectedModel}
          top_k={top_k}
          setTop_k={setTop_k}
          max_tokens_to_sample={max_tokens_to_sample}
          setMax_tokens_to_sample={setMax_tokens_to_sample}
          temperature={temperature}
          setTemperature={setTemperature}
          topP={topP}
          setTopP={setTopP}
          pipelineUrl={pipeline?.deploymentUrl || ''}
        />

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarIsOpen ? 'ml-80' : 'ml-0'
          }`}
          style={{
            width: sidebarIsOpen ? 'calc(100% - 20rem)' : '100%',
          }}
        >
          <div className="w-full max-w-4xl flex flex-col flex-grow overflow-hidden">
            {/* Chat Interface */}
            <div className="flex-1 overflow-auto p-4 mt-5">
              <Result
                query={query}
                setQuery={setQuery}
                model={selectedModel}
                userId={userId}
                pipelineId={pipeline?.pipelineId || ''}
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
              />
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-zinc-800 w-full">
              <Search pipeline={pipeline || undefined} setQuery={setQuery} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
