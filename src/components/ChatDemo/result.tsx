import { r2rClient } from 'r2r-js';
import { FC, useEffect, useState, useMemo } from 'react';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import { Sources } from './sources';
import { UploadButton } from './upload';
import { parseMarkdown } from './utils/parseMarkdown';

const SEARCH_START_TOKEN = '<search>';
const SEARCH_END_TOKEN = '</search>';

const LLM_START_TOKEN = '<completion>';
const LLM_END_TOKEN = '</completion>';

const METADATA_START_TOKEN = '<metadata>';
const METADATA_END_TOKEN = '</metadata>';

export const Result: FC<{
  query: string;
  setQuery: (query: string) => void;
  userId: string;
  apiUrl: string | undefined;
  search_limit: number | undefined;
  rag_temperature: number | null;
  rag_topP: number | null;
  rag_topK: number | null;
  rag_maxTokensToSample: number | null;
  kg_temperature: number | null;
  kg_topP: number | null;
  kg_topK: number | null;
  kg_maxTokensToSample: number | null;
  model: string;
  uploadedDocuments: string[];
  setUploadedDocuments: any;
  switches: any;
}> = ({
  query,
  setQuery,
  userId,
  apiUrl,
  search_limit,
  rag_temperature,
  rag_topP,
  rag_topK,
  rag_maxTokensToSample,
  kg_temperature,
  kg_topP,
  kg_topK,
  kg_maxTokensToSample,
  model,
  uploadedDocuments,
  setUploadedDocuments,
  switches,
}) => {
  const [sources, setSources] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  let timeout: NodeJS.Timeout;

  const parseStreaming = async (
    query: string,
    userId: string,
    apiUrl: string
  ) => {
    setSources(null);
    setMarkdown('');
    setIsStreaming(true);
    setError(null);
    let buffer = '';
    let inLLMResponse = false;

    try {
      const client = new r2rClient(apiUrl);

      const kgGenerationConfig = {
        temperature: kg_temperature ?? 0.1,
        top_p: kg_topP ?? 1.0,
        top_k: kg_topK ?? 100,
        max_tokens_to_sample: kg_maxTokensToSample ?? 1024,
        stream: true,
      };

      const ragGenerationConfig = {
        temperature: rag_temperature ?? 0.1,
        top_p: rag_topP ?? 1.0,
        top_k: rag_topK ?? 100,
        max_tokens_to_sample: rag_maxTokensToSample ?? 1024,
        stream: true,
      };

      const response = await client.rag({
        query: query,
        use_vector_search: switches.vector_search?.checked ?? true,
        search_filters: {},
        search_limit: search_limit,
        do_hybrid_search: switches.hybrid_search?.checked ?? false,
        use_kg_search: switches.knowledge_graph_search?.checked ?? false,
        kg_generation_config: kgGenerationConfig,
        rag_generation_config: ragGenerationConfig,
      });

      if (!response || !response.getReader) {
        throw new Error('Invalid response from r2rClient');
      }

      const reader = response.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        if (buffer.includes(SEARCH_END_TOKEN)) {
          const [results, rest] = buffer.split(SEARCH_END_TOKEN);
          const cleanedResults = results.replace(SEARCH_START_TOKEN, '');
          setSources(cleanedResults);
          buffer = rest || '';
        }

        if (buffer.includes(LLM_START_TOKEN)) {
          inLLMResponse = true;
          buffer = buffer.split(LLM_START_TOKEN)[1] || '';
        }

        if (inLLMResponse) {
          const endTokenIndex = buffer.indexOf(LLM_END_TOKEN);
          if (endTokenIndex !== -1) {
            const chunk = buffer.slice(0, endTokenIndex);
            setMarkdown((prev) => prev + chunk);
            buffer = buffer.slice(endTokenIndex + LLM_END_TOKEN.length);
            inLLMResponse = false;
          } else {
            // Only append complete words
            const lastSpaceIndex = buffer.lastIndexOf(' ');
            if (lastSpaceIndex !== -1) {
              const chunk = buffer.slice(0, lastSpaceIndex);
              setMarkdown((prev) => prev + chunk + ' ');
              buffer = buffer.slice(lastSpaceIndex + 1);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error in streaming:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStreaming(false);
      if (buffer.length > 0) {
        setMarkdown((prev) => prev + buffer);
      }
    }
  };

  useEffect(() => {
    if (query === '' || !apiUrl) {
      return;
    }

    const debouncedParseStreaming = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        parseStreaming(query, userId, apiUrl);
      }, 500);
    };

    debouncedParseStreaming();

    return () => {
      clearTimeout(timeout);
    };
  }, [query, userId, apiUrl]);

  const parsedMarkdown = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <div className="flex flex-col gap-8">
      {query ? (
        <>
          <Answer
            markdown={parsedMarkdown}
            sources={sources}
            isStreaming={isStreaming}
          />
          <Sources sources={sources} />
          {error && <div className="text-red-500">Error: {error}</div>}
        </>
      ) : (
        <DefaultQueries setQuery={setQuery} />
      )}

      {uploadedDocuments?.length === 0 && apiUrl && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="flex items-center p-4 bg-white shadow-2xl rounded text-blue-500 font-medium gap-4">
            Please upload at least one document to submit queries.{' '}
            <UploadButton
              userId={userId}
              apiUrl={apiUrl}
              uploadedDocuments={uploadedDocuments}
              setUploadedDocuments={setUploadedDocuments}
            />
          </div>
        </div>
      )}
    </div>
  );
};
