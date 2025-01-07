import {
  GenerationConfig,
  IndexMeasure,
  SearchSettings,
  GraphSearchSettings,
  ChunkSearchSettings,
} from 'r2r-js';
import React, { FC, useEffect, useState, useRef } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { useUserContext } from '@/context/UserContext';
import { extractBlocks } from '@/lib/utils';
import { Message } from '@/types';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import MessageBubble from './MessageBubble';
import { UploadButton } from './upload';

const CHUNK_SEARCH_STREAM_MARKER = '<chunk_search>';
const CHUNK_SEARCH_STREAM_END_MARKER = '</chunk_search>';
const GRAPH_SEARCH_STREAM_MARKER = '<graph_search>';
const GRAPH_SEARCH_STREAM_END_MARKER = '</graph_search>';
const LLM_START_TOKEN = '<completion>';
const LLM_END_TOKEN = '</completion>';

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
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<
    string | null
  >(null);
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
      if (lastMessage.role === 'assistant') {
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

  const parseStreaming = async (query: string): Promise<void> => {
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

    // Start with an empty assistant message
    const newAssistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: (Date.now() + 1).toString(),
      timestamp: Date.now() + 1,
      isStreaming: true,
      sources: {},
      searchPerformed: false,
    };

    // Push the user message immediately
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // We'll accumulate raw text in this buffer
    let buffer = '';
    // Flags and placeholders
    let inLLMResponse = false; // Are we inside <completion> blocks?
    let fullContent = ''; // Combined text for the LLM
    let assistantResponse = ''; // The final text for the assistant
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

      // Call the streaming endpoint
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

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();

      // Continuously read chunks
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

        //
        // 1) Extract any <chunk_search> blocks
        //
        const chunkSearchResult = extractBlocks(
          buffer,
          CHUNK_SEARCH_STREAM_MARKER,
          CHUNK_SEARCH_STREAM_END_MARKER
        );
        buffer = chunkSearchResult.newBuffer; // leftover data
        for (const rawJson of chunkSearchResult.blocks) {
          try {
            vectorSearchSources = rawJson;
            searchPerformed = true;
          } catch (err) {
            console.error('Failed to parse chunk_search JSON:', err, rawJson);
          }
          // Update state so user sees search results
          updateLastMessage(
            fullContent,
            {
              vector: vectorSearchSources,
              kg: kgSearchResult,
            },
            true,
            searchPerformed
          );
          setIsSearching(false);
        }

        //
        // 2) Extract any <graph_search> blocks
        //
        const graphSearchResultBlocks = extractBlocks(
          buffer,
          GRAPH_SEARCH_STREAM_MARKER,
          GRAPH_SEARCH_STREAM_END_MARKER
        );
        buffer = graphSearchResultBlocks.newBuffer;
        for (const rawJson of graphSearchResultBlocks.blocks) {
          try {
            kgSearchResult = rawJson;
            searchPerformed = true;
          } catch (err) {
            console.error('Failed to parse graph_search JSON:', err, rawJson);
          }
          // Update
          updateLastMessage(
            fullContent,
            {
              vector: vectorSearchSources,
              kg: kgSearchResult,
            },
            true,
            searchPerformed
          );
          setIsSearching(false);
        }

        //
        // 3) Handle <completion> tokens for LLM text
        //
        //   The approach below is a simplified example, just like your original code,
        //   but we keep leftover text in `buffer` in case the marker is partial.
        //
        if (!inLLMResponse) {
          // See if we have the start token
          const startIdx = buffer.indexOf(LLM_START_TOKEN);
          if (startIdx !== -1) {
            inLLMResponse = true;
            // Discard anything before <completion>
            buffer = buffer.slice(startIdx + LLM_START_TOKEN.length);
          }
        }

        // If we're in LLM mode, check if we found the end token
        if (inLLMResponse) {
          const endIdx = buffer.indexOf(LLM_END_TOKEN);
          if (endIdx !== -1) {
            // We have a complete chunk of LLM text
            const chunk = buffer.slice(0, endIdx);
            buffer = buffer.slice(endIdx + LLM_END_TOKEN.length);
            inLLMResponse = false;

            fullContent += chunk;
            assistantResponse += chunk;
            updateLastMessage(
              fullContent,
              {
                vector: vectorSearchSources,
                kg: kgSearchResult,
              },
              true,
              searchPerformed
            );
          } else {
            // No closing token yet, so the entire buffer is partial LLM text
            // We append it and clear buffer for next read
            fullContent += buffer;
            assistantResponse += buffer;
            updateLastMessage(
              fullContent,
              {
                vector: vectorSearchSources,
                kg: kgSearchResult,
              },
              true,
              searchPerformed
            );
            buffer = '';
          }
        }
      }

      // After the loop completes, we have the final `assistantResponse`
      if (assistantResponse) {
        updateLastMessage(
          assistantResponse,
          { vector: vectorSearchSources, kg: kgSearchResult },
          false,
          searchPerformed
        );
        try {
          await client.conversations.addMessage({
            id: currentConversationId,
            role: 'assistant',
            content: assistantResponse,
          });
        } catch (error) {
          console.error(
            'Error adding assistant message to conversation:',
            error
          );
        }
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

    const debouncedParseStreaming = setTimeout(() => {
      parseStreaming(query);
    }, 500);

    return () => clearTimeout(debouncedParseStreaming);
  }, [query, userId, pipelineUrl]);

  const handleOpenPdfPreview = (id: string, page?: number) => {
    setPdfPreviewDocumentId(id);
    if (page && page > 0) {
      setInitialPage(page);
    } else {
      setInitialPage(1);
    }
    setPdfPreviewOpen(true);
  };

  const handleClosePdfPreview = () => {
    setPdfPreviewOpen(false);
    setPdfPreviewDocumentId(null);
    setInitialPage(1);
  };

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
                // mode={mode}
                // onOpenPdfPreview={handleOpenPdfPreview}
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
      <PdfPreviewDialog
        id={pdfPreviewDocumentId || ''}
        open={pdfPreviewOpen}
        onClose={handleClosePdfPreview}
        initialPage={initialPage}
      />
    </div>
  );
};
