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
import { UploadDialogProps } from '@/types';

export const UploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [files, setFiles] = useState<File[]>([]);

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

  const handleUpload = () => {
    onUpload(files);
    setFiles([]);
    onClose();
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Files or Folders</DialogTitle>
        </DialogHeader>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
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
        <Button
          onClick={handleUpload}
          disabled={files.length === 0}
          className={`mt-4 py-2 px-4 rounded-full transition-colors`}
          color={files.length === 0 ? 'disabled' : 'filled'}
        >
          Upload
        </Button>
      </DialogContent>
    </Dialog>
  );
};
