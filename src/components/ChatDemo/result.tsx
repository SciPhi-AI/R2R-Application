import {
  GenerationConfig,
  IndexMeasure,
  SearchSettings,
  GraphSearchSettings,
  ChunkSearchSettings,
} from 'r2r-js';
import { r2rClient } from 'r2r-js';
import React, { FC, useEffect, useState, useRef } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserContext } from '@/context/UserContext';
import { Message } from '@/types';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import MessageBubble from './MessageBubble';
import { UploadButton } from './upload';

// Default URLs as fallbacks
const DEFAULT_PRODUCTION_URL = 'https://api.cloud.sciphi.ai';
const DEFAULT_DEVELOPMENT_URL = 'http://0.0.0.0:7272';

// Get URLs from environment variables with fallbacks
const PRODUCTION_URL =
  process.env.NEXT_PUBLIC_PRODUCTION_API_URL || DEFAULT_PRODUCTION_URL;
const DEVELOPMENT_URL =
  process.env.NEXT_PUBLIC_DEVELOPMENT_API_URL || DEFAULT_DEVELOPMENT_URL;

// Use environment variable to determine the deployment URL
const DEFAULT_DEPLOYMENT_URL =
  process.env.NEXT_PUBLIC_ENV === 'development'
    ? DEVELOPMENT_URL
    : PRODUCTION_URL;

// Mock client for demonstration
const THOUGHT_START = '<Thought>';
const THOUGHT_END = '</Thought>';
const RESPONSE_START = '<Response>';
const RESPONSE_END = '</Response>';

class MockStreamResponse {
  private chunks: string[];
  private index: number;
  private encoder: TextEncoder;

  constructor(response: string) {
    this.chunks = this.chunkResponse(response);
    this.index = 0;
    this.encoder = new TextEncoder();
  }

  private chunkResponse(response: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    const tokens = response.split(
      /((?:<\/?(?:Thought|Response|ToolCalls|ToolCall|Name|Parameters)>)|(?:\{.*?\}))/g
    );

    for (const token of tokens) {
      currentChunk += token;
      // Create new chunk when we reach a reasonable size or hit certain boundaries
      if (
        currentChunk.length > 100 ||
        token.endsWith('</Thought>') ||
        token.endsWith('</Response>') ||
        token.endsWith('</ToolCalls>')
      ) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  getReader() {
    return {
      read: async () => {
        if (this.index >= this.chunks.length) {
          return { done: true, value: undefined };
        }
        // Simulate network delay
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 100 + 50)
        );

        const chunk = this.chunks[this.index++];
        // if (chunk.includes('</Thought>')) {
        //   await new Promise((resolve) => setTimeout(resolve, 5000));
        // }
        return {
          done: false,
          value: this.encoder.encode(chunk),
        };
      },
      cancel: () => {
        this.index = this.chunks.length; // Mark as done
        return Promise.resolve();
      },
    };
  }
}

export class MockClient {
  retrieval: {
    rag: (params: { query: string }) => Promise<MockStreamResponse>;
    agent: (params: {
      message: { content: string };
    }) => Promise<MockStreamResponse>;
  };

  conversations: {
    create: () => Promise<{ results: { id: string } }>;
  };

  constructor() {
    this.retrieval = {
      rag: async ({ query }) => {
        const mockResponse = `<Thought>Thinking deeply about ${query}.</Thought>
<ToolCalls>
<ToolCall>
<Name>local_search</Name>
<Parameters>{"query": "${query}"}</Parameters>
</ToolCall>
</ToolCalls>
<Thought>Now I have some insights about ${query}...</Thought>
<Response>Final answer about ${query} here!</Response>`;
        return new MockStreamResponse(mockResponse);
      },
      agent: async ({ message }) => {
        const mockResponse = `<Thought>Analyzing your message: "${message.content}" step by step.</Thought>
<ToolCalls>
<ToolCall>
<Name>web_search</Name>
<Parameters>{"query": "${message.content}"}</Parameters>
</ToolCall>
</ToolCalls>
<Thought>Ok, I have some new info. Let me refine the answer.</Thought>
<Response>This is the final response for ${message.content}!</Response>`;
        return new MockStreamResponse(mockResponse);
      },
    };

    this.conversations = {
      create: async () => {
        return {
          results: {
            id: `conv-${Date.now()}`,
          },
        };
      },
    };
  }
}

// ---------- Component ----------

interface ResultProps {
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
  enabledTools: string[];
}

export const Result: FC<ResultProps> = ({
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
  enabledTools,
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  // References for auto-scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Local state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);

  // Track user scroll
  const [lastScrollUpTime, setLastScrollUpTime] = useState<number>(0);
  const SCROLL_BACK_DELAY_MS = 3000;

  // PDF Preview
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<
    string | null
  >(null);
  const [initialPage, setInitialPage] = useState<number>(1);

  const { getClient } = useUserContext();

  // Reset messages when mode changes
  useEffect(() => {
    abortCurrentRequest();
    setMessages([]);
    setIsStreaming(false);
    setIsSearching(false);
    setError(null);
    setIsProcessingQuery(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Auto-scroll to bottom if user hasn’t scrolled up recently
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    const userIsNearBottom = distanceFromBottom < 50;
    const now = Date.now();
    const enoughTimeSinceScrollUp =
      now - lastScrollUpTime > SCROLL_BACK_DELAY_MS;

    if (userIsNearBottom || enoughTimeSinceScrollUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, lastScrollUpTime]);

  // Track manual scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceFromBottom > 50) {
        setLastScrollUpTime(Date.now());
      }
    };
    const ref = containerRef.current;
    if (!ref) return;
    ref.addEventListener('scroll', handleScroll);
    return () => ref.removeEventListener('scroll', handleScroll);
  }, []);

  const abortCurrentRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (onAbortRequest) {
      onAbortRequest();
    }
  };

  // Add/update assistant’s last message
  const updateLastMessage = (
    content: string,
    chainOfThought: string[],
    isStreaming: boolean
  ) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage?.role === 'assistant') {
        return [
          ...prevMessages.slice(0, -1),
          {
            ...lastMessage,
            content,
            chainOfThought,
            isStreaming,
          },
        ];
      } else {
        return [
          ...prevMessages,
          {
            role: 'assistant',
            content,
            id: Date.now().toString(),
            timestamp: Date.now(),
            isStreaming,
            chainOfThought,
          },
        ];
      }
    });
  };

  // Main streaming logic
  const parseStreaming = async (userQuery: string): Promise<void> => {
    if (isProcessingQuery) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsProcessingQuery(true);
    setIsStreaming(true);
    setError(null);

    // Append user message
    const newUserMessage: Message = {
      role: 'user',
      content: userQuery,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Placeholder assistant message so UI shows "thinking..."
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        id: (Date.now() + 1).toString(),
        timestamp: Date.now(),
        isStreaming: true,
        chainOfThought: [],
      },
    ]);

    try {
      // If you want to use the real client + user context:
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }
      // const client = new r2rClient(DEFAULT_DEPLOYMENT_URL);

      // Possibly create conversation if agent mode
      let currentConversationId = selectedConversationId;
      if (!currentConversationId && mode === 'rag_agent') {
        const newConversation = await client.conversations.create();
        if (!newConversation?.results) {
          throw new Error('Failed to create conversation');
        }
        currentConversationId = newConversation.results.id;
        setSelectedConversationId(currentConversationId);
      }

      // Config
      const ragGenerationConfig: GenerationConfig = {
        stream: true,
        temperature: ragTemperature ?? undefined,
        topP: ragTopP ?? undefined,
        maxTokensToSample: ragMaxTokensToSample ?? undefined,
        model: model && model !== 'null' ? model : undefined,
      };

      // Merge filters with selected collections
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

      const streamResponse =
        mode === 'rag_agent'
          ? await client.retrieval.reasoningAgent({
              message: newUserMessage,
              ragGenerationConfig,
              searchSettings,
              // @ts-ignore
              conversationId: currentConversationId,
              // @ts-ignore
              tools: enabledTools,
            })
          : await client.retrieval.rag({
              query: userQuery,
              ragGenerationConfig,
              searchSettings,
            });

      // For demonstration, you could use the MockClient:
      // const mockClient = new MockClient();
      // const streamResponse = await mockClient.retrieval.rag({ query: userQuery });

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();

      // We keep track of:
      // - chainOfThoughtBlocks that have been fully closed by </Thought>
      // - thoughtBuffer for the *current* <Thought> being written
      // - responseSoFar for partial <Response> text
      // - finalResponse to hold the "locked in" content after a </Response> tag
      const chainOfThoughtBlocks: string[] = [];
      let thoughtBuffer = '';
      let responseBuffer = '';
      let finalResponse = '';

      let isCapturingThought = false;
      let isCapturingResponse = false;

      let chunk = '';
      while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;
        const tempChunk = decoder.decode(value, { stream: true });
        console.log('tempChunk = ', tempChunk);
        if (
          tempChunk.includes('</Thought') &&
          !tempChunk.includes('</Thought>')
        ) {
          chunk = tempChunk;
          continue;
        } else {
          if (
            tempChunk.includes('</Thought') &&
            !tempChunk.includes('</Thought>')
          ) {
            chunk += tempChunk;
          } else {
            chunk = tempChunk;
          }
        }
        // console.log("chunk = ", chunk);

        // First, try to find and process any complete thought blocks in the chunk
        const thoughtBlockRegex = /<Thought>(.*?)<\/Thought>/gs;
        let thoughtBlockMatch;
        let processedIndex = 0;

        while ((thoughtBlockMatch = thoughtBlockRegex.exec(chunk)) !== null) {
          // If we were capturing a thought, complete it first
          if (isCapturingThought && processedIndex < thoughtBlockMatch.index) {
            thoughtBuffer += chunk.slice(
              processedIndex,
              thoughtBlockMatch.index
            );
            chainOfThoughtBlocks.push(thoughtBuffer.trim());
            thoughtBuffer = '';
            isCapturingThought = false;
          }

          // Add the complete thought block
          chainOfThoughtBlocks.push(thoughtBlockMatch[1].trim());
          processedIndex =
            thoughtBlockMatch.index + thoughtBlockMatch[0].length;

          // Update UI with the new thought block
          const partialResponse =
            finalResponse + (isCapturingResponse ? responseBuffer : '');
          updateLastMessage(partialResponse, chainOfThoughtBlocks, true);
        }

        // Now process any remaining partial tags
        chunk = chunk.slice(processedIndex);

        // Keep processing while there are known tag boundaries
        while (true) {
          const tokenRegex = new RegExp(
            `(${THOUGHT_START}|${THOUGHT_END}|${RESPONSE_START}|${RESPONSE_END})`
          );
          const match = chunk.match(tokenRegex);

          if (!match) {
            // No more special tags in this chunk, so just append to whichever buffer we're in
            if (isCapturingThought) {
              thoughtBuffer += chunk;
            } else if (isCapturingResponse) {
              responseBuffer += chunk;
            }
            // After accumulating the chunk, do a partial UI update
            const partialChainOfThought = [
              ...chainOfThoughtBlocks,
              ...(isCapturingThought ? [thoughtBuffer.trim()] : []),
            ];
            const partialResponse =
              finalResponse + (isCapturingResponse ? responseBuffer : '');
            updateLastMessage(partialResponse, partialChainOfThought, true);

            break;
          }

          // If we found a tag, split around it
          const tokenIndex = match.index ?? 0;
          const beforeTag = chunk.slice(0, tokenIndex);
          const tag = match[0];
          // The remainder after this tag
          const afterTag = chunk.slice(tokenIndex + tag.length);

          // Append `beforeTag` text to whichever buffer is active
          if (isCapturingThought) {
            thoughtBuffer += beforeTag;
          } else if (isCapturingResponse) {
            responseBuffer += beforeTag;
          }

          // Update UI with partial content so far
          {
            const partialChainOfThought = [
              ...chainOfThoughtBlocks,
              ...(isCapturingThought ? [thoughtBuffer] : []),
            ];
            const partialResponse =
              finalResponse + (isCapturingResponse ? responseBuffer : '');
            updateLastMessage(partialResponse, partialChainOfThought, true);
          }

          // Handle the tag itself
          if (tag === THOUGHT_START) {
            isCapturingThought = true;
            thoughtBuffer = '';
          } else if (tag === THOUGHT_END) {
            isCapturingThought = false;
            // A full thought block is now complete
            chainOfThoughtBlocks.push(thoughtBuffer);
            thoughtBuffer = '';

            // Update UI now that the thought block is finalized
            const partialChainOfThought = [...chainOfThoughtBlocks];
            const partialResponse =
              finalResponse + (isCapturingResponse ? responseBuffer : '');
            updateLastMessage(partialResponse, partialChainOfThought, true);
          } else if (tag === RESPONSE_START) {
            isCapturingResponse = true;
            responseBuffer = '';
          } else if (tag === RESPONSE_END) {
            isCapturingResponse = false;
            // We finalize whatever was in responseBuffer
            finalResponse += responseBuffer;
            responseBuffer = '';

            // Update UI with the newly finalized portion
            const partialChainOfThought = [...chainOfThoughtBlocks];
            updateLastMessage(finalResponse, partialChainOfThought, true);
          }

          // Continue parsing the remainder of this chunk
          chunk = afterTag;
        }
      }

      // while (true) {
      //   if (signal.aborted) {
      //     reader.cancel();
      //     break;
      //   }
      //   const { done, value } = await reader.read();
      //   if (done) break;

      //   let chunk = decoder.decode(value, { stream: true });
      //   console.log("chunk = ", chunk)
      //   // Keep processing while there are known tag boundaries
      //   while (true) {
      //     const tokenRegex = new RegExp(
      //       `(${THOUGHT_START}|${THOUGHT_END}|${RESPONSE_START}|${RESPONSE_END})`
      //     );
      //     const match = chunk.match(tokenRegex);

      //     if (!match) {
      //       // No more special tags in this chunk, so just append to whichever buffer we’re in
      //       if (isCapturingThought) {
      //         thoughtBuffer += chunk;
      //       } else if (isCapturingResponse) {
      //         responseBuffer += chunk;
      //       }
      //       // After accumulating the chunk, do a partial UI update
      //       const partialChainOfThought = [
      //         ...chainOfThoughtBlocks,
      //         ...(isCapturingThought ? [thoughtBuffer] : []),
      //       ];
      //       const partialResponse =
      //         finalResponse + (isCapturingResponse ? responseBuffer : '');
      //       updateLastMessage(partialResponse, partialChainOfThought, true);

      //       break;
      //     }

      //     // If we found a tag, split around it
      //     const tokenIndex = match.index ?? 0;
      //     const beforeTag = chunk.slice(0, tokenIndex);
      //     const tag = match[0];
      //     // The remainder after this tag
      //     const afterTag = chunk.slice(tokenIndex + tag.length);

      //     // Append `beforeTag` text to whichever buffer is active
      //     if (isCapturingThought) {
      //       thoughtBuffer += beforeTag;
      //     } else if (isCapturingResponse) {
      //       responseBuffer += beforeTag;
      //     }

      //     // Update UI with partial content so far
      //     {
      //       const partialChainOfThought = [
      //         ...chainOfThoughtBlocks,
      //         ...(isCapturingThought ? [thoughtBuffer] : []),
      //       ];
      //       const partialResponse =
      //         finalResponse + (isCapturingResponse ? responseBuffer : '');
      //       updateLastMessage(partialResponse, partialChainOfThought, true);
      //     }

      //     // Handle the tag itself
      //     if (tag === THOUGHT_START) {
      //       isCapturingThought = true;
      //       thoughtBuffer = '';
      //     } else if (tag === THOUGHT_END) {
      //       isCapturingThought = false;
      //       // A full thought block is now complete
      //       chainOfThoughtBlocks.push(thoughtBuffer);
      //       thoughtBuffer = '';

      //       // Update UI now that the thought block is finalized
      //       const partialChainOfThought = [...chainOfThoughtBlocks];
      //       const partialResponse =
      //         finalResponse + (isCapturingResponse ? responseBuffer : '');
      //       updateLastMessage(partialResponse, partialChainOfThought, true);
      //     } else if (tag === RESPONSE_START) {
      //       isCapturingResponse = true;
      //       responseBuffer = '';
      //     } else if (tag === RESPONSE_END) {
      //       isCapturingResponse = false;
      //       // We finalize whatever was in responseBuffer
      //       finalResponse += responseBuffer;
      //       responseBuffer = '';

      //       // Update UI with the newly finalized portion
      //       const partialChainOfThought = [...chainOfThoughtBlocks];
      //       updateLastMessage(finalResponse, partialChainOfThought, true);
      //     }

      //     // Continue parsing the remainder of this chunk
      //     chunk = afterTag;
      //   }
      // }

      // Final update if there's leftover buffers and no closing tags
      // (In case the stream ends abruptly without a closing </Thought> or </Response>)
      const leftoverChainOfThought = [
        ...chainOfThoughtBlocks,
        ...(isCapturingThought ? [thoughtBuffer] : []),
      ];
      const leftoverResponse =
        finalResponse + (isCapturingResponse ? responseBuffer : '');
      updateLastMessage(leftoverResponse, leftoverChainOfThought, false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // aborted
      } else {
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

  // Trigger streaming when query changes
  useEffect(() => {
    if (!query || !pipelineUrl) return;
    const debounced = setTimeout(() => {
      parseStreaming(query);
    }, 500);

    return () => clearTimeout(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, userId, pipelineUrl]);

  // PDF preview controls
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
    <div className="flex flex-col gap-8 h-full">
      {mode === 'rag_agent' && (
        <Alert className="mb-4 bg-zinc-800 border-zinc-600">
          <AlertDescription className="text-sm text-white">
            Currently using our advanced reasoning agent. For quick, direct
            answers, try <strong>rag</strong> mode instead.
          </AlertDescription>
        </Alert>
      )}

      <div ref={containerRef} className="flex flex-col space-y-8 mb-4 flex-1">
        {messages.map((message) => (
          <React.Fragment key={message.id}>
            {message.role === 'user' ? (
              <MessageBubble message={message} />
            ) : (
              <Answer
                message={message}
                isStreaming={message.isStreaming || false}
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

      {/* If user has no docs uploaded but tries to do RAG */}
      {hasAttemptedFetch && uploadedDocuments.length === 0 && pipelineUrl && (
        <div className="absolute inset-4 flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center p-4 bg-white shadow-2xl rounded text-black font-medium gap-4">
            Please upload at least one document to submit queries.&nbsp;
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
