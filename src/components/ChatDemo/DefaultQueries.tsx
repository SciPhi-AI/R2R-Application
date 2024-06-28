import { LightBulbIcon } from '@heroicons/react/24/outline';
import { FC } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DefaultQueriesProps {
  setQuery: (query: string) => void;
}

export const DefaultQueries: FC<DefaultQueriesProps> = ({ setQuery }) => {
  const defaultQueries = [
    'What is the main topic of the uploaded documents?',
    'Can you summarize the key points from the documents?',
    'Are there any common themes across the documents?',
    'What are the most frequently mentioned entities in the documents?',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <Logo width={150} height={150} disableLink={true} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        {defaultQueries.map((query, index) => (
          <Alert
            key={index}
            className="cursor-pointer hover:bg-zinc-700"
            onClick={() => setQuery(query)}
          >
            <LightBulbIcon className="h-4 w-4" />
            <AlertTitle>Sample Query {index + 1}</AlertTitle>
            <AlertDescription>{query}</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};
