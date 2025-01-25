import { FC, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { ClipLoader } from 'react-spinners';

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
import { Message } from '@/types';
import { VectorSearchResult, KGSearchResult } from '@/types';

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
      return JSON.parse(sources);
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
    <span className="text-sm font-normal text-white" key={String(isSearching)}>
      {isSearching ? (
        <span className="searching-animation">Searching over sources...</span>
      ) : sourcesCount !== null && sourcesCount > 0 ? (
        `View ${sourcesCount} Sources`
      ) : null}
    </span>
  </div>
);

/** Animated ellipsis for streaming messages **/
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

interface AnswerProps {
  message: Message;
  isStreaming: boolean;
  isSearching: boolean;
  /** Added a new prop to indicate whether we’re in 'rag' or 'rag_agent' mode **/
  mode: 'rag' | 'rag_agent';
}

export const Answer: FC<AnswerProps> = ({
  message,
  isStreaming,
  isSearching,
  mode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedVectorSources, setParsedVectorSources] = useState<Source[]>([]);
  const [parsedEntities, setParsedEntities] = useState<KGSearchResult[]>([]);
  const [parsedCommunities, setParsedCommunities] = useState<KGSearchResult[]>(
    []
  );
  const [sourcesCount, setSourcesCount] = useState<number | null>(null);

  // For the flashing/rewriting effect of "thinking..."
  const [thinkingText, setThinkingText] = useState('Thinking');

  useEffect(() => {
    let i = 0;
    const variants = ['Thinking ', 'Thinking.', 'Thinking..', 'Thinking...'];
    const interval = setInterval(() => {
      i = (i + 1) % variants.length;
      setThinkingText(variants[i]);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (message.sources) {
      let count = 0;
      if (message.sources.vector) {
        const parsed = parseVectorSearchSources(message.sources.vector);
        setParsedVectorSources(parsed);
        count += parsed.length;
      }

      if (message.sources.kg) {
        let kgLocalResult: KGSearchResult[] = [];
        try {
          kgLocalResult = JSON.parse(message.sources.kg);
        } catch (error) {
          console.error('Failed to parse kg sources:', error);
        }
        const entitiesArray = kgLocalResult.filter(
          (item: any) => item.result_type === 'entity'
        );
        const communitiesArray = kgLocalResult.filter(
          (item: any) => item.result_type === 'community'
        );
        setParsedEntities(entitiesArray);
        setParsedCommunities(communitiesArray);
        count += entitiesArray.length + communitiesArray.length;
      }

      setSourcesCount(count > 0 ? count : null);
    } else {
      setSourcesCount(null);
    }
  }, [message.sources]);

  /**
   * If we are in Agent mode and the assistant is still streaming the response,
   * show the “thinking” UI right away in the top-right corner.
   **/
  if (
    mode === 'rag_agent' &&
    isStreaming &&
    message.role === 'assistant' &&
    !message.content
  ) {
    return (
      <div className="relative mt-4">
        {/* The normal “header” row with a Logo (optional) */}
        <div className="flex items-center justify-between w-full">
          <Logo width={50} height={50} disableLink={true} />
        </div>

        {/* Absolutely-positioned "thinking" text & smaller loader in top-right */}
        <div className="absolute top-0 right-0 flex items-center gap-2 mr-2">
          <ClipLoader color="#888" size={24} />
          <span
            className="text-gray-500 font-medium"
            style={{
              width: '10ch', // Reserve enough width for the longest "Thinking..." variant
            }}
          >
            {thinkingText}
          </span>
        </div>
      </div>
    );
  }

  /** Otherwise, we show the normal final content once done streaming (or if not agent mode) **/

  /** Renders the actual message in Markdown once content is available **/
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
          /** Link handling for the [1], [2] references in markdown **/
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
              : (source as Source).metadata.text;

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
                    {!isKGElement && metadata?.documentid && (
                      <div className="text-zinc-200 font-medium border-b border-zinc-600 pb-1">
                        DocumentId: {metadata.documentid}
                      </div>
                    )}
                    <div className="text-zinc-200 text-ellipsis overflow-hidden whitespace-nowrap font-medium">
                      {title ? `Title: ${title}` : ''}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 max-h-[200px] overflow-y-auto pr-2">
                        {isKGElement && (metadata as any).summary && (
                          <div className="text-zinc-300 break-words mb-2">
                            <strong>Summary:</strong>{' '}
                            {(metadata as any).summary}
                          </div>
                        )}
                        {!isKGElement && (
                          <div className="text-zinc-300 break-words mb-2">
                            {metadata?.snippet ?? ''}
                          </div>
                        )}
                        <div className="text-zinc-300 break-words">
                          {description ?? ''}
                        </div>
                        {isKGElement && (metadata as any).impact_rating && (
                          <div className="text-zinc-300 break-words mt-2">
                            <strong>Impact Rating:</strong>{' '}
                            {(metadata as any).impact_rating}
                          </div>
                        )}
                        {isKGElement &&
                          (metadata as any).rating_explanation && (
                            <div className="text-zinc-300 break-words mt-2">
                              <strong>Rating Explanation:</strong>{' '}
                              {(metadata as any).rating_explanation}
                            </div>
                          )}
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
      {/* Show a concise alert if we are in rag_agent mode and this is an assistant message */}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        onValueChange={(value) => setIsOpen(value === 'answer')}
      >
        <AccordionItem value="answer">
          {!isSearching && sourcesCount !== null && sourcesCount > 0 ? (
            <AccordionTrigger className="py-2 text-lg font-bold text-zinc-200 hover:no-underline text-white">
              <SourceInfo
                isSearching={isSearching}
                sourcesCount={sourcesCount}
              />
            </AccordionTrigger>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Logo width={50} height={50} disableLink={true} />
            </div>
          )}
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
