import {
  GenerationConfig,
  IndexMeasure,
  SearchSettings,
  GraphSearchSettings,
  ChunkSearchSettings,
} from 'r2r-js';
import React, { FC, useEffect, useState, useRef } from 'react';

import { useUserContext } from '@/context/UserContext';
import { Message } from '@/types';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import MessageBubble from './MessageBubble';
import { UploadButton } from './upload';

// SSE event types
const SEARCH_RESULTS_EVENT = 'search_results';
const MESSAGE_EVENT = 'message';

export const Result: FC<{
  query: string;
  setQuery: (query: string) => void;
  userId: string | null;
  pipelineUrl: string | null;
  searchLimit: number;
  searchFilters: Record<string, unknown>;
  ragTemperature: number | null;
  ragTopP: number | null;
  ragTopK: number | null;
  ragMaxTokensToSample: number | null;
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
}> = ({
  query,
  setQuery,
  userId,
  pipelineUrl,
  searchLimit,
  searchFilters,
  ragTemperature,
  ragTopP,
  ragTopK,
  ragMaxTokensToSample,
  model,
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
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const { getClient } = useUserContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialPage, setInitialPage] = useState<number>(1);

  useEffect(() => {
    abortCurrentRequest();
    setMessages([]);
    setIsStreaming(false);
    setIsSearching(false);
    setError(null);
    setIsProcessingQuery(false);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateLastMessage = (
    content?: string,
    sources?: Record<string, string | null>,
    isStreaming?: boolean,
    searchPerformed?: boolean
  ) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        return [
          ...prevMessages.slice(0, -1),
          {
            ...lastMessage,
            ...(content !== undefined && { content }),
            ...(sources !== undefined && { sources }),
            ...(isStreaming !== undefined && { isStreaming }),
            ...(searchPerformed !== undefined && { searchPerformed }),
          },
        ];
      } else {
        return [
          ...prevMessages,
          {
            role: 'assistant',
            content: content || '',
            id: Date.now().toString(),
            timestamp: Date.now(),
            isStreaming: isStreaming || false,
            sources: sources || {},
            searchPerformed: searchPerformed || false,
          },
        ];
      }
    });
  };

  const abortCurrentRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (onAbortRequest) {
      onAbortRequest();
    }
  };

  const parseSSEResponse = async (query: string): Promise<void> => {
    if (isProcessingQuery) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsProcessingQuery(true);
    setIsStreaming(true);
    setIsSearching(true);
    setError(null);

    const newUserMessage: Message = {
      role: 'user',
      content: query,
      id: Date.now().toString(),
      timestamp: Date.now(),
      sources: {},
    };

    // Add the user message to the chat
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // Initialize variables for assembling the response
    let fullContent = '';
    let vectorSearchSources: string | null = null;
    let kgSearchResult: string | null = null;
    let searchPerformed = false;

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // Make sure we have a conversation
      let currentConversationId = selectedConversationId;
      if (!currentConversationId) {
        try {
          const newConversation = await client.conversations.create();
          if (!newConversation || !newConversation.results) {
            throw new Error('Failed to create a new conversation');
          }
          currentConversationId = newConversation.results.id;
          if (typeof currentConversationId !== 'string') {
            throw new Error('Invalid conversation ID received');
          }
          setSelectedConversationId(currentConversationId);
        } catch (error) {
          console.error('Error creating new conversation:', error);
          setError('Failed to create a new conversation. Please try again.');
          return;
        }
      }
      if (!currentConversationId) {
        setError('No valid conversation ID. Please try again.');
        return;
      }

      // Build the config
      const ragGenerationConfig: GenerationConfig = {
        stream: true,
        temperature: ragTemperature ?? undefined,
        topP: ragTopP ?? undefined,
        maxTokensToSample: ragMaxTokensToSample ?? undefined,
        model: model && model !== 'null' ? model : undefined,
      };

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
        filters: searchFilters,
        limit: searchLimit,
        chunkSettings: vectorSearchSettings,
        graphSettings: graphSearchSettings,
      };

      // Create empty assistant message to start streaming into
      updateLastMessage('', {}, true, false);

      // Call the appropriate retrieval method based on mode
      const streamResponse =
        mode === 'rag_agent'
          ? await client.retrieval.agent({
              message: newUserMessage,
              ragGenerationConfig,
              searchSettings,
              conversationId: currentConversationId,
            })
          : await client.retrieval.rag({
              query,
              ragGenerationConfig,
              searchSettings,
            });

      // Get the reader from the response
      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Process the stream
      while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from the buffer
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep the last potentially incomplete event in the buffer

        for (const event of events) {
          if (!event.trim()) {
            continue;
          }

          const lines = event.split('\n');
          const eventType = lines[0].startsWith('event: ')
            ? lines[0].slice(7)
            : '';
          const dataLine = lines.find((line) => line.startsWith('data: '));

          if (!dataLine) {
            continue;
          }

          const jsonStr = dataLine.slice(6);

          try {
            const eventData = JSON.parse(jsonStr);

            if (eventType === SEARCH_RESULTS_EVENT) {
              // Handle search results
              if (eventData.data && eventData.data.chunk_search_results) {
                vectorSearchSources = JSON.stringify(eventData);
                searchPerformed = true;
                setIsSearching(false);
              }
              if (eventData.data && eventData.data.graph_search_results) {
                kgSearchResult = JSON.stringify(eventData);
                searchPerformed = true;
                setIsSearching(false);
              }

              // Update message with search results
              updateLastMessage(
                fullContent,
                {
                  vector: vectorSearchSources,
                  kg: kgSearchResult,
                },
                true,
                searchPerformed
              );
            } else if (eventType === MESSAGE_EVENT) {
              // Handle incremental content delta
              if (eventData.delta && eventData.delta.content) {
                const contentItems = eventData.delta.content;
                for (const item of contentItems) {
                  if (
                    item.type === 'text' &&
                    item.payload &&
                    item.payload.value
                  ) {
                    fullContent += item.payload.value;
                  }
                }

                // Update message with new content
                updateLastMessage(
                  fullContent,
                  {
                    vector: vectorSearchSources,
                    kg: kgSearchResult,
                  },
                  true,
                  searchPerformed
                );
              }
            }
          } catch (err) {
            console.error('Error parsing SSE event data:', err, jsonStr);
          }
        }
      }

      // Final update with complete content
      updateLastMessage(
        fullContent,
        { vector: vectorSearchSources, kg: kgSearchResult },
        false,
        searchPerformed
      );

      // Save the assistant's message to the conversation
      try {
        await client.conversations.addMessage({
          id: currentConversationId,
          role: 'assistant',
          content: fullContent,
        });
      } catch (error) {
        console.error('Error adding assistant message to conversation:', error);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('Request was aborted');
        } else {
          console.error('Error in streaming:', err.message);
          setError(err.message);
        }
      } else {
        console.error('Unknown error in streaming:', err);
        setError('An unknown error occurred');
      }
    } finally {
      setIsStreaming(false);
      updateLastMessage(
        fullContent,
        { vector: vectorSearchSources, kg: kgSearchResult },
        false,
        searchPerformed
      );
      setQuery('');
      setIsProcessingQuery(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (query === '' || !pipelineUrl) {
      return;
    }

    const debouncedParseSSE = setTimeout(() => {
      parseSSEResponse(query);
    }, 500);

    return () => clearTimeout(debouncedParseSSE);
  }, [query, userId, pipelineUrl]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col space-y-8 mb-4">
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {message.role === 'user' ? (
              <MessageBubble message={message} />
            ) : (
              <Answer
                message={message}
                isStreaming={message.isStreaming || false}
                isSearching={
                  index === messages.length - 1 ? isSearching : false
                }
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
      {hasAttemptedFetch &&
        uploadedDocuments?.length === 0 &&
        pipelineUrl &&
        mode === 'rag' && (
          <div className="absolute inset-4 flex items-center justify-center backdrop-blur-sm">
            <div className="flex items-center p-4 bg-white shadow-2xl rounded text-text-accent-base font-medium gap-4">
              Please upload at least one document to submit queries.{' '}
              <UploadButton setUploadedDocuments={setUploadedDocuments} />
            </div>
          </div>
        )}
    </div>
  );
};
