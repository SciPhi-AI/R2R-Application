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

const FUNCTION_START_TOKEN = '<function_call>';
const FUNCTION_END_TOKEN = '</function_call>';
const SEARCH_START_TOKEN = '<search>';
const SEARCH_END_TOKEN = '</search>';
const KG_SEARCH_START_TOKEN = '<kg_search>';
const KG_SEARCH_END_TOKEN = '</kg_search>';
const COMPLETION_START_TOKEN = '<completion>';
const COMPLETION_END_TOKEN = '</completion>';

export const Result: FC<{
  query: string;
  setQuery: (query: string) => void;
  userId: string | null;
  pipelineUrl: string | null;
  search_limit: number;
  search_filters: Record<string, unknown>;
  kg_search_type: 'local' | 'global';
  max_llm_queries_for_global_search: number;
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
}> = ({
  query,
  setQuery,
  userId,
  pipelineUrl,
  search_limit,
  search_filters,
  kg_search_type,
  max_llm_queries_for_global_search,
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
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
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
    setMessages([]);
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
      const updatedMessages = [...prevMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        return [
          ...updatedMessages.slice(0, -1),
          {
            ...lastMessage,
            ...(content !== undefined && { content }),
            ...(sources !== undefined && { sources }),
            ...(isStreaming !== undefined && { isStreaming }),
            ...(searchPerformed !== undefined && { searchPerformed }),
          },
        ];
      }
      return prevMessages;
    });
  };

  const parseStreaming = async (query: string): Promise<void> => {
    if (isProcessingQuery) {
      return;
    }
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

    setMessages((prevMessages) => [
      ...prevMessages,
      newUserMessage,
      newAssistantMessage,
    ]);

    let buffer = '';
    const inLLMResponse = false;
    let fullContent = '';
    let vectorSearchSources = null;
    let kgSearchResult = null;
    let inCompletion = false;

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const ragGenerationConfig: GenerationConfig = {
        stream: true,
        temperature: rag_temperature ?? undefined,
        top_p: rag_topP ?? undefined,
        max_tokens_to_sample: rag_maxTokensToSample ?? undefined,
        model: model !== 'null' && model !== null ? model : undefined,
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
        kg_search_type: kg_search_type,
        max_llm_queries_for_global_search: max_llm_queries_for_global_search,
      };

      const streamResponse =
        mode === 'rag_agent'
          ? await client.agent(
              [...messages, newUserMessage],
              vectorSearchSettings,
              kgSearchSettings,
              ragGenerationConfig
            )
          : await client.rag(
              query,
              vectorSearchSettings,
              kgSearchSettings,
              ragGenerationConfig
            );

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        if (buffer.includes(FUNCTION_END_TOKEN)) {
          const [functionCall, rest] = buffer.split(FUNCTION_END_TOKEN);
          buffer = rest || '';

          if (functionCall.includes(SEARCH_END_TOKEN)) {
            const [searchResults, rest] = functionCall.split(SEARCH_END_TOKEN);
            vectorSearchSources = searchResults.includes(SEARCH_START_TOKEN)
              ? searchResults.split(SEARCH_START_TOKEN)[1]
              : searchResults.trim();
            buffer = rest || '';
          }
        }

        if (buffer.includes(SEARCH_END_TOKEN)) {
          const [searchResults, rest] = buffer.split(SEARCH_END_TOKEN);
          vectorSearchSources = searchResults.includes(SEARCH_START_TOKEN)
            ? searchResults.split(SEARCH_START_TOKEN)[1]
            : searchResults.trim();
          buffer = rest || '';
        }

        if (buffer.includes(KG_SEARCH_END_TOKEN)) {
          const [kgResults, rest] = buffer.split(KG_SEARCH_END_TOKEN);
          kgSearchResult = kgResults.includes(KG_SEARCH_START_TOKEN)
            ? kgResults.split(KG_SEARCH_START_TOKEN)[1]
            : kgResults.trim();
          buffer = rest || '';
        }

        if (buffer.includes(COMPLETION_START_TOKEN)) {
          inCompletion = true;
          buffer = buffer.split(COMPLETION_START_TOKEN)[1] || '';
        }

        if (inCompletion) {
          const endTokenIndex = buffer.indexOf(COMPLETION_END_TOKEN);
          if (endTokenIndex !== -1) {
            fullContent += buffer.slice(0, endTokenIndex);
            buffer = buffer.slice(endTokenIndex + COMPLETION_END_TOKEN.length);
            inCompletion = false;
          } else {
            fullContent += buffer;
            buffer = '';
          }
        }

        updateLastMessage(
          fullContent,
          { vector: vectorSearchSources, kg: kgSearchResult },
          inCompletion,
          true
        );
      }
    } catch (err: unknown) {
      console.error('Error in streaming:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStreaming(false);
      setIsSearching(false);
      updateLastMessage(
        fullContent,
        { vector: vectorSearchSources, kg: kgSearchResult },
        false
      );
      setQuery('');
      setIsProcessingQuery(false);
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
