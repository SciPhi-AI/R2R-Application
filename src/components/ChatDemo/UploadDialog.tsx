// File: UploadDialog.tsx
import { Upload, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { UploadDialogProps } from '@/types';


export const UploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [hiRes, setHiRes] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => {
      const newFiles = acceptedFiles.filter((newFile) => {
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
    disabled: isUploading
  });

  // On Upload click
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
              <div className="flex-grow"></div>
              <TooltipProvider>
                <div className="flex items-center space-x-2 mt-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        checked={hiRes}
                        onCheckedChange={setHiRes}
                        disabled={isUploading}
                        aria-label="Ingestion quality: hi-res uses an advanced VLM approach."
                        className="text-accent-base bg-accent-base disabled:opacity-50"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Ingestion quality: hi-res uses an advanced VLM approach
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-base"></div>
            <p className="text-lg font-semibold">Uploading Files...</p>
            <p className="text-sm text-gray-500 text-center">
              Please do not navigate away from this page while the upload is in progress
            </p>
            <ul className="pl-5 max-h-40 overflow-y-auto w-full">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between mb-2">
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
                isDragActive ? 'border-accent-dark bg-indigo-50' : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files or folders here ...</p>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p>Drag and drop files or folders here, or click to select</p>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div>
                <h3 className="font-semibold mt-4 mb-2">Selected files:</h3>
                <ul className="pl-5 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between mb-2">
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
              color={files.length === 0 ? 'disabled' : 'filled'}
            >
              Upload {files.length > 0 ? `(${files.length} files)` : ''}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};