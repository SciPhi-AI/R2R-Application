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
  KGSearchResult,
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

interface Source extends VectorSearchResult {
  id: string;
  score: number;
  metadata: {
    title?: string;
    text?: string;
    documentid?: string;
    snippet?: string;
  };
}

const parseVectorSearchSources = (sources: string | object): Source[] => {
  if (typeof sources === 'string') {
    try {
      const cleanedSources = sources;
      return JSON.parse(cleanedSources);
    } catch (error) {
      console.error('Failed to parse sources:', error);
      return [];
    }
  }
  return sources as Source[];
};

const SourceInfo: React.FC<{
  isSearching: boolean;
  sourcesCount: number | null;
}> = ({ isSearching, sourcesCount }) => (
  <div className="flex items-center justify-between w-full">
    <Logo width={50} height={50} disableLink={true} />
    <span className="text-sm font-normal text-white">
      {isSearching ? (
        <span className="searching-animation">Searching over sources...</span>
      ) : sourcesCount !== null && sourcesCount > 0 ? (
        `View ${sourcesCount} Sources`
      ) : null}
    </span>
  </div>
);

export const Answer: FC<{
  message: Message;
  isStreaming: boolean;
  isSearching: boolean;
}> = ({ message, isStreaming, isSearching }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedVectorSources, setParsedVectorSources] = useState<Source[]>([]);
  const [parsedEntities, setParsedEntities] = useState<KGSearchResult[]>([]);
  const [parsedCommunities, setParsedCommunities] = useState<KGSearchResult[]>(
    []
  );
  const [sourcesCount, setSourcesCount] = useState<number | null>(null);

  useEffect(() => {
    if (message.sources) {
      let count = 0;
      if (message.sources.vector) {
        const parsed = parseVectorSearchSources(message.sources.vector);
        setParsedVectorSources(parsed);
        count += parsed.length;
      }

      if (message.sources.kg) {
        const kgLocalResult: KGSearchResult[] = JSON.parse(message.sources.kg);
        const entitiesArray = kgLocalResult.filter(
          (item: any) => item.result_type === 'entity'
        );
        const communitiesArray = kgLocalResult.filter(
          (item: any) => item.result_type === 'community'
        );
        console.log('communitiesArray = ', communitiesArray);
        setParsedEntities(entitiesArray);
        setParsedCommunities(communitiesArray);
        count += entitiesArray.length + communitiesArray.length;
      }

      setSourcesCount(count > 0 ? count : null);
    } else {
      setSourcesCount(null);
    }
  }, [message.sources]);

  const AnimatedEllipsis: FC = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prevDots) => (prevDots.length >= 3 ? '' : prevDots + '.'));
      }, 200);

      return () => clearInterval(interval);
    }, []);

    return (
      <span
        style={{
          color: 'white',
          display: 'inline-block',
          width: '1em',
          height: '1em',
          textAlign: 'left',
        }}
      >
        {dots}
      </span>
    );
  };

  const renderContent = () => {
    const paragraphs = message.content.split('\n\n');
    return paragraphs.map((paragraph, index) => (
      <Markdown
        key={index}
        components={{
          h1: (props) => <h1 className="white" {...props} />,
          h2: (props) => <h2 className="white" {...props} />,
          h3: (props) => <h3 style={{ color: 'white' }} {...props} />,
          h4: (props) => <h4 style={{ color: 'white' }} {...props} />,
          h5: (props) => <h5 style={{ color: 'white' }} {...props} />,
          h6: (props) => <h6 style={{ color: 'white' }} {...props} />,
          strong: (props) => (
            <strong style={{ color: 'white', fontWeight: 'bold' }} {...props} />
          ),
          p: ({ children }) => (
            <p style={{ color: 'white', display: 'inline' }}>
              {children}
              {isStreaming && index === paragraphs.length - 1 && (
                <AnimatedEllipsis />
              )}
            </p>
          ),
          li: (props) => <li style={{ color: 'white' }} {...props} />,
          blockquote: (props) => (
            <blockquote style={{ color: 'white' }} {...props} />
          ),
          em: (props) => <em style={{ color: 'white' }} {...props} />,
          code: (props) => <code style={{ color: 'white' }} {...props} />,
          pre: (props) => <pre style={{ color: 'white' }} {...props} />,

          a: ({ href, ...props }) => {
            if (!href) return null;
            let source: Source | KGSearchResult | null = null;
            let isKGElement = false;

            if (+href - 1 < parsedVectorSources.length) {
              source = parsedVectorSources[+href - 1];
            } else if (
              +href - 1 >= parsedVectorSources.length &&
              +href - 1 < parsedVectorSources.length + parsedEntities.length
            ) {
              source = parsedEntities[+href - parsedVectorSources.length - 1];
              isKGElement = true;
            } else if (
              +href - 1 >=
              parsedVectorSources.length + parsedEntities.length
            ) {
              source =
                parsedCommunities[
                  +href - parsedVectorSources.length - parsedEntities.length - 1
                ];
              isKGElement = true;
            }
            if (!source) return null;

            const metadata = isKGElement
              ? (source as KGSearchResult).content
              : (source as Source).metadata;
            const title = isKGElement ? metadata.name : metadata.title;
            const description = isKGElement
              ? metadata.description
              : (source as Source).text;
            return (
              <span className="inline-block w-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <span
                      title={title}
                      className="inline-block cursor-pointer transform scale-[60%] no-underline font-medium w-6 text-center h-6 rounded-full origin-top-left"
                      style={{ background: 'var(--popover)' }}
                    >
                      {href}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="max-w-screen-md flex flex-col gap-2 bg-zinc-800 shadow-transparent ring-zinc-600 border-zinc-600 ring-4 text-xs"
                  >
                    <div className="text-zinc-200 text-ellipsis overflow-hidden whitespace-nowrap font-medium">
                      {title ? `Title: ${title}` : ''}
                      {!isKGElement && metadata?.documentid
                        ? `, DocumentId: ${metadata.documentid.slice(0, 8)}`
                        : ''}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        {!isKGElement && (
                          <div className="line-clamp-4 text-zinc-300 break-words">
                            {metadata?.snippet ?? ''}
                          </div>
                        )}
                        <div className="line-clamp-4 text-zinc-300 break-words">
                          {description ?? ''}
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
        {formatMarkdownNewLines(paragraph)}
      </Markdown>
    ));
  };
  return (
    <div className="mt-4">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        onValueChange={(value) => setIsOpen(value === 'answer')}
      >
        <AccordionItem value="answer">
          <AccordionTrigger className="py-2 text-lg font-bold text-zinc-200 hover:no-underline text-white">
            <SourceInfo isSearching={isSearching} sourcesCount={sourcesCount} />
          </AccordionTrigger>
          <AccordionContent>
            {!isSearching && sourcesCount !== null && sourcesCount > 0 && (
              <SearchResults
                vectorSearchResults={parsedVectorSources}
                entities={parsedEntities}
                communities={parsedCommunities}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="space-y-4 mt-4">
        {message.content || isStreaming ? (
          <div className="prose prose-sm max-w-full text-zinc-300 overflow-y-auto max-h-[700px] prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white p-4 rounded-lg">
            {message.content ? (
              renderContent()
            ) : (
              <div
                style={{
                  color: 'white',
                  display: 'inline-block',
                  width: '1em',
                  height: '1em',
                }}
              >
                <AnimatedEllipsis />
              </div>
            )}
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
