import { BookText } from 'lucide-react';
import { FC } from 'react';

import { Source } from './interfaces/source';
import { Skeleton } from './skeleton';
import { Wrapper } from './wrapper';

const SourceItem: FC<{ source: Source }> = ({ source }) => {
  const { id, score, metadata } = source;

  return (
    <div
      className="relative text-xs py-3 px-3 bg-zinc-400 hover:bg-zinc-300 rounded-lg flex flex-col gap-2 max-w-full"
      key={id}
    >
      <div className="font-medium text-zinc-950 text-ellipsis overflow-hidden break-words">
        {score.toFixed(3) != '0.000' &&
          `Document Title: ${metadata.title}, Similarity: ${score.toFixed(3)}, Id = 
        ${id.slice(0, 8) + '...'}`}
        {score.toFixed(3) == '0.000' &&
          `Document Title: ${metadata.title}, Id = ${id.slice(0, 8) + '...'}`}
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 overflow-hidden">
          <div className="text-ellipsis break-all text-zinc-600 overflow-hidden w-full">
            {metadata.text}
          </div>
        </div>
      </div>
    </div>
  );
};

const parseSources = (sources: string | object): Source[] => {
  if (typeof sources === 'string') {
    // Split the string into individual JSON object strings
    const individualSources = sources.split(',"{"').map((source, index) => {
      if (index === 0) return source; // First element is already properly formatted
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

export const Sources: FC<{ sources: string | null }> = ({ sources }) => {
  let parsedSources: Source[] = [];
  if (sources) {
    parsedSources = parseSources(sources);
  }

  return (
    <Wrapper
      title={
        <>
          <BookText></BookText> Sources
        </>
      }
      content={
        <div className="grid gap-2 overflow-y-auto max-h-[700px]">
          {parsedSources && parsedSources.length > 0 ? (
            parsedSources.map((item) => (
              <SourceItem key={item.id} source={item}></SourceItem>
            ))
          ) : (
            <div className="max-w-screen-sm">
              <Skeleton className="h-16 bg-zinc-200/80"></Skeleton>
              <Skeleton className="h-16 bg-zinc-200/80 mt-2"></Skeleton>
              <Skeleton className="h-16 bg-zinc-200/80 mt-2"></Skeleton>
              <Skeleton className="h-16 bg-zinc-200/80 mt-2"></Skeleton>
            </div>
          )}
        </div>
      }
    ></Wrapper>
  );
};
