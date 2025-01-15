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

  // Dropzone logic
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
  });

  // On Upload click
  const handleUpload = () => {
    onUpload(files, hiRes);
    setFiles([]); // clear local state
    onClose(); // close the modal
  };

  // Remove single file from list
  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/*
      Turn the DialogHeader into a flex container. 
      Remove bottom margin from DialogTitle (e.g. `mb-0`) to prevent stacking.
    */}
        <DialogHeader className="flex items-left justify-between">
          <DialogTitle className="mb-0">
            {/* Right-aligned switch + label */}
            <div className="flex items-center space-x-2">
              Upload Files or Folders
              {/* grow rest of space */}
              <div className="flex-grow"></div>
              <TooltipProvider>
                <div className="flex items-center space-x-2 mt-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        checked={hiRes}
                        onCheckedChange={setHiRes}
                        aria-label="Ingestion quality: hi-res uses an advanced VLM approach."
                        className="text-accent-base bg-accent-base"
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

        {/* Dropzone area */}
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

        {/* Selected files display */}
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
                  <button
                    onClick={() => removeFile(index)}
                    className="mr-4 text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={files.length === 0}
          className="mt-4 py-2 px-4 rounded-full transition-colors"
          color={files.length === 0 ? 'disabled' : 'filled'}
        >
          Upload
        </Button>
      </DialogContent>
    </Dialog>
  );
};
