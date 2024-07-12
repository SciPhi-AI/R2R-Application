import { BookText } from 'lucide-react';
import { FC } from 'react';

import { Source } from './interfaces/source';

const SourceItem: FC<{ source: Source }> = ({ source }) => {
  const { id, score, metadata } = source;

  return (
    <div
      className="bg-zinc-700 p-4 rounded-lg mb-2"
      style={{ width: 'calc(100% - 50px)' }}
    >
      <h3 className="text-sm font-medium text-zinc-200 mb-1">
        {metadata.title} (Similarity: {score.toFixed(3)})
      </h3>
      <p className="text-xs text-zinc-400">{metadata.text}</p>
    </div>
  );
};

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

export const Sources: FC<{ sources: string | null }> = ({ sources }) => {
  const parsedSources: Source[] = sources ? parseSources(sources) : [];

  return (
    <div className="mt-4">
      <h2 className="text-lg font-bold text-zinc-200 mb-2 flex items-center">
        <BookText className="mr-2" /> Sources
      </h2>
      <div className="space-y-2">
        {parsedSources.map((item) => (
          <SourceItem key={item.id} source={item} />
        ))}
      </div>
    </div>
  );
};
