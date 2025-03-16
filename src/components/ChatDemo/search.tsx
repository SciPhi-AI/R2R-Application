import {
  ArrowUp,
  FolderOpen,
  Globe,
  Paperclip,
  Search as SearchIcon,
  Brain,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { UploadDialog } from '@/components/ChatDemo/UploadDialog';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserContext } from '@/context/UserContext';
import { SearchProps } from '@/types';

/* ------------------------------------------------------------------
 * Simple debounce utility
 * ------------------------------------------------------------------ */
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/* ------------------------------------------------------------------
 * Main Search Component with Paperclip integration
 * ------------------------------------------------------------------ */
export const Search: React.FC<SearchProps> = ({
  pipeline,
  setQuery,
  placeholder,
  disabled = false,
  mode,
  setMode,
  research,
  setResearch,
  thinking,
  setThinking,
}) => {
  const router = useRouter();
  const { getClient } = useUserContext();
  const [value, setValue] = React.useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [uploadedDocuments, setUploadedDocuments] = React.useState<any[]>([]);

  if (!placeholder) {
    placeholder = 'Ask a question...';
  }

  // Handle research toggle
  const handleResearchToggle = (enabled: boolean) => {
    setResearch(enabled);
  };

  // Handle thinking toggle
  const handleThinkingToggle = (enabled: boolean) => {
    setThinking(enabled);
  };

  // Handle mode toggle between RAG and RAG Agent
  const handleModeToggle = (enabled: boolean) => {
    setMode(enabled ? 'rag_agent' : 'rag');
  };

  // Debounced nav to search
  const navigateToSearch = React.useCallback(
    debounce((searchValue: string) => {
      if (pipeline) {
        router.push(`/chat/?q=${encodeURIComponent(searchValue)}`);
      }
    }, 50),
    [router, pipeline]
  );

  // Submit handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim()) {
      navigateToSearch(value.trim());
      setQuery(value.trim());
      setValue('');
    }
  };

  // Document upload handler
  const handleDocumentUpload = async (files: File[], hiRes: boolean = true) => {
    const client = await getClient();
    if (!client) {
      console.error('Failed to get authenticated client');
      return []; // Return an empty array if client is not available.
    }
    try {
      const uploaded: any[] = [];
      await Promise.all(
        files.map(async (file) => {
          const result = await client.documents.create({
            file,
            ingestionMode: hiRes ? 'hi-res' : 'fast',
          });
          uploaded.push({
            documentId: result.results.documentId,
            title: file.name,
          });
        })
      );

      setUploadedDocuments((prev) => [...prev, ...uploaded]);
      console.log('Upload succeeded. Documents:', uploaded);
      return uploaded; // Make sure you return the uploaded array!
    } catch (err: any) {
      console.error('Upload failed:', err?.message || err);
      return []; // Return an empty array on error.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* First row: Toggles (left) + Paperclip + Up Arrow Button (right) */}
      <div className="flex items-center justify-between w-full gap-2 mb-2">
        {/* Left side toggles */}
        <div className="flex items-center gap-2">
          {/* Agent/RAG Mode Toggle */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <div className="flex items-center">
                <TooltipTrigger>
                  <Toggle
                    variant="outline"
                    pressed={mode === 'rag_agent'}
                    onPressedChange={handleModeToggle}
                    aria-label="Toggle Agent Mode"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" /> Agent Mode
                  </Toggle>
                </TooltipTrigger>
              </div>
              <TooltipContent side="bottom">
                <p>Toggle between RAG and RAG Agent mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Research Toggle */}
          {mode == "rag_agent" && <TooltipProvider delayDuration={300}>
            <Tooltip>
              <div className="flex items-center">
                <TooltipTrigger>
                  <Toggle
                    variant="outline"
                    pressed={research}
                    onPressedChange={handleResearchToggle}
                    aria-label="Toggle Deep Research"
                  >
                    <Sparkles className="h-4 w-4 mr-1" /> Deep Research
                  </Toggle>
                </TooltipTrigger>
              </div>
              <TooltipContent side="bottom">
                <p>Enable Deep Research Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          }

          {/* Thinking Toggle */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <div className="flex items-center">
                <TooltipTrigger>
                  <Toggle
                    variant="outline"
                    pressed={thinking || research}
                    onPressedChange={handleThinkingToggle}
                    aria-label="Toggle Thinking"
                  >
                    <Brain className="h-4 w-4 mr-1" /> Thinking
                  </Toggle>
                </TooltipTrigger>
              </div>
              <TooltipContent side="bottom">
                <p>Show AI thinking process</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right side buttons: Paperclip (upload) + Up Arrow (submit) */}
        <div className="flex items-center gap-2">
          {/* Paperclip Button -> opens UploadDialog */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <div className="flex items-center">
                <TooltipTrigger asChild>
                  <Button
                    className="rounded-md shrink-0 p-2"
                    type="button"
                    onClick={() => setIsUploadDialogOpen(true)}
                    // disabled={disabled}
                  >
                    <Paperclip size={16} />
                  </Button>
                </TooltipTrigger>
              </div>
              <TooltipContent side="bottom">
                <p>Upload new documents</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Up Arrow (submit) */}
          <Button
            type="submit"
            className="rounded-md shrink-0"
            // disabled={disabled}
          >
            <ArrowUp size={20} />
          </Button>
        </div>
      </div>

      {/* Second row: Big multiline textarea */}
      <textarea
        id="search-bar"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        onKeyDown={(e) => {
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
        // disabled={disabled}
      />

      {/* External UploadDialog component */}
      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleDocumentUpload}
      />
    </form>
  );
};