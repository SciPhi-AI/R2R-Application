import {
  GenerationConfig,
  IndexMeasure,
  SearchSettings,
  GraphSearchSettings,
  ChunkSearchSettings,
} from 'r2r-js';
import React, { FC, useEffect, useState, useRef } from 'react';
import { ArrowDown } from 'lucide-react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useUserContext } from '@/context/UserContext';
import { Message } from '@/types';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import MessageBubble from './MessageBubble';
import { UploadButton } from './upload';

// Default URLs and constants
const DEFAULT_PRODUCTION_URL = 'https://api.sciphi.ai';
const DEFAULT_DEVELOPMENT_URL = 'http://0.0.0.0:7272';
const PRODUCTION_URL =
  process.env.NEXT_PUBLIC_PRODUCTION_API_URL || DEFAULT_PRODUCTION_URL;
const DEVELOPMENT_URL =
  process.env.NEXT_PUBLIC_DEVELOPMENT_API_URL || DEFAULT_DEVELOPMENT_URL;
const DEFAULT_DEPLOYMENT_URL =
  process.env.NEXT_PUBLIC_ENV === 'development'
    ? DEVELOPMENT_URL
    : PRODUCTION_URL;

// Helper to strip <Thought> tags from the final chainOfThought text
const cleanThought = (thought: string): string =>
  thought.replace(/<\/?Thought>/g, '').trim();

interface ResultProps {
  query: string;
  setQuery: (query: string) => void;
  userId: string | null;
  pipelineUrl: string | null;
  searchLimit: number;
  searchFilters: Record<string, unknown>;
  model: string | null;
  uploadedDocuments: string[];
  setUploadedDocuments: React.Dispatch<React.SetStateAction<string[]>>;
  hasAttemptedFetch: boolean;
  switches: any;
  mode: 'rag' | 'rag_agent';
  selectedCollectionIds: string[];
  onAbortRequest?: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedConversationId: string | null;
  setSelectedConversationId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  enabledTools: string[];
  research?: boolean;
  thinking?: boolean;
}

export const Result: FC<ResultProps> = ({
  query,
  setQuery,
  userId,
  pipelineUrl,
  searchLimit,
  searchFilters,
  uploadedDocuments,
  setUploadedDocuments,
  hasAttemptedFetch,
  switches,
  mode,
  selectedCollectionIds,
  onAbortRequest,
  messages,
  setMessages,
  selectedConversationId,
  setSelectedConversationId,
  enabledTools,
  research,
  thinking,
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  
  // Scroll-related state variables
  const [lastScrollUpTime, setLastScrollUpTime] = useState<number>(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // PDF preview state
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<string | null>(null);
  const [initialPage, setInitialPage] = useState<number>(1);

  const SCROLL_BACK_DELAY_MS = 3000;
  const { getClient } = useUserContext();

  // Reset conversation on mode change
  useEffect(() => {
    abortCurrentRequest();
    setMessages([]);
    setIsStreaming(false);
    setIsSearching(false);
    setError(null);
    setIsProcessingQuery(false);
  }, [mode, setMessages]);

  // Auto-scrolling logic
  useEffect(() => {
    // Save messages to localStorage
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    
    // If there's no container, exit early
    if (!containerRef.current) return;
    
    // Calculate scroll metrics
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Simple fixed threshold of 50px
    const userIsNearBottom = distanceFromBottom < 50;
    
    // Update scroll button visibility
    setShowScrollButton(!userIsNearBottom && messages.length > 0);
    
    // Check if enough time has passed since user scrolled up
    const now = Date.now();
    const enoughTimeSinceScrollUp = now - lastScrollUpTime > SCROLL_BACK_DELAY_MS;
    
    // Check if visible content has changed
    const lastMessage = messages[messages.length - 1];
    const isContentUpdate = lastMessage?.role === 'user' || 
                           (lastMessage?.role === 'assistant' && !lastMessage.isStreaming) ||
                           (isStreaming && lastMessage?.role === 'assistant');
    
    if ((userIsNearBottom || enoughTimeSinceScrollUp) && isContentUpdate) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, lastScrollUpTime, isStreaming]);

  // Detect user scrolling up
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      if (distanceFromBottom > 50) {
        setLastScrollUpTime(Date.now());
        setShowScrollButton(true && messages.length > 0);
      } else {
        setShowScrollButton(false);
      }
    };
    
    const ref = containerRef.current;
    if (!ref) return;
    
    ref.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      ref.removeEventListener('scroll', handleScroll);
    };
  }, [messages.length]);

  // Abort current request
  const abortCurrentRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (onAbortRequest) {
      onAbortRequest();
    }
  };

  // Update the assistant message with new content
  const updateAssistantMessage = (
    content: string,
    chainOfThought: string[],
    citations: any[],
    toolCalls: any[],
    toolResults: any[],
    isStreaming: boolean
  ) => {
    // Normalize citations for consistent structure
    const normalizedCitations = citations.map(cit => ({
      id: cit.id,
      object: 'citation',
      title: cit.title || cit.payload?.title || 'Source',
      snippet: cit.snippet || cit.payload?.snippet || '',
      link: cit.link || cit.payload?.link || '',
      payload: cit.payload || {}
    }));
    
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            content,
            chainOfThought,
            citations: normalizedCitations,
            toolCalls,
            toolResults,
            isStreaming,
          },
        ];
      } else {
        return [
          ...prev,
          {
            role: 'assistant',
            content,
            id: Date.now().toString(),
            timestamp: Date.now(),
            isStreaming,
            chainOfThought,
            citations: normalizedCitations,
            toolCalls,
            toolResults,
          },
        ];
      }
    });
  };

  // Main streaming function
  const parseStreaming = async (userQuery: string) => {
    if (isProcessingQuery) return;
  
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
  
    setIsProcessingQuery(true);
    setIsStreaming(true);
    setError(null);
  
    // 1) Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userQuery,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
  
    // 2) Add placeholder assistant message
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        id: (Date.now() + 1).toString(),
        timestamp: Date.now(),
        isStreaming: true,
        chainOfThought: [],
        citations: [],
        toolCalls: [],
        toolResults: [],
      },
    ]);
  
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }
  
      // If agent mode, ensure conversation
      let currentConversationId = selectedConversationId;
      if (!currentConversationId && mode === 'rag_agent') {
        const newConversation = await client.conversations.create();
        if (!newConversation?.results) {
          throw new Error('Failed to create conversation');
        }
        currentConversationId = newConversation.results.id;
        setSelectedConversationId(currentConversationId);
      }
  
      // Combine filters
      let combinedFilters = { ...searchFilters };
      if (selectedCollectionIds.length > 0) {
        if (Object.keys(combinedFilters).length > 0) {
          combinedFilters = {
            $and: [
              combinedFilters,
              { collection_id: { $in: selectedCollectionIds } },
            ],
          };
        } else {
          combinedFilters = { collection_id: { $in: selectedCollectionIds } };
        }
      }
  
      // Configure search settings
      const vectorSearchSettings: ChunkSearchSettings = {
        indexMeasure: IndexMeasure.COSINE_DISTANCE,
        enabled: switches.vectorSearch?.checked ?? true,
      };
  
      const graphSearchSettings: GraphSearchSettings = {
        enabled: switches.knowledgeGraphSearch?.checked ?? true,
      };
  
      const searchSettings: SearchSettings = {
        useHybridSearch: switches.hybridSearch?.checked ?? false,
        useSemanticSearch: switches.vectorSearch?.checked ?? true,
        filters: combinedFilters,
        limit: searchLimit,
        chunkSettings: vectorSearchSettings,
        graphSettings: graphSearchSettings,
      };
  
      setIsSearching(true);
  
      // Generation configs
      const thinkingEnabled = thinking;
      
      // Config with thinking enabled
      let ragGenerationConfig: GenerationConfig = {
        model: "anthropic/claude-3-7-sonnet-20250219",
        maxTokensToSample: 16000,
        stream: true,
      };

      if (thinkingEnabled) {
        ragGenerationConfig["extended_thinking"] = true;
        ragGenerationConfig["thinking_budget"] = 4096;
        ragGenerationConfig["temperature"] = 1;
        ragGenerationConfig["top_p"] = null;
      }

      // Use appropriate config based on thinking setting
      
      // 3) Start streaming call
      const streamResponse =
        mode === 'rag_agent'
          ? await client.retrieval.agent({
              message: newUserMessage,
              ragGenerationConfig: ragGenerationConfig,
              researchGenerationConfig: ragGenerationConfig,
              searchSettings,
              conversationId: currentConversationId,
              ragTools: enabledTools,
              mode: research ? "research" : undefined
            })
          : await client.retrieval.rag({
              query: userQuery,
              ragGenerationConfig: ragGenerationConfig,
              searchSettings,
              includeWebSearch: true
            });
  
      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();
  
      // States for accumulating different event data
      let responseText = '';
      const chainOfThoughtBlocks: string[] = [];
      const citations: any[] = [];
      const toolCalls: any[] = [];
      const toolResults: any[] = [];
      
      // Buffer for SSE parsing
      let buffer = '';
      let currentEventType = '';
  
      // Process stream
      while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) break;
  
        // Append new chunk to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
  
        // Parse SSE lines from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last potentially incomplete line
  
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (!trimmedLine || trimmedLine.startsWith(':')) {
            // Empty line or SSE comment/heartbeat
            continue;
          }
          
          if (trimmedLine.startsWith('event:')) {
            // Extract event type
            currentEventType = trimmedLine.substring(6).trim();
          } else if (trimmedLine.startsWith('data:')) {
            // Extract data payload
            const dataStr = trimmedLine.substring(5).trim();
            
            // Check for [DONE] message
            if (dataStr === '[DONE]') {
              continue;
            }
            
            try {
              const eventData = JSON.parse(dataStr);
              
              // Handle different event types
              switch (currentEventType) {
                case 'message':
                  // Accumulate message content
                  if (eventData.delta?.content) {
                    const contentItems = eventData.delta.content;
                    for (const item of contentItems) {
                      if (item.type === 'text' && item.payload?.value) {
                        responseText += item.payload.value;
                      }
                    }
                  }
                  break;
                  
                case 'thinking':
                  // Add to chain of thought
                  if (eventData.delta?.content) {
                    const contentItems = eventData.delta.content;
                    for (const item of contentItems) {
                      if (item.type === 'text' && item.payload?.value) {
                        // Accumulate thinking content
                        if (chainOfThoughtBlocks.length === 0) {
                          chainOfThoughtBlocks.push(item.payload.value);
                        } else {
                          chainOfThoughtBlocks[chainOfThoughtBlocks.length - 1] += item.payload.value;
                        }
                      }
                    }
                  }
                  break;
                  
                case 'citation':
                  if (eventData) {
                    // Create normalized citation object
                    let citationToAdd = {
                      id: eventData.id || '',
                      object: 'citation',
                      title: eventData.payload?.title || 'Source',
                      snippet: eventData.payload?.snippet || '',
                      link: eventData.payload?.link || '',
                      payload: eventData.payload
                    };
                    
                    // Add to citations array if not already present
                    if (!citations.some(c => c.id === citationToAdd.id)) {
                      citations.push(citationToAdd);
                    }
                  }
                  break;
                                    
                case 'tool_call':
                  // Add tool call
                  if (eventData.tool_call_id) {
                    try {
                      const args = typeof eventData.arguments === 'string' 
                        ? JSON.parse(eventData.arguments) 
                        : eventData.arguments;
                        
                      toolCalls.push({
                        id: eventData.tool_call_id,
                        name: eventData.name,
                        arguments: args
                      });
                    } catch (err) {
                      toolCalls.push({
                        id: eventData.tool_call_id,
                        name: eventData.name,
                        arguments: eventData.arguments // keep as string if parsing fails
                      });
                    }
                  }
                  break;
                  
                case 'tool_result':
                  // Add tool result
                  toolResults.push(eventData);
                  break;
                  
                case 'final_answer':
                  // Final answer handling if needed
                  break;
                  
                case 'search_results':
                  // Search results handling if needed
                  setIsSearching(false);
                  break;
              }
              
              // Update UI with current data
              updateAssistantMessage(
                responseText,
                chainOfThoughtBlocks,
                citations,
                toolCalls,
                toolResults,
                true
              );
            } catch (err) {
              console.error('Error parsing SSE data:', err, dataStr);
            }
          }
        }
      }
  
      // Final update, not streaming
      updateAssistantMessage(
        responseText,
        chainOfThoughtBlocks,
        citations,
        toolCalls,
        toolResults,
        false
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // request was aborted by user
      } else {
        console.error(err);
        setError(err.message || 'An error occurred');
      }
    } finally {
      setIsSearching(false);
      setIsStreaming(false);
      setIsProcessingQuery(false);
      setQuery('');
      abortControllerRef.current = null;
    }
  };

  // Scroll to bottom handler
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fire off parse function on new query
  useEffect(() => {
    if (!query || !pipelineUrl) return;
    const delay = setTimeout(() => {
      parseStreaming(query);
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, userId, pipelineUrl]);

  // PDF preview handlers
  const handleOpenPdfPreview = (id: string, page?: number) => {
    setPdfPreviewDocumentId(id);
    setInitialPage(page && page > 0 ? page : 1);
    setPdfPreviewOpen(true);
  };

  const handleClosePdfPreview = () => {
    setPdfPreviewOpen(false);
    setPdfPreviewDocumentId(null);
    setInitialPage(1);
  };

  return (
    <div className="flex flex-col gap-8 h-full relative">
      {/* Floating scroll-to-bottom button */}
      {showScrollButton && (
        <Button
          className="fixed bottom-24 right-8 bg-zinc-700 text-white p-2 rounded-full shadow-lg z-10"
          size="icon"
          onClick={scrollToBottom}
        >
          <ArrowDown size={20} />
        </Button>
      )}

      <div
        ref={containerRef}
        className="flex flex-col space-y-8 mb-4 flex-1 overflow-y-auto"
      >
        {messages.map((msg) => (
          <React.Fragment key={msg.id}>
            {msg.role === 'user' ? (
              <MessageBubble message={msg} />
            ) : (
              <Answer
                message={msg}
                isStreaming={msg.isStreaming || false}
                isSearching={isSearching}
                mode={mode}
              />
            )}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="text-red-500">Error: {error}</div>}

      {!query && messages.length === 0 && (
        <DefaultQueries setQuery={setQuery} mode={mode} />
      )}

      <PdfPreviewDialog
        id={pdfPreviewDocumentId || ''}
        open={pdfPreviewOpen}
        onClose={handleClosePdfPreview}
        initialPage={initialPage}
      />
    </div>
  );
};