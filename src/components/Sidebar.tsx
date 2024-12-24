import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useUserContext } from '@/context/UserContext';
import { SidebarProps } from '@/types';

interface Conversation {
  id: string;
  createdAt: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
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
        const response = await client.conversations.list({
          offset: 0,
          limit: 500,
        });
        console.log('Conversations:', response);
        setConversations(response.results);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };

    fetchConversations();
  }, [getClient]);

  return (
    <>
      <div
        className={`fixed left-0 top-16 z-50 h-[calc(100%-4rem)] w-80 bg-zinc-800 transition-transform duration-300 ease-in-out overflow-hidden`}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="p-4 overflow-y-auto h-[calc(100%-var(--header-height))]">
          {/* Conversation History */}
          {/* {config.showConversations && (
            <div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-accent-base">
                  Conversations
                </h3>
                <div className="max-h-60 overflow-y-auto">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-2 hover:bg-zinc-700 cursor-pointer"
                      onClick={() => {
                        if (onConversationSelect) {
                          onConversationSelect(conversation.id);
                        }
                      }}
                    >
                      {new Date(conversation.createdAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )} */}

          <h3 className="text-lg font-semibold text-accent-base mt-2">
            Search Settings
          </h3>

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

          <div className="flex flex-col gap-2">
            <Label htmlFor="selectedCollections">Selected Collections</Label>
            <MultiSelect
              id="selectedCollections"
              options={collections.map((collection) => ({
                value: collection.id,
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
                <AccordionTrigger className="text-lg font-semibold text-accent-base pt-4">
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
                    <Select
                      value={indexMeasure}
                      onValueChange={setIndexMeasure}
                    >
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

                    {/* <Label htmlFor="includeMetadatas">Include Metadatas</Label>
                    <SingleSwitch
                      id="includeMetadatas"
                      initialChecked={includeMetadatas || false}
                      onChange={(id, checked) => setIncludeMetadatas(checked)}
                      label="Include Metadatas"
                    /> */}

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
                <AccordionTrigger className="text-lg font-semibold text-accent-base pt-4">
                  Hybrid Search Settings
                </AccordionTrigger>
                <AccordionContent className="mx-1">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fullTextWeight">Full Text Weight</Label>
                    <Input
                      id="fullTextWeight"
                      type="number"
                      value={fullTextWeight}
                      onChange={(e) =>
                        setFullTextWeight(Number(e.target.value))
                      }
                    />

                    <Label htmlFor="semanticWeight">Semantic Weight</Label>
                    <Input
                      id="semanticWeight"
                      type="number"
                      value={semanticWeight}
                      onChange={(e) =>
                        setSemanticWeight(Number(e.target.value))
                      }
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
                <AccordionTrigger className="text-lg font-semibold text-accent-base pt-4">
                  KG Search Settings
                </AccordionTrigger>
                <AccordionContent className="mx-1">
                  <div className="space-y-2">
                    {/* <div className="flex flex-col gap-2">
                      <Label htmlFor="kgSearchLevel">KG Search Level</Label>
                      <Input
                        id="kgSearchLevel"
                        type="number"
                        value={kgSearchLevel === null ? '' : kgSearchLevel}
                        onChange={(e) => setKgSearchLevel(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </div> */}

                    {/* <div className="flex flex-col gap-2">
                      <Label htmlFor="maxCommunityDescriptionLength">
                        Max Community Description Length
                      </Label>
                      <Input
                        id="maxCommunityDescriptionLength"
                        type="number"
                        value={maxCommunityDescriptionLength}
                        onChange={(e) => setMaxCommunityDescriptionLength(Number(e.target.value))}
                      />
                    </div> */}

                    {/* <div className="flex flex-col gap-2">
                      <Label htmlFor="localSearchLimits">Local Search Limits</Label>
                      <Input
                        id="localSearchLimits"
                        type="text"
                        value={JSON.stringify(localSearchLimits)}
                        onChange={(e) => {
                          try {
                            setLocalSearchLimits(JSON.parse(e.target.value));
                          } catch (error) {
                            console.error("Invalid JSON input for localSearchLimits");
                          }
                        }}
                      />
                    </div> */}
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
                  <AccordionTrigger className="text-lg font-semibold text-accent-base pt-4">
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
                      <Label htmlFor="topK">Top K</Label>f
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

          <br />
        </div>
      </div>
      <button
        className={`fixed left-0 top-0 z-50 h-full w-6 bg-zinc-1000 flex items-center justify-center transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-80' : 'translate-x-0'
        }`}
        onClick={onToggle}
      >
        {isOpen ? (
          <ChevronLeft className="h-6 w-6 text-white" />
        ) : (
          <ChevronRight className="h-6 w-6 text-white" />
        )}
      </button>
    </>
  );
};

export default Sidebar;
