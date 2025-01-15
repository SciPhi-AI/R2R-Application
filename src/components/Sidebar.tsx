import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

// Example: If your conversation objects have these fields:
interface Conversation {
  id: string;
  name?: string;         // some conversations might have a name
  createdAt: string;
  lastMessage?: string;  // optional: last message snippet
}
const LAST_N_CONVERSATIONS_TO_LIST = 5

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
  const { getClient } = useUserContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }
        // Adjust based on how your SDK returns data
        const response = await client.conversations.list({
          offset: 0,
          limit: 25,
        });
        // Example: If the raw data is in `response.results`
        const fetched = response.results.map((c: any) => ({
          id: c.id,
          // name: c.name?.slice(0, 20) + (c.name?.length > 25 ? "..." : ""), // Example: remove quotes
          //  modify above to remove leading and trailing quotes
          name: c.name?.replace(/^"|"$/g, '').slice(0, 20) + (c.name?.length > 25 ? "..." : ""),
          createdAt: c.created_at || c.createdAt,
          // If you have a lastMessage field or want to retrieve from messages
          lastMessage: c.last_message || 'No messages yet',
        })).filter(
          // Filter out conversations without a name
          (c: Conversation) => c.name != "undefined"
        ).slice(0, LAST_N_CONVERSATIONS_TO_LIST);
        console.log('fetched = ', fetched)
        setConversations(fetched);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, [getClient]);

  // 
  // Render the sidebar (collapsible). Add a conversation list that is visually appealing
  //
  return (
    <>
      <div
        className={`fixed left-0 top-16 z-50 h-[calc(100%-4rem)] w-80 bg-zinc-800 transition-transform duration-300 ease-in-out overflow-hidden`}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="p-4 overflow-y-auto h-[calc(100%-var(--header-height))]">
          {/* Conversations Section */}
          {config.showConversations && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-accent-base mb-2">
                Conversation History
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                {/* (Click on a conversation to load its messages) */}
              </p>
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    No conversations found.
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      // @ts-ignore
                      onClick={() => onConversationSelect(conv.id)}
                      className="w-full text-left p-3 rounded bg-zinc-700 hover:bg-zinc-600 transition flex flex-col"
                    >
                      {/* Top row: name or truncated ID, plus timestamp */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {conv.name
                            ? conv.name
                            : `Conversation ${conv.id.slice(0, 5)}...`}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(conv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Last message snippet (if available) */}
                      {conv.lastMessage && (
                        <p className="mt-1 text-xs text-gray-300 line-clamp-2 leading-snug">
                          {conv.lastMessage}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Search Settings Section */}
          <h3 className="text-lg font-semibold text-accent-base mt-2">
            Search Settings
            <Link
              href="https://r2r-docs.sciphi.ai/api-and-sdks/retrieval/retrieval"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-blue-400 text-gray-400 pl-2 "
              title="View Retrieval Documentation"
            >
              <ExternalLink size={16} className="text-accent-base" />
            </Link>
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

            {/* Knowledge Graph Settings (if applicable) */}
            {config.showKGSearch && (
              <AccordionItem value="kgSearchSettings">
                <AccordionTrigger className="text-lg font-semibold text-accent-base pt-4">
                  KG Search Settings
                </AccordionTrigger>
                <AccordionContent className="mx-1">
                  {/* Additional KG search fields here */}
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
                        min={0}
                        max={1}
                        step={0.1}
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
        </div>
      </div>

      {/* Sidebar toggle button */}
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