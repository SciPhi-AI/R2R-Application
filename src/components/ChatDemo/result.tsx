import {
  GenerationConfig,
  IndexMeasure,
  SearchSettings,
  GraphSearchSettings,
  ChunkSearchSettings,
} from 'r2r-js';
import React, { FC, useEffect, useState, useRef } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserContext } from '@/context/UserContext';
import { Message } from '@/types';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import MessageBubble from './MessageBubble';
import { UploadButton } from './upload';

// Marker constants for streaming logic
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
  // Abort controller for streaming requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refs for scrolling
  const containerRef = useRef<HTMLDivElement>(null); // The scrollable container
  const messagesEndRef = useRef<HTMLDivElement>(null); // "Bottom" marker

  // Local state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);

  // Track the last time the user scrolled up (manually)
  const [lastScrollUpTime, setLastScrollUpTime] = useState<number>(0);
  const SCROLL_BACK_DELAY_MS = 3000; // e.g. 3 seconds

  // For PDF previews
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<
    string | null
  >(null);
  const [initialPage, setInitialPage] = useState<number>(1);

  const { getClient } = useUserContext();

  /**
   * Reset state whenever "mode" changes
   */
  useEffect(() => {
    console.debug('[Result] mode changed to:', mode, ', resetting messages.');
    abortCurrentRequest();
    setMessages([]);
    setIsStreaming(false);
    setIsSearching(false);
    setError(null);
    setIsProcessingQuery(false);
  }, [mode]);

  /**
   * On every new messages array:
   * 1) Save them to localStorage
   * 2) Conditionally auto-scroll if user hasn't recently scrolled up
   */
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

  /**
   * When the user scrolls in container, record last scroll time if away from bottom
   */
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
    return () => {
      ref.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * Helper to add or update the assistant's last message
   */
  const updateLastMessage = (
    content?: string,
    sources?: Record<string, string | null>,
    isStreaming?: boolean,
    searchPerformed?: boolean
  ) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage?.role === 'assistant') {
        // update existing assistant
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
        // otherwise add new assistant message
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

  /**
   * Abort any current streaming request
   */
  const abortCurrentRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (onAbortRequest) {
      onAbortRequest();
    }
  };

  /**
   * Main streaming logic
   */
  const parseStreaming = async (userQuery: string): Promise<void> => {
    console.debug('[Result] parseStreaming called with query:', userQuery);

    if (isProcessingQuery) {
      console.debug('[Result] Already processing query, ignoring...');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
      sources: {},
    };
    setMessages((prev) => [...prev, newUserMessage]);
    console.debug('[Result] Added user message, mode=', mode);

    // 2) (OPTIONAL) Immediately add an empty assistant message with isStreaming=true
    //    so the UI shows "thinking" right away in `Answer`.
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '', // No content yet
        id: (Date.now() + 1).toString(),
        timestamp: Date.now(),
        isStreaming: true, // triggers 'thinking' in Answer
        sources: {},
        searchPerformed: false,
      },
    ]);
    console.debug(
      '[Result] Added placeholder assistant message -> triggers thinking UI.'
    );

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
      console.debug(
        '[Result] Client acquired, conversationId=',
        selectedConversationId
      );

      // Possibly create conversation if agent mode
      let currentConversationId = selectedConversationId;
      if (!currentConversationId && mode === 'rag_agent') {
        console.debug('[Result] Creating new conversation (rag_agent mode).');
        const newConversation = await client.conversations.create();
        if (!newConversation?.results) {
          throw new Error('Failed to create a new conversation');
        }
        currentConversationId = newConversation.results.id;
        setSelectedConversationId(currentConversationId);
        console.debug(
          '[Result] New conversationId set:',
          currentConversationId
        );
      }

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

      // If user selected collections, combine them with filters
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
      console.debug(
        '[Result] Invoking pipeline with mode:',
        mode,
        ', searchSettings:',
        searchSettings
      );

      const streamResponse =
        mode === 'rag_agent'
          ? await client.retrieval.agent({
              message: newUserMessage,
              ragGenerationConfig,
              searchSettings,
              // @ts-ignore
              conversationId: currentConversationId,
            })
          : await client.retrieval.rag({
              query: userQuery,
              ragGenerationConfig,
              searchSettings,
            });

      console.debug('[Result] Received streaming response. Reading chunks...');

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();

      let assistantResponse = '';

      while (true) {
        if (signal.aborted) {
          console.debug('[Result] read loop: aborted signal => stop reading.');
          reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        if (done) {
          console.debug('[Result] Stream read done.');
          break;
        }
        // decode partial chunk
        buffer += decoder.decode(value, { stream: true });

        // Check for chunk search or graph search markers
        if (
          buffer.includes(CHUNK_SEARCH_STREAM_END_MARKER) ||
          buffer.includes(GRAPH_SEARCH_STREAM_END_MARKER)
        ) {
          if (buffer.includes(CHUNK_SEARCH_STREAM_MARKER)) {
            vectorSearchSources = buffer
              .split(CHUNK_SEARCH_STREAM_MARKER)[1]
              .split(CHUNK_SEARCH_STREAM_END_MARKER)[0];
            searchPerformed = true;
          }
          if (buffer.includes(GRAPH_SEARCH_STREAM_MARKER)) {
            kgSearchResult = buffer
              .split(GRAPH_SEARCH_STREAM_MARKER)[1]
              .split(GRAPH_SEARCH_STREAM_END_MARKER)[0];
            searchPerformed = true;
          }
          console.debug(
            '[Result] Found search results. vectorSearchSources=',
            vectorSearchSources
          );
          // update the assistant message with partial search results
          updateLastMessage(
            fullContent,
            { vector: vectorSearchSources, kg: kgSearchResult },
            true,
            searchPerformed
          );
          setIsSearching(false);
        }

        // Check if we've started the LLM response
        if (buffer.includes(LLM_START_TOKEN)) {
          console.debug(
            '[Result] Found LLM_START_TOKEN => entering inLLMResponse mode.'
          );
          setIsSearching(false);
          inLLMResponse = true;
          // remove everything up to <completion>
          buffer = buffer.split(LLM_START_TOKEN)[1] || '';
        }

        if (inLLMResponse) {
          const endTokenIndex = buffer.indexOf(LLM_END_TOKEN);
          let chunk = '';

          if (endTokenIndex !== -1) {
            // found </completion>, so we have a full chunk
            chunk = buffer.slice(0, endTokenIndex);
            buffer = buffer.slice(endTokenIndex + LLM_END_TOKEN.length);
            inLLMResponse = false;
            console.debug('[Result] Found LLM_END_TOKEN => finalize chunk.');
          } else {
            // partial chunk of the LLM
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

      // finished streaming => finalize
      if (assistantResponse) {
        console.debug('[Result] Full assistant response:\n', assistantResponse);
        updateLastMessage(
          assistantResponse,
          { vector: vectorSearchSources, kg: kgSearchResult },
          false,
          searchPerformed
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          console.error('[Result] Streaming error:', err.message);
          setError(err.message);
        } else {
          console.debug('[Result] Streaming aborted by user.');
        }
      } else {
        console.error('[Result] Unknown streaming error:', err);
        setError('An unknown error occurred');
      }
    } finally {
      setIsSearching(false);
      setIsStreaming(false);
      setIsProcessingQuery(false);

      // Make sure we finalize the last assistant message if there's content
      console.debug(
        '[Result] parseStreaming cleanup, final content=',
        fullContent
      );
      updateLastMessage(
        fullContent,
        { vector: vectorSearchSources, kg: kgSearchResult },
        false,
        false
      );

      setQuery('');
      abortControllerRef.current = null;
    }
  };

  /**
   * If `query` changes and is non-empty => Start streaming parse
   * NOTE: There's a 500ms debounce in your original code. If you want the
   * “thinking” UI to appear literally instantly, you can remove it.
   */
  useEffect(() => {
    if (query === '' || !pipelineUrl) {
      return;
    }
    console.debug(
      '[Result] Detected new query -> Starting parse in 500ms:',
      query
    );
    const debouncedParseStreaming = setTimeout(() => {
      parseStreaming(query);
    }, 500);

    return () => clearTimeout(debouncedParseStreaming);
  }, [query, userId, pipelineUrl]);

  /** PDF preview controls */
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
            You&apos;re using the Agent interface, which leverages an LLM and
            tools for dynamic, context-driven answers. For simpler, direct
            responses, switch to RAG Q&A.
          </AlertDescription>
        </Alert>
      )}

      <div
        ref={containerRef}
        className="flex flex-col space-y-8 mb-4 overflow-y-auto flex-1"
      >
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

      {hasAttemptedFetch && uploadedDocuments?.length === 0 && pipelineUrl && (
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

// import {
//   GenerationConfig,
//   IndexMeasure,
//   SearchSettings,
//   GraphSearchSettings,
//   ChunkSearchSettings,
// } from 'r2r-js';
// import React, { FC, useEffect, useState, useRef } from 'react';

// import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { useUserContext } from '@/context/UserContext';
// import { Message } from '@/types';

// import { Answer } from './answer';
// import { DefaultQueries } from './DefaultQueries';
// import MessageBubble from './MessageBubble';
// import { UploadButton } from './upload';

// // Marker constants for streaming logic
// const CHUNK_SEARCH_STREAM_MARKER = '<chunk_search>';
// const CHUNK_SEARCH_STREAM_END_MARKER = '</chunk_search>';
// const GRAPH_SEARCH_STREAM_MARKER = '<graph_search>';
// const GRAPH_SEARCH_STREAM_END_MARKER = '</graph_search>';
// const LLM_START_TOKEN = '<completion>';
// const LLM_END_TOKEN = '</completion>';

// export const Result: FC<{
//   query: string;
//   setQuery: (query: string) => void;
//   userId: string | null;
//   pipelineUrl: string | null;
//   searchLimit: number;
//   searchFilters: Record<string, unknown>;
//   ragTemperature: number | null;
//   ragTopP: number | null;
//   ragTopK: number | null;
//   ragMaxTokensToSample: number | null;
//   model: string | null;
//   uploadedDocuments: string[];
//   setUploadedDocuments: React.Dispatch<React.SetStateAction<string[]>>;
//   hasAttemptedFetch: boolean;
//   switches: any;
//   mode: 'rag' | 'rag_agent';
//   selectedCollectionIds: string[];
//   onAbortRequest?: () => void;
//   messages: Message[];
//   setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
//   selectedConversationId: string | null;
//   setSelectedConversationId: React.Dispatch<
//     React.SetStateAction<string | null>
//   >;
// }> = ({
//   query,
//   setQuery,
//   userId,
//   pipelineUrl,
//   searchLimit,
//   searchFilters,
//   ragTemperature,
//   ragTopP,
//   ragTopK,
//   ragMaxTokensToSample,
//   model,
//   uploadedDocuments,
//   setUploadedDocuments,
//   hasAttemptedFetch,
//   switches,
//   mode,
//   selectedCollectionIds,
//   onAbortRequest,
//   messages,
//   setMessages,
//   selectedConversationId,
//   setSelectedConversationId,
// }) => {
//   // Abort controller for streaming requests
//   const abortControllerRef = useRef<AbortController | null>(null);

//   // Refs for scrolling
//   const containerRef = useRef<HTMLDivElement>(null); // The scrollable container
//   const messagesEndRef = useRef<HTMLDivElement>(null); // "Bottom" marker

//   // Local state
//   const [isStreaming, setIsStreaming] = useState<boolean>(false);
//   const [isSearching, setIsSearching] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isProcessingQuery, setIsProcessingQuery] = useState(false);

//   // Track the last time the user scrolled up (manually)
//   const [lastScrollUpTime, setLastScrollUpTime] = useState<number>(0);
//   // This sets how many milliseconds to wait before “resuming” auto-scroll
//   const SCROLL_BACK_DELAY_MS = 3000; // e.g. 3 seconds

//   // For PDF previews
//   const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
//   const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<
//     string | null
//   >(null);
//   const [initialPage, setInitialPage] = useState<number>(1);

//   const { getClient } = useUserContext();

//   /**
//    * Reset state whenever "mode" changes (e.g. from 'rag' to 'rag_agent')
//    */
//   useEffect(() => {
//     abortCurrentRequest();
//     setMessages([]);
//     setIsStreaming(false);
//     setIsSearching(false);
//     setError(null);
//     setIsProcessingQuery(false);
//   }, [mode]);

//   /**
//    * On every new messages array:
//    * 1) Save them to localStorage
//    * 2) Conditionally auto-scroll if user hasn't recently scrolled up
//    */
//   useEffect(() => {
//     localStorage.setItem('chatMessages', JSON.stringify(messages));

//     if (!containerRef.current) return;

//     const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
//     const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

//     // Conditions to auto-scroll:
//     // 1) user is near bottom already (< 50px), OR
//     // 2) enough time has passed since last scroll up (the user let go)
//     const userIsNearBottom = distanceFromBottom < 50;
//     const now = Date.now();
//     const enoughTimeSinceScrollUp =
//       now - lastScrollUpTime > SCROLL_BACK_DELAY_MS;

//     if (userIsNearBottom || enoughTimeSinceScrollUp) {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [messages, lastScrollUpTime]);

//   /**
//    * Whenever the user scrolls inside the container,
//    * if they've scrolled away from the bottom, record that time.
//    */
//   useEffect(() => {
//     const handleScroll = () => {
//       if (!containerRef.current) return;

//       const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
//       const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

//       // If user is more than 50px away from the bottom,
//       // we consider them "scrolling up" (or at least manually moving).
//       if (distanceFromBottom > 50) {
//         setLastScrollUpTime(Date.now());
//       }
//     };

//     const ref = containerRef.current;
//     if (!ref) return;

//     ref.addEventListener('scroll', handleScroll);
//     return () => {
//       ref.removeEventListener('scroll', handleScroll);
//     };
//   }, []);

//   /**
//    * Helper function to update the last assistant message or add a new one
//    */
//   const updateLastMessage = (
//     content?: string,
//     sources?: Record<string, string | null>,
//     isStreaming?: boolean,
//     searchPerformed?: boolean
//   ) => {
//     setMessages((prevMessages) => {
//       const lastMessage = prevMessages[prevMessages.length - 1];
//       if (lastMessage?.role === 'assistant') {
//         // If the last message is from the assistant, update it
//         return [
//           ...prevMessages.slice(0, -1),
//           {
//             ...lastMessage,
//             ...(content !== undefined && { content }),
//             ...(sources !== undefined && { sources }),
//             ...(isStreaming !== undefined && { isStreaming }),
//             ...(searchPerformed !== undefined && { searchPerformed }),
//           },
//         ];
//       } else {
//         // Otherwise, add a new assistant message
//         return [
//           ...prevMessages,
//           {
//             role: 'assistant',
//             content: content || '',
//             id: Date.now().toString(),
//             timestamp: Date.now(),
//             isStreaming: isStreaming || false,
//             sources: sources || {},
//             searchPerformed: searchPerformed || false,
//           },
//         ];
//       }
//     });
//   };

//   /**
//    * Abort any current streaming request
//    */
//   const abortCurrentRequest = () => {
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//       abortControllerRef.current = null;
//     }
//     if (onAbortRequest) {
//       onAbortRequest();
//     }
//   };

//   /**
//    * Main streaming logic for RAG or RAG-Agent
//    */
//   const parseStreaming = async (userQuery: string): Promise<void> => {
//     if (isProcessingQuery) {
//       return;
//     }

//     // Abort any previous request
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//     }
//     abortControllerRef.current = new AbortController();
//     const { signal } = abortControllerRef.current;

//     setIsProcessingQuery(true);
//     setIsStreaming(true);
//     setError(null);

//     // The user's new message
//     const newUserMessage: Message = {
//       role: 'user',
//       content: userQuery,
//       id: Date.now().toString(),
//       timestamp: Date.now(),
//       sources: {},
//     };

//     // We'll have an assistant message eventually, but let's pre-append the user message
//     setMessages((prevMessages) => [...prevMessages, newUserMessage]);

//     let buffer = '';
//     let inLLMResponse = false;
//     let fullContent = '';
//     let vectorSearchSources = null;
//     let kgSearchResult = null;
//     let searchPerformed = false;

//     try {
//       // Get r2r-js client
//       const client = await getClient();
//       if (!client) {
//         throw new Error('Failed to get authenticated client');
//       }

//       // If we don't have a conversation ID, wait for one one
//       let currentConversationId = selectedConversationId;
//       if (!currentConversationId && mode === 'rag_agent') {
//         const newConversation = await client.conversations.create();
//         if (!newConversation?.results) {
//           throw new Error('Failed to create a new conversation');
//         }
//         currentConversationId = newConversation.results.id;
//         if (typeof currentConversationId !== 'string') {
//           throw new Error('Invalid conversation ID received');
//         }
//         setSelectedConversationId(currentConversationId);
//       }

//       if (!currentConversationId && mode === 'rag_agent') {
//         setError('No valid conversation ID. Please try again.');
//         return;
//       }

//       // Build generation and search configs
//       const ragGenerationConfig: GenerationConfig = {
//         stream: true,
//         temperature: ragTemperature ?? undefined,
//         topP: ragTopP ?? undefined,
//         maxTokensToSample: ragMaxTokensToSample ?? undefined,
//         model: model && model !== 'null' ? model : undefined,
//       };

//       const vectorSearchSettings: ChunkSearchSettings = {
//         indexMeasure: IndexMeasure.COSINE_DISTANCE,
//         enabled: switches.vectorSearch?.checked ?? true,
//       };

//       // If user selected any collections, combine them with filters
//       if (selectedCollectionIds.length > 0) {
//         if (Object.keys(searchFilters).length > 0) {
//           // Combine existing filters with the collection filter
//           searchFilters = {
//             $and: [
//               searchFilters,
//               { collection_id: { $in: selectedCollectionIds } },
//             ],
//           };
//         } else {
//           searchFilters = { collection_id: { $in: selectedCollectionIds } };
//         }
//       }

//       const graphSearchSettings: GraphSearchSettings = {
//         enabled: switches.knowledgeGraphSearch?.checked ?? true,
//       };

//       const searchSettings: SearchSettings = {
//         useHybridSearch: switches.hybridSearch?.checked ?? false,
//         useSemanticSearch: switches.vectorSearch?.checked ?? true,
//         filters: searchFilters,
//         limit: searchLimit,
//         chunkSettings: vectorSearchSettings,
//         graphSettings: graphSearchSettings,
//       };

//       setIsSearching(true);

//       // Either use RAG or RAG-Agent
//       const streamResponse =
//         mode === 'rag_agent'
//           ? await client.retrieval.agent({
//               message: newUserMessage,
//               ragGenerationConfig,
//               searchSettings,
//               //@ts-ignore
//               conversationId: currentConversationId,
//             })
//           : await client.retrieval.rag({
//               query: userQuery,
//               ragGenerationConfig,
//               searchSettings,
//             });
//       // Stream reading
//       const reader = streamResponse.getReader();
//       const decoder = new TextDecoder();
//       let assistantResponse = '';

//       // Start reading in a loop
//       while (true) {
//         if (signal.aborted) {
//           reader.cancel();
//           break;
//         }
//         const { done, value } = await reader.read();
//         if (done) {
//           break;
//         }

//         // Decode partial chunk
//         buffer += decoder.decode(value, { stream: true });

//         // Check for search results in the partial chunk
//         if (
//           buffer.includes(CHUNK_SEARCH_STREAM_END_MARKER) ||
//           buffer.includes(GRAPH_SEARCH_STREAM_END_MARKER)
//         ) {
//           if (buffer.includes(CHUNK_SEARCH_STREAM_MARKER)) {
//             vectorSearchSources = buffer
//               .split(CHUNK_SEARCH_STREAM_MARKER)[1]
//               .split(CHUNK_SEARCH_STREAM_END_MARKER)[0];
//             searchPerformed = true;
//           }

//           if (buffer.includes(GRAPH_SEARCH_STREAM_MARKER)) {
//             kgSearchResult = buffer
//               .split(GRAPH_SEARCH_STREAM_MARKER)[1]
//               .split(GRAPH_SEARCH_STREAM_END_MARKER)[0];
//             searchPerformed = true;
//           }

//           console.log('vectorSearchSources = ', vectorSearchSources);
//           // Update the assistant message with search results so far
//           updateLastMessage(
//             fullContent,
//             { vector: vectorSearchSources, kg: kgSearchResult },
//             true,
//             searchPerformed
//           );
//           setIsSearching(false);
//         }

//         // Check for LLM response
//         if (buffer.includes(LLM_START_TOKEN)) {
//           setIsSearching(false);
//           inLLMResponse = true;
//           // Remove everything up to the LLM_START_TOKEN
//           buffer = buffer.split(LLM_START_TOKEN)[1] || '';
//         }

//         if (inLLMResponse) {
//           const endTokenIndex = buffer.indexOf(LLM_END_TOKEN);
//           let chunk = '';

//           if (endTokenIndex !== -1) {
//             // If we found the LLM_END_TOKEN, we have a full chunk
//             chunk = buffer.slice(0, endTokenIndex);
//             buffer = buffer.slice(endTokenIndex + LLM_END_TOKEN.length);
//             inLLMResponse = false;
//           } else {
//             // Otherwise, everything is still part of the LLM chunk
//             chunk = buffer;
//             buffer = '';
//           }

//           fullContent += chunk;
//           assistantResponse += chunk;
//           updateLastMessage(
//             fullContent,
//             { vector: vectorSearchSources, kg: kgSearchResult },
//             true,
//             searchPerformed
//           );
//         }
//       }

//       // End of stream => finalize assistant message
//       if (assistantResponse) {
//         updateLastMessage(
//           assistantResponse,
//           { vector: vectorSearchSources, kg: kgSearchResult },
//           false,
//           searchPerformed
//         );

//         // Store the final assistant message into the conversation
//         try {
//           // await client.conversations.addMessage({
//           //   // @ts-ignore
//           //   id: currentConversationId,
//           //   role: 'assistant',
//           //   content: assistantResponse,
//           // });
//         } catch (convError) {
//           console.error(
//             'Error adding assistant message to conversation:',
//             convError
//           );
//         }
//       }
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         // If user manually aborted, we do nothing extra
//         if (err.name !== 'AbortError') {
//           console.error('Error in streaming:', err.message);
//           setError(err.message);
//         }
//       } else {
//         console.error('Unknown error in streaming:', err);
//         setError('An unknown error occurred');
//       }
//     } finally {
//       setIsSearching(false);
//       setIsStreaming(false);
//       // Make sure we finalize the last message if there's content
//       updateLastMessage(
//         fullContent,
//         { vector: vectorSearchSources, kg: kgSearchResult },
//         false,
//         searchPerformed
//       );
//       setQuery('');
//       setIsProcessingQuery(false);
//       abortControllerRef.current = null;
//     }
//     setIsStreaming(false);
//   };

//   /**
//    * Whenever `query` changes (and is non-empty), we start the streaming parse
//    * with a small debounce (500ms).
//    */
//   useEffect(() => {
//     if (query === '' || !pipelineUrl) {
//       return;
//     }
//     const debouncedParseStreaming = setTimeout(() => {
//       parseStreaming(query);
//     }, 500);

//     return () => clearTimeout(debouncedParseStreaming);
//   }, [query, userId, pipelineUrl]);

//   /**
//    * PDF preview controls
//    */
//   const handleOpenPdfPreview = (id: string, page?: number) => {
//     setPdfPreviewDocumentId(id);
//     setInitialPage(page && page > 0 ? page : 1);
//     setPdfPreviewOpen(true);
//   };

//   const handleClosePdfPreview = () => {
//     setPdfPreviewOpen(false);
//     setPdfPreviewDocumentId(null);
//     setInitialPage(1);
//   };

//   /**
//    * Render
//    */
//   return (
//     <div className="flex flex-col gap-8 h-full">
//       {/*
//         The container that scrolls:
//         - attach containerRef
//         - define overflow-y-auto so it can scroll
//         - set some height or let flex-based layout control it
//       */}
//       {mode === 'rag_agent' && (
//         <Alert className="mb-4 bg-zinc-800 border-zinc-600">
//           <AlertDescription className="text-sm text-white">
//             You&apos;re using the Agent interface, which leverages an LLM and
//             tools for dynamic, context-driven answers. For simpler, direct
//             responses, switch to RAG Q&A.
//           </AlertDescription>
//         </Alert>
//       )}

//       <div
//         ref={containerRef}
//         className="flex flex-col space-y-8 mb-4 overflow-y-auto flex-1"
//       >
//         {messages.map((message) => (
//           <React.Fragment key={message.id}>
//             {message.role === 'user' ? (
//               <MessageBubble message={message} />
//             ) : (
//               <Answer
//                 message={message}
//                 isStreaming={message.isStreaming || false}
//                 isSearching={isSearching}
//                 mode={mode}
//               />
//             )}
//           </React.Fragment>
//         ))}
//         {/* "Bottom" marker: we scroll here if user is near bottom OR enough time passed */}
//         <div ref={messagesEndRef} />
//       </div>

//       {error && <div className="text-red-500">Error: {error}</div>}

//       {!query && messages.length === 0 && (
//         <DefaultQueries setQuery={setQuery} mode={mode} />
//       )}

//       {hasAttemptedFetch && uploadedDocuments?.length === 0 && pipelineUrl && (
//         <div className="absolute inset-4 flex items-center justify-center backdrop-blur-sm">
//           <div className="flex items-center p-4 bg-white shadow-2xl rounded text-black font-medium gap-4">
//             Please upload at least one document to submit queries.&nbsp;
//             <UploadButton setUploadedDocuments={setUploadedDocuments} />
//           </div>
//         </div>
//       )}

//       <PdfPreviewDialog
//         id={pdfPreviewDocumentId || ''}
//         open={pdfPreviewOpen}
//         onClose={handleClosePdfPreview}
//         initialPage={initialPage}
//       />
//     </div>
//   );
// };
