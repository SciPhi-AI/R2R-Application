import { FC, useEffect, useState } from 'react';
import { Answer } from './answer';
import { Sources } from './sources';
import { UploadButton } from './upload';
import {
  LLM_START_TOKEN,
  LLM_END_TOKEN,
  SEARCH_START_TOKEN,
  SEARCH_END_TOKEN,
} from '../../r2r-ts-client';

const markdownParse = (text: string) => {
  return text
    .replace(/\[\[([cC])itation/g, '[citation')
    .replace(/[cC]itation:(\d+)]]/g, 'citation:$1]')
    .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
    .replace(/\[[cC]itation:(\d+)]/g, '[citation]($1)')
    .replace('\n', '\\n');
};

export const Result: FC<{
  query: string;
  userId: string;
  apiUrl: string | undefined;
  temperature: number | null;
  topP: number | null;
  topK: number | null;
  maxTokensToSample: number | null;
  model: string;
  uploadedDocuments: string[];
  setUploadedDocuments: any;
  switches: any;
}> = ({
  query,
  userId,
  apiUrl,
  temperature,
  topP,
  topK,
  maxTokensToSample,
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
      const response = await fetch(
        `/api/rag-completion?query=${encodeURIComponent(query)}&userId=${encodeURIComponent(userId)}&apiUrl=${encodeURIComponent(apiUrl)}&model=${encodeURIComponent(model)}&temperature=${temperature}&topP=${topP}&topK=${topK}&maxTokensToSample=${maxTokensToSample}&hybridSearch=${switches.hybrid_search?.checked}&vectorSearch=${switches.vector_search?.checked}&useKnowledgeGraph=${switches.knowledge_graph_search?.checked}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        if (buffer.includes(SEARCH_END_TOKEN)) {
          let [results, rest] = buffer.split(SEARCH_END_TOKEN);
          results = results.replace(SEARCH_START_TOKEN, '');
          setSources(results);
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

  return (
    <div className="flex flex-col gap-8">
      <Answer
        markdown={markdownParse(markdown)}
        sources={sources}
        isStreaming={isStreaming}
      ></Answer>
      <Sources sources={sources}></Sources>

      {error && <div className="text-red-500">Error: {error}</div>}

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

      {uploadedDocuments?.length !== 0 && query === '' && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="p-4 bg-white shadow-2xl rounded text-blue-500 font-medium flex gap-4">
            Please submit a query.
          </div>
        </div>
      )}
    </div>
  );
};
