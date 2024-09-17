import { FileText } from 'lucide-react';
import { FC } from 'react';
import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ChatDemo/popover';
import { Skeleton } from '@/components/ChatDemo/skeleton';
import { SearchResults } from '@/components/SearchResults';
import { Logo } from '@/components/shared/Logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/Button';
import { Message } from '@/types';
import {
  VectorSearchResult,
  KGEntity,
  KGTriple,
  KGCommunity,
  KGLocalSearchResult,
} from '@/types';

function parseKGLocalSources(payload: string): KGLocalSearchResult {
  const data = JSON.parse(payload);

  const entities: KGEntity[] = Object.entries(data.entities).map(
    ([key, value]: [string, any]) => ({
      id: key,
      name: value.name,
      description: value.description,
    })
  );

  const relationships: KGTriple[] = data.relationships;

  const communities: KGCommunity[] = Object.values(data.communities).map(
    (community: any) => {
      const parsedSummary = JSON.parse(community.summary);
      return {
        title: parsedSummary.title,
        summary: parsedSummary.summary,
        explanation: parsedSummary.explanation,
      };
    }
  );
  console.log('communities = ', communities);

  return {
    query: data.query,
    entities,
    relationships,
    communities,
  };
}
const SourceItem: FC<{
  source: VectorSearchResult;
  onOpenPdfPreview: (documentId: string, page?: number) => void;
}> = ({ source, onOpenPdfPreview }) => {
  const { document_id, score, metadata, text } = source;

  const isPdf =
    metadata.document_type === 'pdf' ||
    metadata.unstructured_filetype === 'application/pdf';
  const pageNumber = metadata.unstructured_page_number;

  const handleOpenPdfPreview = () => {
    if (source.document_id) {
      onOpenPdfPreview(source.document_id, pageNumber);
    }
  };

  return (
    <div
      className="bg-zinc-700 p-4 rounded-lg mb-2 flex items-center"
      style={{ width: '100%' }}
    >
      <div className="flex-grow mr-4">
        <h3 className="text-sm font-medium text-zinc-200 mb-1">
          {metadata.title} (Similarity: {score.toFixed(3)})
        </h3>
        <p className="text-xs text-zinc-400">{text}</p>
      </div>
      {isPdf && (
        <div className="flex-shrink-0">
          <Button
            onClick={handleOpenPdfPreview}
            color="filled"
            className="text-white font-bold flex items-center"
            title={`Open PDF${pageNumber ? ` (Page ${pageNumber})` : ''}`}
          >
            <FileText size={16} className="mr-2" />
            PDF
          </Button>
        </div>
      )}
    </div>
  );
};

function formatMarkdownNewLines(markdown: string) {
  return markdown
    .replace(/\[(\d+)]/g, '[$1]($1)')
    .split(`"queries":`)[0]
    .replace(/\\u[\dA-F]{4}/gi, (match: string) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
}

const parseSources = (sources: string | object): VectorSearchResult[] => {
  if (typeof sources === 'string') {
    // Split the string into individual JSON object strings
    const individualSources = sources.split(',"{"').map((source, index) => {
      if (index === 0) {
        return source;
      } // First element is already properly formatted
      return `{"${source}`; // Wrap the subsequent elements with leading `{"`
    });

    // Wrap the individual sources in a JSON array format
    const jsonArrayString = `[${individualSources.join(',')}]`;

    try {
      const partialParsedVectorSearch = JSON.parse(jsonArrayString);
      return partialParsedVectorSearch.map((source: any) => {
        const parsedSource = JSON.parse(source);
        return {
          ...parsedSource,
          text: parsedSource.text || '',
        };
      });
    } catch (error) {
      console.error('Failed to parse sources:', error);
      throw new Error('Invalid sources format');
    }
  }

  return sources as VectorSearchResult[];
};

export const Answer: FC<{
  message: Message;
  isStreaming: boolean;
  isSearching: boolean;
  mode: 'rag' | 'rag_agent';
  onOpenPdfPreview: (documentId: string, page?: number) => void;
}> = ({ message, isStreaming, isSearching, mode, onOpenPdfPreview }) => {
  const [isOpen, setIsOpen] = useState(false);

  const [parsedVectorSearch, setParsedVectorSearch] = useState<
    VectorSearchResult[]
  >([]);
  const [parsedKgLocal, setParsedKgLocal] =
    useState<KGLocalSearchResult | null>(null);

  useEffect(() => {
    if (message.sources) {
      try {
        const parsedVectorSearchData = parseSources(message.sources);
        setParsedVectorSearch(parsedVectorSearchData);
      } catch (error) {
        console.error('Failed to parse sources:', error);
        setParsedVectorSearch([]);
      }
    } else {
      setParsedVectorSearch([]);
    }
  }, [message.sources]);

  useEffect(() => {
    if (message.kgLocal) {
      const parsedKGLocalData = parseKGLocalSources(message.kgLocal);
      console.log('parsedKGLocalData = ', parsedKGLocalData);
      setParsedKgLocal(parsedKGLocalData);
    }
  }, [message.kgLocal]);

  const showSourcesAccordion =
    mode === 'rag' || (mode === 'rag_agent' && parsedVectorSearch.length > 0);
  const showNoSourcesFound =
    mode === 'rag_agent' &&
    message.searchPerformed &&
    parsedVectorSearch.length === 0;

  return (
    <div className="mt-4">
      {showSourcesAccordion && (
        <Accordion
          type="single"
          collapsible
          className="w-full"
          onValueChange={(value) => setIsOpen(value === 'answer')}
        >
          <AccordionItem value="answer">
            <AccordionTrigger className="py-2 text-lg font-bold text-zinc-200 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <Logo
                  width={25}
                  height={25}
                  disableLink={true}
                  className="w-12 h-12"
                />
                <span className="text-sm font-normal">
                  {isSearching ? (
                    <span className="searching-animation">
                      Searching over sources...
                    </span>
                  ) : (
                    `Sources`
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <SearchResults
                    vectorSearchResults={parsedVectorSearch}
                    kgLocalSearchResult={parsedKgLocal}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {showNoSourcesFound && (
        <div className="flex items-center justify-between py-2 text-sm text-zinc-400">
          <Logo width={25} disableLink={true} />
          <span>No sources found</span>
        </div>
      )}

      <div className="space-y-4 mt-4">
        {message.content ? (
          <div className="prose prose-sm max-w-full text-zinc-300 overflow-y-auto max-h-[700px] prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white">
            <Markdown
              components={{
                h1: (props) => <h1 className="prose-heading" {...props} />,
                h2: (props) => <h2 className="prose-heading" {...props} />,
                h3: (props) => <h3 style={{ color: 'white' }} {...props} />,
                h4: (props) => <h4 style={{ color: 'white' }} {...props} />,
                h5: (props) => <h5 style={{ color: 'white' }} {...props} />,
                h6: (props) => <h6 style={{ color: 'white' }} {...props} />,
                strong: (props) => (
                  <strong
                    style={{ color: 'white', fontWeight: 'bold' }}
                    {...props}
                  />
                ),
                p: (props) => <p style={{ color: 'white' }} {...props} />,
                li: (props) => <li style={{ color: 'white' }} {...props} />,
                blockquote: (props) => (
                  <blockquote style={{ color: 'white' }} {...props} />
                ),
                em: (props) => <em style={{ color: 'white' }} {...props} />,
                code: (props) => <code style={{ color: 'white' }} {...props} />,
                pre: (props) => <pre style={{ color: 'white' }} {...props} />,
                a: ({ href, ...props }) => {
                  if (!href) return null;
                  const source = parsedVectorSearch[+href - 1];
                  if (!source) return null;
                  const metadata = source.metadata;
                  return (
                    <span className="inline-block w-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <span
                            title={metadata?.title}
                            className="inline-block cursor-pointer transform scale-[60%] no-underline font-medium bg-zinc-700 hover:bg-zinc-500 w-6 text-center h-6 rounded-full origin-top-left"
                          >
                            {href}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="max-w-screen-md flex flex-col gap-2 bg-zinc-800 shadow-transparent ring-zinc-600 border-zinc-600 ring-4 text-xs"
                        >
                          <div className="text-zinc-200 text-ellipsis overflow-hidden whitespace-nowrap font-medium">
                            {metadata.title ? `Title: ${metadata.title}` : ''}
                            {metadata?.documentid
                              ? `, DocumentId: ${metadata.documentid.slice(0, 8)}`
                              : ''}
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <div className="line-clamp-4 text-zinc-300 break-words">
                                {metadata?.snippet ?? ''}
                              </div>
                              <div className="line-clamp-4 text-zinc-300 break-words">
                                {source.text}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </span>
                  );
                },
              }}
            >
              {formatMarkdownNewLines(message.content)}
            </Markdown>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Skeleton className="max-w-lg h-4 bg-zinc-200" />
            <Skeleton className="max-w-2xl h-4 bg-zinc-200" />
            <Skeleton className="max-w-lg h-4 bg-zinc-200" />
            <Skeleton className="max-w-xl h-4 bg-zinc-200" />
          </div>
        )}
      </div>
    </div>
  );
};
