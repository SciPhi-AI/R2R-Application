import React, { FC, useEffect, useState, useMemo, useRef } from 'react';

import { useUserContext } from '@/context/UserContext';
import { Message } from '@/types';
import { RagGenerationConfig } from '@/types';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import MessageBubble from './MessageBubble';
import { UploadButton } from './upload';
import { parseMarkdown } from './utils/parseMarkdown';

const FUNCTION_START_TOKEN = '<function_call>';
const FUNCTION_END_TOKEN = '</function_call>';

const FUNCTION_NAME_TOKEN = '<name>';
const FUNCTION_NAME_END_TOKEN = '</name>';

const SEARCH_START_TOKEN = '<search>';
const SEARCH_END_TOKEN = '</search>';

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
  // kg_temperature: number | null;
  // kg_topP: number | null;
  // kg_topK: number | null;
  // kg_maxTokensToSample: number | null;
  model: string | null;
  uploadedDocuments: string[];
  setUploadedDocuments: any;
  hasAttemptedFetch: boolean;
  switches: any;
  mode: 'rag' | 'rag_chat';
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
  // kg_temperature,
  // kg_topP,
  // kg_topK,
  // kg_maxTokensToSample,
  model,
  uploadedDocuments,
  setUploadedDocuments,
  hasAttemptedFetch,
  switches,
  mode,
}) => {
  const [sources, setSources] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sourceCount, setSourceCount] = useState<number>(0);
  const { getClient } = useUserContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);

  const [currentAssistantMessage, setCurrentAssistantMessage] =
    useState<string>('');
  const conversationHistoryRef = useRef<Message[]>([
    { role: 'system', content: 'You are a helpful assistant.' },
  ]);

  useEffect(() => {
    setMessages([]);
    return () => {
      setMessages([]);
    };
  }, [mode]);

  let timeout: NodeJS.Timeout;

  const parseStreaming = async (query: string, userId: string | null) => {
    if (isProcessingQuery) {
      return;
    }
    setIsProcessingQuery(true);

    setSources(null);
    setMarkdown('');
    setIsStreaming(true);
    setIsSearching(true);
    setSourceCount(0);
    setError(null);

    const newUserMessage: Message = {
      role: 'user',
      content: query,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      newUserMessage,
    ];

    const newAssistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: (Date.now() + 1).toString(),
      timestamp: Date.now() + 1,
      isStreaming: true,
      sources: null,
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      newUserMessage,
      newAssistantMessage,
    ]);

    let buffer = '';
    let inLLMResponse = false;
    let sourcesContent = '';
    const inFunctionCall = false;
    const currentFunctionCall = '';

    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const ragGenerationConfig: RagGenerationConfig = {
        stream: true,
        temperature: rag_temperature ?? undefined,
        top_p: rag_topP ?? undefined,
        top_k: rag_topK ?? undefined,
        max_tokens_to_sample: rag_maxTokensToSample ?? undefined,
        model: model !== 'null' && model !== null ? model : undefined,
      };

      let streamResponse;

      if (mode === 'rag_chat') {
        streamResponse = await client.ragChat({
          messages: conversationHistoryRef.current,
          use_vector_search: switches.vector_search?.checked ?? true,
          search_filters: search_filters,
          search_limit: search_limit,
          do_hybrid_search: switches.hybrid_search?.checked ?? false,
          use_kg_search: switches.knowledge_graph_search?.checked ?? false,
          rag_generation_config: ragGenerationConfig,
        });
      } else {
        streamResponse = await client.rag({
          query: query,
          use_vector_search: switches.vector_search?.checked ?? true,
          search_filters: search_filters,
          search_limit: search_limit,
          do_hybrid_search: switches.hybrid_search?.checked ?? false,
          use_kg_search: switches.knowledge_graph_search?.checked ?? false,
          rag_generation_config: ragGenerationConfig,
        });
      }

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        console.log('Buffer:', buffer);

        if (mode === 'rag') {
          // Handle RAG mode (Q&A)
          if (buffer.includes(SEARCH_END_TOKEN)) {
            const [results, rest] = buffer.split(SEARCH_END_TOKEN);
            sourcesContent = results.replace(SEARCH_START_TOKEN, '');
            setSources(sourcesContent);

            updateLastMessage(undefined, sourcesContent);
            buffer = rest || '';
            setIsSearching(false);
          }

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

            updateLastMessage(chunk);
          }
        } else {
          // Handle RAG Agent mode
          if (buffer.includes(FUNCTION_END_TOKEN)) {
            const [results, rest] = buffer.split(FUNCTION_END_TOKEN);
            sourcesContent = results
              .replace(FUNCTION_START_TOKEN, '')
              .replace(/^[\s\S]*?<results>([\s\S]*)<\/results>[\s\S]*$/, '$1');
            console.log('At function:', sourcesContent);
            setSources(sourcesContent);
            updateLastMessage(undefined, sourcesContent);
            buffer = rest || '';
            setIsSearching(false);
          }

          console.log('gets here');

          if (buffer.includes(LLM_START_TOKEN)) {
            inLLMResponse = true;
            buffer = buffer.split(LLM_START_TOKEN)[1] || '';
            console.log('At LLM:', buffer);
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

            updateLastMessage(chunk);
          }
        }

        setMarkdown((prev) => prev + buffer);
      }
    } catch (err: unknown) {
      console.error('Error in streaming:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStreaming(false);
      setIsSearching(false);
      setIsProcessingQuery(false);
      updateLastMessage(undefined, undefined, false);
    }
  };

  const updateLastMessage = (
    content?: string,
    sources?: string,
    isStreaming?: boolean
  ) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        if (content !== undefined) {
          lastMessage.content += content;
        }
        if (sources !== undefined) {
          lastMessage.sources = sources;
        }
        if (isStreaming !== undefined) {
          lastMessage.isStreaming = isStreaming;
        }
      }
      return updatedMessages;
    });
  };

  useEffect(() => {
    if (query === '' || !pipelineUrl) {
      return;
    }

    const debouncedParseStreaming = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        parseStreaming(query, userId);
      }, 500);
    };

    debouncedParseStreaming();

    return () => {
      clearTimeout(timeout);
    };
  }, [query, userId, pipelineUrl]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const parsedMarkdown = useMemo(() => parseMarkdown(markdown), [markdown]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

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
      {!query && <DefaultQueries setQuery={setQuery} />}
      {hasAttemptedFetch && uploadedDocuments?.length === 0 && pipelineUrl && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="flex items-center p-4 bg-white shadow-2xl rounded text-blue-500 font-medium gap-4">
            Please upload at least one document to submit queries.{' '}
            <UploadButton
              userId={userId}
              uploadedDocuments={uploadedDocuments}
              setUploadedDocuments={setUploadedDocuments}
            />
          </div>
        </div>
      )}
    </div>
  );
};
