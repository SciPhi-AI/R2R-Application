import { ChevronDown, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import SingleSwitch from '@/components/ChatDemo/SingleSwitch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModelSelector from '@/components/ui/ModelSelector';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useUserContext } from '@/context/UserContext';

interface Collection {
  collection_id: string;
  name: string;
}

interface Conversation {
  conversation_id: string;
  created_at: string;
}

interface Switch {
  checked: boolean;
  label: string;
  tooltipText: string;
}

interface SidebarConfig {
  showVectorSearch: boolean;
  showHybridSearch: boolean;
  showKGSearch: boolean;
  showRagGeneration: boolean;
  showConversations?: boolean;
}

interface SidebarProps {
  switches: Record<string, Switch>;
  handleSwitchChange: (id: string, checked: boolean) => void;
  searchLimit: number;
  setSearchLimit: (limit: number) => void;
  searchFilters: string;
  setSearchFilters: (filters: string) => void;
  collections: Collection[];
  selectedCollectionIds: string[];
  setSelectedCollectionIds: (ids: string[]) => void;
  config: SidebarConfig;
  indexMeasure: string;
  setIndexMeasure: (measure: string) => void;
  includeMetadatas?: boolean;
  setIncludeMetadatas?: (include: boolean) => void;
  probes?: number;
  setProbes: (probes: number) => void;
  efSearch?: number;
  setEfSearch: (ef: number) => void;
  fullTextWeight?: number;
  setFullTextWeight: (weight: number) => void;
  semanticWeight?: number;
  setSemanticWeight: (weight: number) => void;
  fullTextLimit?: number;
  setFullTextLimit: (limit: number) => void;
  rrfK?: number;
  setRrfK: (k: number) => void;
  kgSearchLevel: number | null;
  setKgSearchLevel: (level: number | null) => void;
  maxCommunityDescriptionLength: number;
  setMaxCommunityDescriptionLength: (length: number) => void;
  localSearchLimits: Record<string, number>;
  setLocalSearchLimits: (limits: Record<string, number>) => void;
  temperature?: number;
  setTemperature?: (temp: number) => void;
  topP?: number;
  setTopP?: (p: number) => void;
  topK?: number;
  setTopK?: (k: number) => void;
  maxTokensToSample?: number;
  setMaxTokensToSample?: (tokens: number) => void;
  onConversationSelect?: (id: string) => void;
}

const AppSidebar: React.FC<SidebarProps> = ({
  switches,
  handleSwitchChange,
  searchLimit,
  setSearchLimit,
  searchFilters,
  setSearchFilters,
  collections,
  selectedCollectionIds,
  setSelectedCollectionIds,
  config,
  indexMeasure,
  setIndexMeasure,
  includeMetadatas,
  setIncludeMetadatas,
  probes,
  setProbes,
  efSearch,
  setEfSearch,
  fullTextWeight,
  setFullTextWeight,
  semanticWeight,
  setSemanticWeight,
  fullTextLimit,
  setFullTextLimit,
  rrfK,
  setRrfK,
  kgSearchLevel,
  setKgSearchLevel,
  maxCommunityDescriptionLength,
  setMaxCommunityDescriptionLength,
  localSearchLimits,
  setLocalSearchLimits,
  temperature,
  setTemperature,
  topP,
  setTopP,
  topK,
  setTopK,
  maxTokensToSample,
  setMaxTokensToSample,
  onConversationSelect,
}) => {
  const { selectedModel, setSelectedModel } = useUserContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { getClient } = useUserContext();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }
        const response = await client.conversationsOverview(undefined, 0, 500);
        console.log('Conversations:', response);
        setConversations(response.results);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };

    fetchConversations();
  }, [getClient]);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="fixed left-0 h-[calc(100vh-var(--header-height))] border-r border-zinc-800 bg-zinc-900 transition-all duration-200"
      style={{ top: 'var(--header-height)' }}
    >
      <SidebarHeader className="border-b p-4">
        {config.showConversations && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-indigo-400">
              Conversations
            </h3>
            <div className="max-h-60 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversation_id}
                  className="p-2 hover:bg-zinc-700 cursor-pointer"
                  onClick={() => {
                    if (onConversationSelect) {
                      onConversationSelect(conversation.conversation_id);
                    }
                  }}
                >
                  {new Date(conversation.created_at).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold text-indigo-400">
          Search Settings
        </h3>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
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

        <div className="flex flex-col gap-2 mb-4">
          <Label htmlFor="selectedCollections">Selected Collections</Label>
          <MultiSelect
            id="selectedCollections"
            options={collections.map((collection) => ({
              value: collection.collection_id,
              label: collection.name,
            }))}
            value={selectedCollectionIds}
            onChange={setSelectedCollectionIds}
          />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {/* Vector Search Settings */}
          {config.showVectorSearch && (
            <AccordionItem value="vectorSearchSettings">
              <AccordionTrigger className="text-lg font-semibold text-indigo-400 pt-4">
                Vector Search Settings
              </AccordionTrigger>
              <AccordionContent className="mx-1">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="searchLimit">Search Results Limit</Label>
                  <Input
                    id="searchLimit"
                    type="number"
                    value={searchLimit}
                    onChange={(e) => setSearchLimit(Number(e.target.value))}
                  />

                  <Label htmlFor="searchFilters">Search Filters</Label>
                  <Input
                    id="searchFilters"
                    type="text"
                    value={searchFilters}
                    onChange={(e) => setSearchFilters(e.target.value)}
                  />

                  <Label htmlFor="indexMeasure">Index Measure</Label>
                  <Select value={indexMeasure} onValueChange={setIndexMeasure}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select index measure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cosine_distance">Cosine</SelectItem>
                      <SelectItem value="l2_distance">Euclidean</SelectItem>
                      <SelectItem value="max_inner_product">
                        Dot Product
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Label htmlFor="probes">Probes</Label>
                  <Input
                    id="probes"
                    type="number"
                    value={probes}
                    onChange={(e) => setProbes(Number(e.target.value))}
                  />

                  <Label htmlFor="efSearch">EF Search</Label>
                  <Input
                    id="efSearch"
                    type="number"
                    value={efSearch}
                    onChange={(e) => setEfSearch(Number(e.target.value))}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Hybrid Search Settings */}
          {config.showHybridSearch && (
            <AccordionItem value="hybridSearchSettings">
              <AccordionTrigger className="text-lg font-semibold text-indigo-400 pt-4">
                Hybrid Search Settings
              </AccordionTrigger>
              <AccordionContent className="mx-1">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullTextWeight">Full Text Weight</Label>
                  <Input
                    id="fullTextWeight"
                    type="number"
                    value={fullTextWeight}
                    onChange={(e) => setFullTextWeight(Number(e.target.value))}
                  />

                  <Label htmlFor="semanticWeight">Semantic Weight</Label>
                  <Input
                    id="semanticWeight"
                    type="number"
                    value={semanticWeight}
                    onChange={(e) => setSemanticWeight(Number(e.target.value))}
                  />

                  <Label htmlFor="fullTextLimit">Full Text Limit</Label>
                  <Input
                    id="fullTextLimit"
                    type="number"
                    value={fullTextLimit}
                    onChange={(e) => setFullTextLimit(Number(e.target.value))}
                  />

                  <Label htmlFor="rrfK">RRF K</Label>
                  <Input
                    id="rrfK"
                    type="number"
                    value={rrfK}
                    onChange={(e) => setRrfK(Number(e.target.value))}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Knowledge Graph Settings */}
          {config.showKGSearch && (
            <AccordionItem value="kgSearchSettings">
              <AccordionTrigger className="text-lg font-semibold text-indigo-400 pt-4">
                KG Search Settings
              </AccordionTrigger>
              <AccordionContent className="mx-1">
                <div className="space-y-2">
                  {/* KG Search settings inputs */}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* RAG Generation Settings */}
          {config.showRagGeneration &&
            temperature !== undefined &&
            setTemperature !== undefined &&
            topP !== undefined &&
            setTopP !== undefined &&
            topK !== undefined &&
            setTopK !== undefined &&
            maxTokensToSample !== undefined &&
            setMaxTokensToSample !== undefined && (
              <AccordionItem value="ragGenerationSettings">
                <AccordionTrigger className="text-lg font-semibold text-indigo-400 pt-4">
                  RAG Generation Settings
                </AccordionTrigger>
                <AccordionContent className="mx-1">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="model">Model</Label>
                    <ModelSelector id="sidebar-model-selector" />
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <Label htmlFor="topP">Top P</Label>
                    <Input
                      id="topP"
                      type="number"
                      value={topP}
                      onChange={(e) => setTopP(Number(e.target.value))}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <Label htmlFor="topK">Top K</Label>
                    <Input
                      id="topK"
                      type="number"
                      value={topK}
                      onChange={(e) => setTopK(Number(e.target.value))}
                    />
                    <Label htmlFor="maxTokens">Max Tokens to Sample</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={maxTokensToSample}
                      onChange={(e) =>
                        setMaxTokensToSample(Number(e.target.value))
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
