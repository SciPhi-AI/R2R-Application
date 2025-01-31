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

// Default URLs and constants
const DEFAULT_PRODUCTION_URL = 'https://api.cloud.sciphi.ai';
const DEFAULT_DEVELOPMENT_URL = 'http://0.0.0.0:7272';
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_API_URL || DEFAULT_PRODUCTION_URL;
const DEVELOPMENT_URL = process.env.NEXT_PUBLIC_DEVELOPMENT_API_URL || DEFAULT_DEVELOPMENT_URL;
const DEFAULT_DEPLOYMENT_URL = process.env.NEXT_PUBLIC_ENV === 'development' ? DEVELOPMENT_URL : PRODUCTION_URL;

// Helper to clean chain-of-thought text
const cleanThought = (thought: string): string => {
  return thought.replace(/<\/?Thought>/g, '').trim();
};

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
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | null>>;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Local UI state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const [lastScrollUpTime, setLastScrollUpTime] = useState<number>(0);
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
    localStorage.setItem('chatMessages', JSON.stringify(messages));

    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // If user is near the bottom, or enough time has passed since last scroll, auto-scroll
    const userIsNearBottom = distanceFromBottom < 50;
    const now = Date.now();
    const enoughTimeSinceScrollUp = now - lastScrollUpTime > SCROLL_BACK_DELAY_MS;

    if (userIsNearBottom || enoughTimeSinceScrollUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, lastScrollUpTime]);

  // Track user scrolling up, so we don't yank the scroll on them
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

  // Abort any ongoing request
  const abortCurrentRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (onAbortRequest) {
      onAbortRequest();
    }
  };

  // Update the *last* assistant message in state (or create a new one if needed).
  const updateLastAssistantMessage = (
    content: string,
    chainOfThought: string[],
    isStreaming: boolean
  ) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      // If the last message is already an assistant, just update it
      if (lastMessage?.role === 'assistant') {
        return [
          ...prevMessages.slice(0, -1),
          {
            ...lastMessage,
            content,
            chainOfThought: chainOfThought.map(cleanThought),
            isStreaming,
          },
        ];
      } else {
        // Otherwise, create a new assistant message
        return [
          ...prevMessages,
          {
            role: 'assistant',
            content,
            id: Date.now().toString(),
            timestamp: Date.now(),
            isStreaming,
            chainOfThought: chainOfThought.map(cleanThought),
          },
        ];
      }
    });
  };

  // ---- Main streaming logic with a single buffer approach ----
  const parseStreaming = async (userQuery: string): Promise<void> => {
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

    // 2) Add placeholder assistant message (so we can show streaming content)
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
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // If using agent mode, ensure we have a conversation ID
      let currentConversationId = selectedConversationId;
      if (!currentConversationId && mode === 'rag_agent') {
        const newConversation = await client.conversations.create();
        if (!newConversation?.results) {
          throw new Error('Failed to create conversation');
        }
        currentConversationId = newConversation.results.id;
        setSelectedConversationId(currentConversationId);
      }

      // Configure generation settings
      const ragGenerationConfig: GenerationConfig = {
        stream: true,
        temperature: ragTemperature ?? undefined,
        topP: ragTopP ?? undefined,
        maxTokensToSample: ragMaxTokensToSample ?? undefined,
        model: model && model !== 'null' ? model : undefined,
      };

      // Configure search settings
      let combinedFilters = { ...searchFilters };
      if (selectedCollectionIds.length > 0) {
        // Combine filters with collection filter
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

      // 3) Get the streaming response from the client
      const streamResponse =
        mode === 'rag_agent'
          ? await client.retrieval.reasoningAgent({
              message: newUserMessage,
              ragGenerationConfig,
              searchSettings,
              //@ts-ignore
              conversationId: currentConversationId,
              //@ts-ignore
              tools: enabledTools,
            })
          : await client.retrieval.rag({
              query: userQuery,
              ragGenerationConfig,
              searchSettings,
            });

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();

      // We'll keep all completed chain-of-thought blocks in this array
      const chainOfThoughtBlocks: string[] = [];
      let finalResponse = '';

      // We maintain one buffer of unparsed text
      let buffer = '';

      // Helper regexes
      const thoughtRegex = /<Thought([\s\S]*?)<\/Thought/;
      const responseRegex = /<Response([\s\S]*?)<\/Response/;

      // We'll parse from the buffer as many times as we can each iteration
      while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk and append to buffer
        buffer += decoder.decode(value, { stream: true });

        let parseAgain = true;
        while (parseAgain) {
          parseAgain = false;

          // 1) Look for a complete <Thought>...</Thought> block
          const thoughtMatch = thoughtRegex.exec(buffer);
          // 2) Or look for a complete <Response>...</Response> block
          const responseMatch = responseRegex.exec(buffer);

          // We might find a Thought or Response or neither or both
          // Decide which block starts earliest in the buffer
          const thoughtIndex = thoughtMatch?.index ?? -1;
          const responseIndex = responseMatch?.index ?? -1;

          // If we didn't find any complete block, stop parsing
          if (thoughtIndex < 0 && responseIndex < 0) {
            break;
          }

          // Choose whichever appears first in the buffer
          let nextBlock: 'thought' | 'response' | null = null;
          if (thoughtIndex >= 0 && responseIndex >= 0) {
            nextBlock = thoughtIndex < responseIndex ? 'thought' : 'response';
          } else if (thoughtIndex >= 0) {
            nextBlock = 'thought';
          } else if (responseIndex >= 0) {
            nextBlock = 'response';
          }

          if (nextBlock === 'thought' && thoughtMatch) {
            // Extract the entire match
            const fullMatch = thoughtMatch[0];
            const content = thoughtMatch[1] || '';

            // Add to chain of thought
            chainOfThoughtBlocks.push(content.trim());

            // Remove that block from the buffer
            const startIdx = thoughtMatch.index;
            buffer =
              buffer.slice(0, startIdx) +
              buffer.slice(startIdx + fullMatch.length);

            parseAgain = true;
          } else if (nextBlock === 'response' && responseMatch) {
            // Extract the entire match
            const fullMatch = responseMatch[0];
            const content = responseMatch[1] || '';

            // Append to final response
            finalResponse += content;

            // Remove that block from the buffer
            const startIdx = responseMatch.index;
            buffer =
              buffer.slice(0, startIdx) +
              buffer.slice(startIdx + fullMatch.length);

            parseAgain = true;
          }

          // After each parse, update the assistant message in UI
          updateLastAssistantMessage(finalResponse, chainOfThoughtBlocks, true);
        }

        // If we couldn't parse anything more from the buffer, we do a partial update
        // The leftover `buffer` might contain partial tags, but let's show partial
        // text outside recognized <Thought>/<Response> blocks as part of response.
        // (Optional) You could parse raw text from buffer if you want more granular partial updates:
        // For simplicity, we won't treat that as part of finalResponse yet.
      }

      // --- Done reading ---
      // If there's leftover in the buffer, it might be partial or trailing text
      // For a final parse, you could attempt one more time:
      // (But if the server is well-formed, it should close tags properly.)

      // Final update to mark not streaming
      updateLastAssistantMessage(finalResponse, chainOfThoughtBlocks, false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // request was aborted by user
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

  // Fire off the parse function when `query` changes (with small debounce)
  useEffect(() => {
    if (!query || !pipelineUrl) return;
    const debounced = setTimeout(() => {
      parseStreaming(query);
    }, 500);

    return () => clearTimeout(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, userId, pipelineUrl]);

  // PDF preview
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
            Currently using our advanced reasoning agent. For quick, direct answers,
            R2R supports <strong>fast rag mode</strong>.
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

// // Default URLs and constants
// const DEFAULT_PRODUCTION_URL = 'https://api.cloud.sciphi.ai';
// const DEFAULT_DEVELOPMENT_URL = 'http://0.0.0.0:7272';
// const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_API_URL || DEFAULT_PRODUCTION_URL;
// const DEVELOPMENT_URL = process.env.NEXT_PUBLIC_DEVELOPMENT_API_URL || DEFAULT_DEVELOPMENT_URL;
// const DEFAULT_DEPLOYMENT_URL = process.env.NEXT_PUBLIC_ENV === 'development' ? DEVELOPMENT_URL : PRODUCTION_URL;

// // Stream parsing constants
// const THOUGHT_START = '<Thought';
// const THOUGHT_END = '</Thought';
// const RESPONSE_START = '<Response';
// const RESPONSE_END = '</Response';

// // Clean thought content helper
// const cleanThought = (thought: string): string => {
//   return thought?.replace(/<\/?Thought>/g, '').trim();
// };

// interface ResultProps {
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
//   setSelectedConversationId: React.Dispatch<React.SetStateAction<string | null>>;
//   enabledTools: string[];
// }

// export const Result: FC<ResultProps> = ({
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
//   enabledTools,
// }) => {
//   const abortControllerRef = useRef<AbortController | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // State
//   const [isStreaming, setIsStreaming] = useState(false);
//   const [isSearching, setIsSearching] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isProcessingQuery, setIsProcessingQuery] = useState(false);
//   const [lastScrollUpTime, setLastScrollUpTime] = useState<number>(0);
//   const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
//   const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<string | null>(null);
//   const [initialPage, setInitialPage] = useState<number>(1);

//   const SCROLL_BACK_DELAY_MS = 3000;
//   const { getClient } = useUserContext();

//   // Reset on mode change
//   useEffect(() => {
//     abortCurrentRequest();
//     setMessages([]);
//     setIsStreaming(false);
//     setIsSearching(false);
//     setError(null);
//     setIsProcessingQuery(false);
//   }, [mode]);

//   // Auto-scroll logic
//   useEffect(() => {
//     localStorage.setItem('chatMessages', JSON.stringify(messages));
//     if (!containerRef.current) return;

//     const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
//     const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

//     const userIsNearBottom = distanceFromBottom < 50;
//     const now = Date.now();
//     const enoughTimeSinceScrollUp = now - lastScrollUpTime > SCROLL_BACK_DELAY_MS;

//     if (userIsNearBottom || enoughTimeSinceScrollUp) {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [messages, lastScrollUpTime]);

//   // Scroll tracking
//   useEffect(() => {
//     const handleScroll = () => {
//       if (!containerRef.current) return;
//       const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
//       const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
//       if (distanceFromBottom > 50) {
//         setLastScrollUpTime(Date.now());
//       }
//     };
//     const ref = containerRef.current;
//     if (!ref) return;
//     ref.addEventListener('scroll', handleScroll);
//     return () => ref.removeEventListener('scroll', handleScroll);
//   }, []);

//   const abortCurrentRequest = () => {
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//       abortControllerRef.current = null;
//     }
//     if (onAbortRequest) {
//       onAbortRequest();
//     }
//   };

//   // Message update helper
//   const updateLastMessage = (
//     content: string,
//     chainOfThought: string[],
//     isStreaming: boolean
//   ) => {
//     setMessages((prevMessages) => {
//       const lastMessage = prevMessages[prevMessages.length - 1];
//       if (lastMessage?.role === 'assistant') {
//         return [
//           ...prevMessages.slice(0, -1),
//           {
//             ...lastMessage,
//             content,
//             chainOfThought: chainOfThought.map(cleanThought),
//             isStreaming,
//           },
//         ];
//       } else {
//         return [
//           ...prevMessages,
//           {
//             role: 'assistant',
//             content,
//             id: Date.now().toString(),
//             timestamp: Date.now(),
//             isStreaming,
//             chainOfThought: chainOfThought.map(cleanThought),
//           },
//         ];
//       }
//     });
//   };

//   // Main streaming logic
//   const parseStreaming = async (userQuery: string): Promise<void> => {
//     if (isProcessingQuery) return;
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//     }

//     abortControllerRef.current = new AbortController();
//     const { signal } = abortControllerRef.current;

//     setIsProcessingQuery(true);
//     setIsStreaming(true);
//     setError(null);

//     // Add user message
//     const newUserMessage: Message = {
//       role: 'user',
//       content: userQuery,
//       id: Date.now().toString(),
//       timestamp: Date.now(),
//     };
//     setMessages((prev) => [...prev, newUserMessage]);

//     // Add placeholder assistant message
//     setMessages((prev) => [
//       ...prev,
//       {
//         role: 'assistant',
//         content: '',
//         id: (Date.now() + 1).toString(),
//         timestamp: Date.now(),
//         isStreaming: true,
//         chainOfThought: [],
//       },
//     ]);

//     try {
//       const client = await getClient();
//       if (!client) {
//         throw new Error('Failed to get authenticated client');
//       }

//       // Handle conversation creation for agent mode
//       let currentConversationId = selectedConversationId;
//       if (!currentConversationId && mode === 'rag_agent') {
//         const newConversation = await client.conversations.create();
//         if (!newConversation?.results) {
//           throw new Error('Failed to create conversation');
//         }
//         currentConversationId = newConversation.results.id;
//         setSelectedConversationId(currentConversationId);
//       }

//       // Configure generation settings
//       const ragGenerationConfig: GenerationConfig = {
//         stream: true,
//         temperature: ragTemperature ?? undefined,
//         topP: ragTopP ?? undefined,
//         maxTokensToSample: ragMaxTokensToSample ?? undefined,
//         model: model && model !== 'null' ? model : undefined,
//       };

//       // Configure search settings
//       let combinedFilters = { ...searchFilters };
//       if (selectedCollectionIds.length > 0) {
//         if (Object.keys(combinedFilters).length > 0) {
//           combinedFilters = {
//             $and: [
//               combinedFilters,
//               { collection_id: { $in: selectedCollectionIds } },
//             ],
//           };
//         } else {
//           combinedFilters = { collection_id: { $in: selectedCollectionIds } };
//         }
//       }

//       const vectorSearchSettings: ChunkSearchSettings = {
//         indexMeasure: IndexMeasure.COSINE_DISTANCE,
//         enabled: switches.vectorSearch?.checked ?? true,
//       };

//       const graphSearchSettings: GraphSearchSettings = {
//         enabled: switches.knowledgeGraphSearch?.checked ?? true,
//       };

//       const searchSettings: SearchSettings = {
//         useHybridSearch: switches.hybridSearch?.checked ?? false,
//         useSemanticSearch: switches.vectorSearch?.checked ?? true,
//         filters: combinedFilters,
//         limit: searchLimit,
//         chunkSettings: vectorSearchSettings,
//         graphSettings: graphSearchSettings,
//       };

//       setIsSearching(true);

//       // Get stream response based on mode
//       const streamResponse =
//         mode === 'rag_agent'
//           ? await client.retrieval.reasoningAgent({
//               message: newUserMessage,
//               ragGenerationConfig,
//               searchSettings,
//               conversationId: currentConversationId,
//               tools: enabledTools,
//             })
//           : await client.retrieval.rag({
//               query: userQuery,
//               ragGenerationConfig,
//               searchSettings,
//             });

//       const reader = streamResponse.getReader();
//       const decoder = new TextDecoder();

//       // Stream parsing state
//       let currentThoughtIndex = -1;
//       const chainOfThoughtBlocks: string[] = [];
//       let thoughtBuffer = '';
//       let responseBuffer = '';
//       let finalResponse = '';
//       let isCapturingThought = false;
//       let isCapturingResponse = false;
//       let chunk = '';

//       while (true) {
//         if (signal.aborted) {
//           reader.cancel();
//           break;
//         }

//         const { done, value } = await reader.read();
//         if (done) break;

//         const tempChunk = decoder.decode(value, { stream: true });
//         console.log(tempChunk);
        
//         // Handle split thought tags across chunks
//         if (tempChunk.includes('</Thought') && !tempChunk.includes('</Thought>')) {
//           chunk = tempChunk;
//           continue;
//         } else {
//           if (tempChunk.includes('</Thought') && !tempChunk.includes('</Thought>')) {
//             chunk += tempChunk;
//           } else {
//             chunk = tempChunk;
//           }
//         }

//         // Process complete thought blocks first
//         const thoughtBlockRegex = /<Thought>(.*?)<\/Thought>/gs;
//         let thoughtBlockMatch;
//         let processedIndex = 0;

//         console.log('chainOfThoughtBlocks = ', chainOfThoughtBlocks)

//         while ((thoughtBlockMatch = thoughtBlockRegex.exec(chunk)) !== null) {
//           if (isCapturingThought && processedIndex < thoughtBlockMatch.index) {
//             thoughtBuffer += chunk.slice(processedIndex, thoughtBlockMatch.index);
//             currentThoughtIndex++;
//             chainOfThoughtBlocks[currentThoughtIndex] = thoughtBuffer.trim();
//             thoughtBuffer = '';
//             isCapturingThought = false;
//           }

//           currentThoughtIndex++;
//           chainOfThoughtBlocks[currentThoughtIndex] = thoughtBlockMatch[1].trim();
//           processedIndex = thoughtBlockMatch.index + thoughtBlockMatch[0].length;

//           const partialResponse = finalResponse + (isCapturingResponse ? responseBuffer : '');
//           updateLastMessage(
//             partialResponse,
//             chainOfThoughtBlocks.slice(0, currentThoughtIndex + 1),
//             true
//           );
//         }

//         // Process remaining chunk
//         chunk = chunk.slice(processedIndex);

//         while (true) {
//           const tokenRegex = new RegExp(
//             `(${THOUGHT_START}|${THOUGHT_END}|${RESPONSE_START}|${RESPONSE_END})`
//           );
//           const match = chunk.match(tokenRegex);

//           if (!match) {
//             if (isCapturingThought) {
//               thoughtBuffer += chunk;
//             } else if (isCapturingResponse) {
//               responseBuffer += chunk;
//             }

//             const partialChainOfThought = [
//               ...chainOfThoughtBlocks.slice(0, currentThoughtIndex + 1),
//               ...(isCapturingThought ? [thoughtBuffer.trim()] : []),
//             ];
//             const partialResponse = finalResponse + (isCapturingResponse ? responseBuffer : '');
//             updateLastMessage(partialResponse, partialChainOfThought, true);
//             break;
//           }

//           const tokenIndex = match.index ?? 0;
//           const beforeTag = chunk.slice(0, tokenIndex);
//           const tag = match[0];
//           const afterTag = chunk.slice(tokenIndex + tag.length);

//           if (isCapturingThought) {
//             thoughtBuffer += beforeTag;
//           } else if (isCapturingResponse) {
//             responseBuffer += beforeTag;
//           }

//           if (tag === THOUGHT_START) {
//             isCapturingThought = true;
//             currentThoughtIndex++;
//             thoughtBuffer = '';
//           } else if (tag === THOUGHT_END) {
//             isCapturingThought = false;
//             chainOfThoughtBlocks[currentThoughtIndex] = thoughtBuffer.trim();
//             thoughtBuffer = '';
//           } else if (tag === RESPONSE_START) {
//             isCapturingResponse = true;
//             responseBuffer = '';
//           } else if (tag === RESPONSE_END) {
//             isCapturingResponse = false;
//             finalResponse += responseBuffer;
//             responseBuffer = '';
//           }

//           const partialChainOfThought = chainOfThoughtBlocks.slice(0, currentThoughtIndex + 1);
//           const partialResponse = finalResponse + (isCapturingResponse ? responseBuffer : '');
//           updateLastMessage(partialResponse, partialChainOfThought, true);

//           chunk = afterTag;
//         }
//       }

//       // Final update for any remaining content
//       const leftoverChainOfThought = [
//         ...chainOfThoughtBlocks.slice(0, currentThoughtIndex + 1),
//         ...(isCapturingThought ? [thoughtBuffer.trim()] : []),
//       ];
//       const leftoverResponse = finalResponse + (isCapturingResponse ? responseBuffer : '');
//       updateLastMessage(leftoverResponse, leftoverChainOfThought, false);
//     } catch (err: any) {
//       if (err.name === 'AbortError') {
//         // Request was aborted, no action needed
//       } else {
//         setError(err.message || 'An error occurred');
//       }
//     } finally {
//       setIsSearching(false);
//       setIsStreaming(false);
//       setIsProcessingQuery(false);
//       setQuery('');
//       abortControllerRef.current = null;
//     }
//   };

//   // Handle query changes
//   useEffect(() => {
//     if (!query || !pipelineUrl) return;
//     const debounced = setTimeout(() => {
//       parseStreaming(query);
//     }, 500);

//     return () => clearTimeout(debounced);
//   }, [query, userId, pipelineUrl]);

//   // PDF preview handlers
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

//   return (
//     <div className="flex flex-col gap-8 h-full">
//       {mode === 'rag_agent' && (
//         <Alert className="mb-4 bg-zinc-800 border-zinc-600">
//           <AlertDescription className="text-sm text-white">
//             Currently using our advanced reasoning agent. For quick, direct answers,
//             R2R supports <strong>fast rag mode</strong>.
//           </AlertDescription>
//         </Alert>
//       )}

//       <div ref={containerRef} className="flex flex-col space-y-8 mb-4 flex-1">
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
//         <div ref={messagesEndRef} />
//       </div>

//       {error && <div className="text-red-500">Error: {error}</div>}

//       {!query && messages.length === 0 && (
//         <DefaultQueries setQuery={setQuery} mode={mode} />
//       )}

//       {hasAttemptedFetch && uploadedDocuments.length === 0 && pipelineUrl && (
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