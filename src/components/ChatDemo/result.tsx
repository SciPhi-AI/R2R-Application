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
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | null>>;
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

  // For PDF previews
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<string | null>(null);
  const [initialPage, setInitialPage] = useState<number>(1);

  const { getClient } = useUserContext();

  /**
   * Reset state whenever "mode" changes (e.g. from 'rag' to 'rag_agent')
   */
  useEffect(() => {
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
   * 2) Conditionally auto-scroll if user is near bottom
   */
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));

    // Only auto-scroll if the user is near the bottom already
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Adjust the threshold "100" to taste
      if (distanceFromBottom < 100) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  /**
   * Helper function to update the last assistant message or add a new one
   */
  const updateLastMessage = (
    content?: string,
    sources?: Record<string, string | null>,
    isStreaming?: boolean,
    searchPerformed?: boolean
  ) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        // If the last message is from the assistant, update it
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
        // Otherwise, add a new assistant message
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
   * Main streaming logic for RAG or RAG-Agent
   */
  const parseStreaming = async (userQuery: string): Promise<void> => {
    if (isProcessingQuery) {
      return;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsProcessingQuery(true);
    setIsStreaming(true);
    setError(null);

    // The user's new message
    const newUserMessage: Message = {
      role: 'user',
      content: userQuery,
      id: Date.now().toString(),
      timestamp: Date.now(),
      sources: {},
    };

    // We'll have an assistant message eventually, but let's pre-append the user message
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    let buffer = '';
    let inLLMResponse = false;
    let fullContent = '';
    let vectorSearchSources = null;
    let kgSearchResult = null;
    let searchPerformed = false;

    try {
      // Get r2r-js client
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // If we don't have a conversation ID, create one
      let currentConversationId = selectedConversationId;
      if (!currentConversationId) {
        const newConversation = await client.conversations.create();
        if (!newConversation?.results) {
          throw new Error('Failed to create a new conversation');
        }
        currentConversationId = newConversation.results.id;
        if (typeof currentConversationId !== 'string') {
          throw new Error('Invalid conversation ID received');
        }
        setSelectedConversationId(currentConversationId);
      }

      if (!currentConversationId) {
        setError('No valid conversation ID. Please try again.');
        return;
      }

      // Build generation and search configs
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

      // If user selected any collections, combine them with filters
      if (selectedCollectionIds.length > 0) {
        if (Object.keys(searchFilters).length > 0) {
          // Combine existing filters with the collection filter
          searchFilters = {
            $and: [
              searchFilters,
              { collection_id: { $in: selectedCollectionIds } },
            ],
          };
        } else {
          searchFilters = { collection_id: { $in: selectedCollectionIds } };
        }
      }

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

      setIsSearching(true);

      // Either use RAG or RAG-Agent
      const streamResponse =
        mode === 'rag_agent'
          ? await client.retrieval.agent({
              message: newUserMessage,
              ragGenerationConfig,
              searchSettings,
              conversationId: currentConversationId,
            })
          : await client.retrieval.rag({
              query: userQuery,
              ragGenerationConfig,
              searchSettings,
            });

      // Stream reading
      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      // Start reading in a loop
      while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        // Decode partial chunk
        buffer += decoder.decode(value, { stream: true });

        // Check for search results in the partial chunk
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

          // Update the assistant message with search results so far
          updateLastMessage(
            fullContent,
            { vector: vectorSearchSources, kg: kgSearchResult },
            true,
            searchPerformed
          );
          setIsSearching(false);
        }

        // Check for LLM response
        if (buffer.includes(LLM_START_TOKEN)) {
          setIsSearching(false);
          inLLMResponse = true;
          // Remove everything up to the LLM_START_TOKEN
          buffer = buffer.split(LLM_START_TOKEN)[1] || '';
        }

        if (inLLMResponse) {
          const endTokenIndex = buffer.indexOf(LLM_END_TOKEN);
          let chunk = '';

          if (endTokenIndex !== -1) {
            // If we found the LLM_END_TOKEN, we have a full chunk
            chunk = buffer.slice(0, endTokenIndex);
            buffer = buffer.slice(endTokenIndex + LLM_END_TOKEN.length);
            inLLMResponse = false;
          } else {
            // Otherwise, everything is still part of the LLM chunk
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

      // End of stream => finalize assistant message
      if (assistantResponse) {
        updateLastMessage(
          assistantResponse,
          { vector: vectorSearchSources, kg: kgSearchResult },
          false,
          searchPerformed
        );

        // Store the final assistant message into the conversation
        try {
          await client.conversations.addMessage({
            id: currentConversationId,
            role: 'assistant',
            content: assistantResponse,
          });
        } catch (convError) {
          console.error('Error adding assistant message to conversation:', convError);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        // If user manually aborted, we do nothing extra
        if (err.name !== 'AbortError') {
          console.error('Error in streaming:', err.message);
          setError(err.message);
        }
      } else {
        console.error('Unknown error in streaming:', err);
        setError('An unknown error occurred');
      }
    } finally {
      setIsSearching(false);
      setIsStreaming(false);
      // Make sure we finalize the last message if there's content
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
    setIsStreaming(false);
  };

  /**
   * Whenever `query` changes (and is non-empty), we start the streaming parse
   * with a small debounce (500ms).
   */
  useEffect(() => {
    if (query === '' || !pipelineUrl) {
      return;
    }
    const debouncedParseStreaming = setTimeout(() => {
      parseStreaming(query);
    }, 500);

    return () => clearTimeout(debouncedParseStreaming);
  }, [query, userId, pipelineUrl]);

  /**
   * PDF preview controls
   */
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

  /**
   * Render
   */
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* 
        The container that scrolls:
        - attach containerRef
        - define overflow-y-auto so it can scroll
        - set some height or let flex-based layout control it 
      */}
      <div
        ref={containerRef}
        className="flex flex-col space-y-8 mb-4 overflow-y-auto flex-1"
      >
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {message.role === 'user' ? (
              <MessageBubble message={message} />
            ) : (
              <Answer
                message={message}
                isStreaming={message.isStreaming || false}
                isSearching={isSearching}
              />
            )}
          </React.Fragment>
        ))}
        {/* "Bottom" marker: we scroll here if user is near bottom */}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="text-red-500">Error: {error}</div>}

      {!query && messages.length === 0 && (
        <DefaultQueries setQuery={setQuery} mode={mode} />
      )}

      {hasAttemptedFetch && uploadedDocuments?.length === 0 && pipelineUrl && mode === 'rag' && (
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
// import { useUserContext } from '@/context/UserContext';
// import { Message } from '@/types';

// import { Answer } from './answer';
// import { DefaultQueries } from './DefaultQueries';
// import MessageBubble from './MessageBubble';
// import { UploadButton } from './upload';

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
//   const abortControllerRef = useRef<AbortController | null>(null);
//   const [isStreaming, setIsStreaming] = useState<boolean>(false);
//   const [isSearching, setIsSearching] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isProcessingQuery, setIsProcessingQuery] = useState(false);
//   const { getClient } = useUserContext();
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
//   const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<
//     string | null
//   >(null);
//   const [initialPage, setInitialPage] = useState<number>(1);
//   useEffect(() => {
//     abortCurrentRequest();
//     setMessages([]);
//     setIsStreaming(false);
//     setIsSearching(false);
//     setError(null);
//     setIsProcessingQuery(false);
//   }, [mode]);

//   useEffect(() => {
//     localStorage.setItem('chatMessages', JSON.stringify(messages));
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const updateLastMessage = (
//     content?: string,
//     sources?: Record<string, string | null>,
//     isStreaming?: boolean,
//     searchPerformed?: boolean
//   ) => {
//     setMessages((prevMessages) => {
//       const lastMessage = prevMessages[prevMessages.length - 1];
//       if (lastMessage.role === 'assistant') {
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

//   const abortCurrentRequest = () => {
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//       abortControllerRef.current = null;
//     }
//     if (onAbortRequest) {
//       onAbortRequest();
//     }
//   };

//   const parseStreaming = async (query: string): Promise<void> => {
//     if (isProcessingQuery) {
//       return;
//     }

//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//     }

//     abortControllerRef.current = new AbortController();
//     const { signal } = abortControllerRef.current;

//     setIsProcessingQuery(true);
//     setIsStreaming(true);
//     setError(null);

//     const newUserMessage: Message = {
//       role: 'user',
//       content: query,
//       id: Date.now().toString(),
//       timestamp: Date.now(),
//       sources: {},
//     };

//     const newAssistantMessage: Message = {
//       role: 'assistant',
//       content: '',
//       id: (Date.now() + 1).toString(),
//       timestamp: Date.now() + 1,
//       isStreaming: true,
//       sources: {},
//       searchPerformed: false,
//     };

//     setMessages((prevMessages) => [...prevMessages, newUserMessage]);

//     let buffer = '';
//     let inLLMResponse = false;
//     let fullContent = '';
//     let vectorSearchSources = null;
//     let kgSearchResult = null;
//     let searchPerformed = false;

//     try {
//       const client = await getClient();
//       if (!client) {
//         throw new Error('Failed to get authenticated client');
//       }

//       let currentConversationId = selectedConversationId;

//       if (!currentConversationId) {
//         try {
//           const newConversation = await client.conversations.create();

//           if (!newConversation || !newConversation.results) {
//             throw new Error('Failed to create a new conversation');
//           }

//           currentConversationId = newConversation.results.id;

//           if (typeof currentConversationId !== 'string') {
//             throw new Error('Invalid conversation ID received');
//           }

//           setSelectedConversationId(currentConversationId);
//         } catch (error) {
//           console.error('Error creating new conversation:', error);
//           setError('Failed to create a new conversation. Please try again.');
//           return;
//         }
//       }

//       if (!currentConversationId) {
//         setError('No valid conversation ID. Please try again.');
//         return;
//       }

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
//         // selectedCollectionIds:
//         //   selectedCollectionIds.length > 0
//         //     ? [selectedCollectionIds].flat()
//         //     : undefined,
//       };
//       if (selectedCollectionIds.length > 0) {
//         if (Object.keys(searchFilters).length > 0) {
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

//       const streamResponse =
//         mode === 'rag_agent'
//           ? await client.retrieval.agent({
//               message: newUserMessage,
//               ragGenerationConfig: ragGenerationConfig,
//               searchSettings: searchSettings,
//               conversationId: currentConversationId,
//             })
//           : await client.retrieval.rag({
//               query: query,
//               ragGenerationConfig: ragGenerationConfig,
//               searchSettings: searchSettings,
//             });

//       const reader = streamResponse.getReader();
//       const decoder = new TextDecoder();

//       let assistantResponse = '';

//       while (true) {
//         if (signal.aborted) {
//           reader.cancel();
//           break;
//         }

//         const { done, value } = await reader.read();
//         if (done) {
//           break;
//         }
//         buffer += decoder.decode(value, { stream: true });
//         // Handle search results
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

//           if (buffer.includes(GRAPH_SEARCH_STREAM_END_MARKER)) {
//             kgSearchResult = buffer
//               .split(GRAPH_SEARCH_STREAM_MARKER)[1]
//               .split(GRAPH_SEARCH_STREAM_END_MARKER)[0];
//             searchPerformed = true;
//           }

//           updateLastMessage(
//             fullContent,
//             { vector: vectorSearchSources, kg: kgSearchResult },
//             true,
//             searchPerformed
//           );
//           setIsSearching(false);
//           // sleep 500ms to allow the user to see the loading spinner and for state to update
//         }

//         // Handle LLM response
//         if (buffer.includes(LLM_START_TOKEN)) {
//           setIsSearching(false);
//           inLLMResponse = true;
//           buffer = buffer.split(LLM_START_TOKEN)[1] || ''; // strip pre-stream content
//         }

//         if (inLLMResponse) {
//           setIsSearching(false);

//           const endTokenIndex = buffer.indexOf(LLM_END_TOKEN);
//           let chunk = '';

//           if (endTokenIndex !== -1) {
//             chunk = buffer.slice(0, endTokenIndex);
//             buffer = buffer.slice(endTokenIndex + LLM_END_TOKEN.length);
//             inLLMResponse = false;
//           } else {
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

//       if (assistantResponse) {
//         updateLastMessage(
//           assistantResponse,
//           { vector: vectorSearchSources, kg: kgSearchResult },
//           false,
//           searchPerformed
//         );

//         try {
//           await client.conversations.addMessage({
//             id: currentConversationId,
//             role: 'assistant',
//             content: assistantResponse,
//           });
//         } catch (error) {
//           console.error(
//             'Error adding assistant message to conversation:',
//             error
//           );
//         }
//       }
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         if (err.name === 'AbortError') {
//         } else {
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

//   useEffect(() => {
//     if (query === '' || !pipelineUrl) {
//       return;
//     }

//     const debouncedParseStreaming = setTimeout(() => {
//       parseStreaming(query);
//     }, 500);

//     return () => clearTimeout(debouncedParseStreaming);
//   }, [query, userId, pipelineUrl]);

//   const handleOpenPdfPreview = (id: string, page?: number) => {
//     setPdfPreviewDocumentId(id);
//     if (page && page > 0) {
//       setInitialPage(page);
//     } else {
//       setInitialPage(1);
//     }
//     setPdfPreviewOpen(true);
//   };

//   const handleClosePdfPreview = () => {
//     setPdfPreviewOpen(false);
//     setPdfPreviewDocumentId(null);
//     setInitialPage(1);
//   };

//   return (
//     <div className="flex flex-col gap-8">
//       <div className="flex flex-col space-y-8 mb-4">
//         {messages.map((message, index) => (
//           <React.Fragment key={message.id}>
//             {message.role === 'user' ? (
//               <MessageBubble message={message} />
//             ) : (
//               <Answer
//                 message={message}
//                 isStreaming={message.isStreaming || false}
//                 isSearching={isSearching}
//                 // mode={mode}
//                 // onOpenPdfPreview={handleOpenPdfPreview}
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
//       {hasAttemptedFetch &&
//         uploadedDocuments?.length === 0 &&
//         pipelineUrl &&
//         mode === 'rag' && (
//           <div className="absolute inset-4 flex items-center justify-center backdrop-blur-sm">
//             <div className="flex items-center p-4 bg-white shadow-2xl rounded text-black font-medium gap-4">
//               Please upload at least one document to submit queries.{' '}
//               <UploadButton setUploadedDocuments={setUploadedDocuments} />
//             </div>
//           </div>
//         )}
//       <PdfPreviewDialog
//         id={pdfPreviewDocumentId || ''}
//         open={pdfPreviewOpen}
//         onClose={handleClosePdfPreview}
//         initialPage={initialPage}
//       />
//     </div>
//   );
// };
