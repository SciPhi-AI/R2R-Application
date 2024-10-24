import {
  GenerationConfig,
  IndexMeasure,
  KGSearchSettings,
  VectorSearchSettings,
} from 'r2r-js';
import React, { FC, useEffect, useState, useRef } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { useUserContext } from '@/context/UserContext';
import { Message } from '@/types';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import MessageBubble from './MessageBubble';
import { UploadButton } from './upload';

const SEARCH_START_TOKEN = '<search>';
const SEARCH_END_TOKEN = '</search>';
const KG_SEARCH_START_TOKEN = '<kg_search>';
const KG_SEARCH_END_TOKEN = '</kg_search>';
const LLM_START_TOKEN = '<completion>';
const LLM_END_TOKEN = '</completion>';

export const Result: FC<{
  query: string;
  setQuery: (query: string) => void;
  userId: string | null;
  pipelineUrl: string | null;
  search_limit: number;
  search_filters: Record<string, unknown>;
  rag_temperature: number | null;
  rag_topP: number | null;
  rag_topK: number | null;
  rag_maxTokensToSample: number | null;
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
  search_limit,
  search_filters,
  rag_temperature,
  rag_topP,
  rag_topK,
  rag_maxTokensToSample,
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

    const newAssistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: (Date.now() + 1).toString(),
      timestamp: Date.now() + 1,
      isStreaming: true,
      sources: {},
      searchPerformed: false,
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    let buffer = '';
    let inLLMResponse = false;
    let fullContent = '';
    let vectorSearchSources = null;
    let kgSearchResult = null;
    let searchPerformed = false;

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let currentConversationId = selectedConversationId;

      if (!currentConversationId) {
        try {
          const newConversation = await client.createConversation();
          console.log('newConversation:', newConversation);

          if (!newConversation || !newConversation.results) {
            throw new Error('Failed to create a new conversation');
          }

          currentConversationId = newConversation.results;

          if (typeof currentConversationId !== 'string') {
            throw new Error('Invalid conversation ID received');
          }

          console.log('New conversation ID:', currentConversationId);
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

      console.log('Using conversation ID:', currentConversationId);

      const ragGenerationConfig: GenerationConfig = {
        stream: true,
        temperature: rag_temperature ?? undefined,
        top_p: rag_topP ?? undefined,
        max_tokens_to_sample: rag_maxTokensToSample ?? undefined,
        model: model && model !== 'null' ? model : undefined,
      };

      const vectorSearchSettings: VectorSearchSettings = {
        use_vector_search: switches.vector_search?.checked ?? true,
        use_hybrid_search: switches.hybrid_search?.checked ?? false,
        filters: search_filters,
        search_limit: search_limit,
        index_measure: IndexMeasure.COSINE_DISTANCE,
        selected_collection_ids:
          selectedCollectionIds.length > 0
            ? [selectedCollectionIds].flat()
            : undefined,
      };

      const kgSearchSettings: KGSearchSettings = {
        use_kg_search: switches.knowledge_graph_search?.checked ?? false,
      };

      const streamResponse =
        mode === 'rag_agent'
          ? await client.agent(
              [...messages, newUserMessage],
              ragGenerationConfig,
              vectorSearchSettings,
              kgSearchSettings,
              undefined,
              undefined,
              currentConversationId
            )
          : await client.rag(
              query,
              vectorSearchSettings,
              kgSearchSettings,
              ragGenerationConfig
            );

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();

      let assistantResponse = '';

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

        // Handle search results
        if (
          buffer.includes(SEARCH_END_TOKEN) ||
          buffer.includes(KG_SEARCH_END_TOKEN)
        ) {
          const [results, rest] = buffer.split(/<\/(?:search|kg_search)>/);

          if (results.includes(SEARCH_START_TOKEN)) {
            vectorSearchSources = results
              .split(SEARCH_START_TOKEN)[1]
              .split(SEARCH_END_TOKEN)[0];
            searchPerformed = true;
          }

          if (results.includes(KG_SEARCH_START_TOKEN)) {
            kgSearchResult = results
              .split(KG_SEARCH_START_TOKEN)[1]
              .split(KG_SEARCH_END_TOKEN)[0];
            searchPerformed = true;
          }

          updateLastMessage(
            fullContent,
            { vector: vectorSearchSources, kg: kgSearchResult },
            true,
            searchPerformed
          );
          buffer = rest || '';
          setIsSearching(false);
        }

        // Handle LLM response
        if (buffer.includes(LLM_START_TOKEN)) {
          inLLMResponse = true;
          buffer = buffer.split(LLM_START_TOKEN)[1] || '';
        }

        if (inLLMResponse) {
          const endTokenIndex = buffer.indexOf(LLM_END_TOKEN);
          let chunk = '';

          if (endTokenIndex !== -1) {
            chunk = buffer.slice(0, endTokenIndex);
            buffer = buffer.slice(endTokenIndex + LLM_END_TOKEN.length);
            inLLMResponse = false;
          } else {
            chunk = buffer;
            buffer = '';
          }

          fullContent += chunk;
          assistantResponse += chunk;
          updateLastMessage(
            fullContent,
            { vector: vectorSearchSources, kg: kgSearchResult },
            true,
            searchPerformed
          );
        }
      }

      if (assistantResponse) {
        updateLastMessage(
          assistantResponse,
          { vector: vectorSearchSources, kg: kgSearchResult },
          false,
          searchPerformed
        );

        try {
          await client.addMessage(currentConversationId, {
            role: 'assistant',
            content: assistantResponse,
          });
          console.log('Added assistant message to conversation');
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
            <div className="flex items-center p-4 bg-white shadow-2xl rounded text-indigo-500 font-medium gap-4">
              Please upload at least one document to submit queries.{' '}
              <UploadButton
                userId={userId}
                uploadedDocuments={uploadedDocuments}
                setUploadedDocuments={setUploadedDocuments}
              />
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
