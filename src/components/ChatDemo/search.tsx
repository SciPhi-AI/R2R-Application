import * as React from 'react';

import { ArrowUp, Globe, Search as SearchIcon, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle'; // shadcn/ui toggle
import { SearchProps } from '@/types';

// Simple debouncer
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export const Search: React.FC<SearchProps> = ({
  pipeline,
  setQuery,
  placeholder,
  disabled = false,
  mode,
  // Toggles for agent tools
  webSearch,
  setWebSearch,
  magnify,
  setMagnify,
  contextTool,
  setContextTool,
}) => {
  const [value, setValue] = React.useState('');
  const router = useRouter();

  if (!placeholder) {
    placeholder = 'Ask a question...';
  }

  const navigateToSearch = React.useCallback(
    debounce((searchValue: string) => {
      if (pipeline) {
        router.push(`/chat/?q=${encodeURIComponent(searchValue)}`);
      }
    }, 50),
    [router, pipeline]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim()) {
      navigateToSearch(value.trim());
      setQuery(value.trim());
      setValue('');
    }
  };
  console.log('webSearch = ', webSearch);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* 
        First row: Toggles (left) + Up Arrow Button (right)
      */}
      <div className="flex items-center justify-between w-full gap-2 mb-2">
        {/* Left side toggles */}
        <div className="flex items-center gap-2">
          {/* 1) Web Search Toggle */}
          {mode == 'rag_agent' ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <div className="flex items-center">
                  <TooltipTrigger>
                    <Toggle
                      variant="outline"
                      pressed={webSearch}
                      onPressedChange={setWebSearch}
                      aria-label="Toggle Web Search"
                    >
                      <Globe className="h-4 w-4" />
                    </Toggle>
                  </TooltipTrigger>
                </div>
                <TooltipContent side="bottom">
                  <p>Agentic web search tool</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {/* 2) Magnify Toggle */}
          {mode == 'rag_agent' ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <div className="flex items-center">
                  <TooltipTrigger>
                    <Toggle
                      variant="outline"
                      pressed={magnify}
                      onPressedChange={setMagnify}
                      aria-label="Toggle Magnify"
                    >
                      <SearchIcon className="h-4 w-4" />
                    </Toggle>
                  </TooltipTrigger>
                </div>
                <TooltipContent side="bottom">
                  <p>Internal knowledge search tool</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {/* 3) Context Toggle */}
          {mode == 'rag_agent' ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <div className="flex items-center">
                  <TooltipTrigger>
                    <Toggle
              variant="outline"
              pressed={contextTool}
              onPressedChange={setContextTool}
              aria-label="Toggle Context Tool"
                    >
              <FolderOpen className="h-4 w-4" />
              </Toggle>
                  </TooltipTrigger>
                </div>
                <TooltipContent side="bottom">
                  <p>Internal document / collection fetcher</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}


        </div>

        {/* Right side - Up Arrow (submit) */}
        <Button
          type="submit"
          // variant="outline"
          // size="lg"
          className="rounded-md shrink-0"
          disabled={disabled}
        >
          <ArrowUp size={20} />
        </Button>
      </div>

      {/* 
        Second row: Big multiline textarea
        ~50% bigger than typical chat input by using rows={4} (or 5).
      */}
      <textarea
        id="search-bar"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setValue(e.target.value)
        }
        rows={4} // Try 5 for even bigger
        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
              navigateToSearch(value.trim());
              setQuery(value.trim());
              setValue('');
            }
          }
        }}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-zinc-700 text-zinc-200 rounded-md focus:outline-none resize-none"
        disabled={disabled}
      />
    </form>
  );
};