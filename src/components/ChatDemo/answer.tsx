import { BookOpenText } from 'lucide-react';
import React from 'react';
import { FC } from 'react';
import Markdown from 'react-markdown';

import { Source } from './interfaces/source';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Skeleton } from './skeleton';
import { Wrapper } from './wrapper';

function formatMarkdownNewLines(markdown: string) {
  return markdown
    .split('\\n')
    .join('  \n')
    .replace(/\[(\d+)]/g, '[$1]($1)')
    .split(`"queries":`)[0]
    .replace(/\\u[\dA-F]{4}/gi, (match: any) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
}

const parseSources = (sources: string | object): Source[] => {
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
      const partialParsedSources = JSON.parse(jsonArrayString);
      return partialParsedSources.map((source: any) => {
        return JSON.parse(source);
      });
    } catch (error) {
      console.error('Failed to parse sources:', error);
      throw new Error('Invalid sources format');
    }
  }

  return sources as Source[];
};

export const Answer: FC<{
  markdown: string;
  sources: string | null;
  isStreaming: boolean;
}> = ({ markdown, sources }) => {
  let parsedSources: Source[] = [];
  if (sources) {
    parsedSources = parseSources(sources);
  }

  return (
    <Wrapper
      title={
        <>
          <BookOpenText></BookOpenText> Answer
        </>
      }
      content={
        markdown ? (
          <div className="prose prose-sm max-w-full text-zinc-300 overflow-y-auto max-h-[700px]">
            <Markdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 style={{ color: 'white' }} {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 style={{ color: 'white' }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 style={{ color: 'white' }} {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 style={{ color: 'white' }} {...props} />
                ),
                h5: ({ node, ...props }) => (
                  <h5 style={{ color: 'white' }} {...props} />
                ),
                h6: ({ node, ...props }) => (
                  <h6 style={{ color: 'white' }} {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong
                    style={{ color: 'white', fontWeight: 'bold' }}
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p style={{ color: 'white' }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ color: 'white' }} {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote style={{ color: 'white' }} {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em style={{ color: 'white' }} {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code style={{ color: 'white' }} {...props} />
                ),
                pre: ({ node, ...props }) => (
                  <pre style={{ color: 'white' }} {...props} />
                ),
                a: ({ node: _, ...props }) => {
                  if (!props.href) return <></>;
                  const source = parsedSources[+props.href - 1];
                  if (!source) return <></>;
                  const metadata = source.metadata;
                  return (
                    <span className="inline-block w-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <span
                            title={metadata?.title}
                            className="inline-block cursor-pointer transform scale-[60%] no-underline font-medium bg-zinc-700 hover:bg-zinc-500 w-6 text-center h-6 rounded-full origin-top-left"
                          >
                            {props.href}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent
                          align={'start'}
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
                                {metadata?.snippet ? metadata?.snippet : ''}
                              </div>
                              <div className="line-clamp-4 text-zinc-300 break-words">
                                {metadata?.text ? metadata?.text : ''}
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
              {formatMarkdownNewLines(markdown)}
            </Markdown>
          </div>
        ) : (
          <div className="flex flex-col gap-2 -mt-8">
            <Skeleton className="max-w-lg h-4 bg-zinc-20"></Skeleton>
            <Skeleton className="max-w-2xl h-4 bg-zinc-200"></Skeleton>
            <Skeleton className="max-w-lg h-4 bg-zinc-200"></Skeleton>
            <Skeleton className="max-w-xl h-4 bg-zinc-200"></Skeleton>
          </div>
        )
      }
    ></Wrapper>
  );
};
