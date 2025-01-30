// File: SearchWithUpload.tsx

import {
  ArrowUp,
  FolderOpen,
  Globe,
  Paperclip,
  Search as SearchIcon,
} from 'lucide-react';
import { Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserContext } from '@/context/UserContext';
import { generateIdFromLabel } from '@/lib/utils';
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
 * UploadDialog Component
 * (Ingestion of files, progress, hi-res toggle, etc.)
 * ------------------------------------------------------------------ */
interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], hiRes?: boolean) => Promise<void>;
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [hiRes, setHiRes] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => {
      const newFiles = acceptedFiles.filter((newFile) => {
        // Avoid duplicates
        const isDuplicate = prevFiles.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.size === newFile.size
        );
        return !isDuplicate;
      });
      return [...prevFiles, ...newFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      await onUpload(files, hiRes);
    } finally {
      setFiles([]);
      setIsUploading(false);
      onClose();
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={isUploading ? undefined : onClose}>
      <DialogContent hideCloseButton={isUploading}>
        <DialogHeader className="flex items-left justify-between">
          <DialogTitle className="mb-0">
            <div className="flex items-center space-x-2">
              Upload Files or Folders
              <div className="flex-grow" />
              <TooltipProvider>
                <div className="flex items-center space-x-2 mt-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        checked={hiRes}
                        onCheckedChange={setHiRes}
                        disabled={isUploading}
                        className="text-accent-base bg-accent-base disabled:opacity-50"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Ingestion quality: hi-res uses advanced ingestion
                    </TooltipContent>
                  </Tooltip>
                  <label className={'text-sm' + (hiRes ? '' : ' pr-3')}>
                    {hiRes ? 'hi-res' : 'fast  '}
                  </label>
                </div>
              </TooltipProvider>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-base" />
            <p className="text-lg font-semibold">Uploading Files...</p>
            <p className="text-sm text-gray-500 text-center">
              Please do not navigate away from this page while the upload is in
              progress. Note that ingestion of the input document may take up to
              a few minutes after upload.
            </p>
            <ul className="pl-5 max-h-40 overflow-y-auto w-full">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between mb-2"
                >
                  <span className="truncate max-w-xs">
                    {(file as any).webkitRelativePath || file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                isDragActive
                  ? 'border-accent-dark bg-indigo-50'
                  : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files or folders here ...</p>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p>Drag and drop files/folders here, or click to select.</p>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div>
                <h3 className="font-semibold mt-4 mb-2">Selected files:</h3>
                <ul className="pl-5 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between mb-2"
                    >
                      <span className="truncate max-w-xs">
                        {(file as any).webkitRelativePath || file.name}
                      </span>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-4">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={files.length === 0}
              className="mt-4 py-2 px-4 rounded-full transition-colors"
            >
              Upload {files.length > 0 ? `(${files.length} files)` : ''}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------
 * Main Search Component with Paperclip integration
 * ------------------------------------------------------------------ */
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
  const router = useRouter();
  const { getClient } = useUserContext(); // From your user context
  const [value, setValue] = React.useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);

  // You might store newly uploaded documents in local state or globally
  const [uploadedDocuments, setUploadedDocuments] = React.useState<any[]>([]);

  if (!placeholder) {
    placeholder = 'Ask a question...';
  }

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

  // Here is your "onUpload" logic, similar to what was in your UploadButton
  const handleDocumentUpload = async (files: File[], hiRes: boolean = true) => {
    const client = await getClient();
    if (!client) {
      console.error('Failed to get authenticated client');
      return;
    }
    try {
      const uploaded: any[] = [];
      // Upload each file
      await Promise.all(
        files.map(async (file) => {
          const docId = generateIdFromLabel(file.name);
          uploaded.push({ documentId: docId, title: file.name });

          await client.documents.create({
            file,
            ingestionMode: hiRes ? 'hi-res' : 'fast',
          });
        })
      );

      // Merge newly uploaded docs with local state
      setUploadedDocuments((prev) => [...prev, ...uploaded]);

      // If you want to toast a success message, do so here:
      console.log('Upload succeeded. Documents:', uploaded);
    } catch (err: any) {
      console.error('Upload failed:', err?.message || err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* 
        1) First row: Toggles (left) + Paperclip + Up Arrow Button (right)
      */}
      <div className="flex items-center justify-between w-full gap-2 mb-2">
        {/* Left side toggles */}
        <div className="flex items-center gap-2">
          {/* 1) Web Search Toggle */}
          {mode === 'rag_agent' && (
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
          )}

          {/* 2) Magnify Toggle */}
          {mode === 'rag_agent' && (
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
          )}

          {/* 3) Context Toggle */}
          {mode === 'rag_agent' && (
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
          )}
        </div>

        {/* Right side buttons: Paperclip (upload) + Up Arrow (submit) */}
        <div className="flex items-center gap-2">
          {/* Paperclip Button -> opens UploadDialog */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <div className="flex items-center">
                <TooltipTrigger asChild>
                  <Button
                    // variant="outline"
                    className="rounded-md shrink-0 p-2"
                    type="button"
                    onClick={() => setIsUploadDialogOpen(true)}
                    disabled={disabled}
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
            disabled={disabled}
          >
            <ArrowUp size={20} />
          </Button>
        </div>
      </div>

      {/* 
        2) Second row: Big multiline textarea
           ~50% bigger than typical chat input
      */}
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
        disabled={disabled}
      />

      {/* 
        UploadDialog (renders a modal when isOpen=true)
      */}
      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleDocumentUpload}
      />
    </form>
  );
};
