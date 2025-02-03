import { Upload, X, InfoIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useUserContext } from '@/context/UserContext';
import { UploadDialogProps } from '@/types';

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_TIME = 60000; // 1 minute

export const UploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [hiRes, setHiRes] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{ documentId: string; title: string }>
  >([]);
  const [ingestionProgress, setIngestionProgress] = useState<
    Record<string, string>
  >({});
  const [pollingError, setPollingError] = useState<string | null>(null);

  const { getClient } = useUserContext();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('[DEBUG] onDrop called with files:', acceptedFiles);
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
    disabled: isUploading,
  });

  const pollForCompletion = async (documentIds: string[]) => {
    const client = await getClient();
    console.log('[DEBUG] Starting polling for document IDs:', documentIds);

    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      let attemptCount = 0;

      const interval = setInterval(async () => {
        try {
          attemptCount++;
          const elapsedTime = Date.now() - startTime;

          // Check if we've exceeded the maximum polling time
          if (elapsedTime >= MAX_POLLING_TIME) {
            clearInterval(interval);
            const error =
              'Polling timeout: Document ingestion taking longer than expected';
            console.error('[DEBUG] Polling timeout:', error);
            setPollingError(error);
            reject(new Error(error));
            return;
          }

          console.log('documentIds = ', documentIds);

          const response = await client.documents.list({ ids: documentIds });
          console.log(
            `[DEBUG] Polling attempt ${attemptCount}, response:`,
            response
          );

          if (!response.results || response.results.length === 0) {
            console.log(
              '[DEBUG] No documents found yet, continuing to poll...'
            );
            setIngestionProgress((prev) => ({
              ...prev,
              ...Object.fromEntries(documentIds.map((id) => [id, 'pending'])),
            }));
            return;
          }

          const progress: Record<string, string> = {};
          const foundIds = new Set();

          response.results.forEach((doc: any) => {
            foundIds.add(doc.id);
            progress[doc.id] = doc.ingestionStatus;
          });

          // For any IDs we didn't find in the response, mark as pending
          documentIds.forEach((id) => {
            if (!foundIds.has(id)) {
              progress[id] = 'pending';
            }
          });

          setIngestionProgress(progress);
          console.log('[DEBUG] Updated ingestion progress:', progress);

          // Check if every document is in the "success" state.
          const allSuccess = documentIds.every(
            (id) => progress[id] === 'success'
          );

          if (allSuccess) {
            console.log(
              "[DEBUG] All documents ingested successfully with status 'success'."
            );
            clearInterval(interval);
            resolve();
          }
        } catch (error) {
          console.error('[DEBUG] Polling error:', error);
          // If we've exceeded the maximum time, clear the interval and reject.
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime >= MAX_POLLING_TIME) {
            clearInterval(interval);
            reject(error);
          }
        }
      }, POLLING_INTERVAL);

      // Cleanup function to clear interval if component unmounts
      return () => clearInterval(interval);
    });
  };

  // const pollForCompletion = async (documentIds: string[]) => {
  //   const client = await getClient();
  //   console.log("[DEBUG] Starting polling for document IDs:", documentIds);

  //   return new Promise<void>((resolve, reject) => {
  //     const startTime = Date.now();
  //     let attemptCount = 0;

  //     const interval = setInterval(async () => {
  //       try {
  //         attemptCount++;
  //         const elapsedTime = Date.now() - startTime;

  //         // Check if we've exceeded the maximum polling time
  //         if (elapsedTime >= MAX_POLLING_TIME) {
  //           clearInterval(interval);
  //           const error = "Polling timeout: Document ingestion taking longer than expected";
  //           console.error("[DEBUG] Polling timeout:", error);
  //           setPollingError(error);
  //           reject(new Error(error));
  //           return;
  //         }

  //         console.log('documentIds = ', documentIds)

  //         const response = await client.documents.list({ ids: documentIds });
  //         console.log(`[DEBUG] Polling attempt ${attemptCount}, response:`, response);

  //         if (!response.results || response.results.length === 0) {
  //           console.log("[DEBUG] No documents found yet, continuing to poll...");
  //           setIngestionProgress(prev => ({
  //             ...prev,
  //             ...Object.fromEntries(documentIds.map(id => [id, 'pending']))
  //           }));
  //           return;
  //         }

  //         const progress: Record<string, string> = {};
  //         const foundIds = new Set();

  //         response.results.forEach((doc: any) => {
  //           foundIds.add(doc.id);
  //           progress[doc.id] = doc.ingestionStatus;
  //         });

  //         // For any IDs we didn't find in the response, mark as pending
  //         documentIds.forEach(id => {
  //           if (!foundIds.has(id)) {
  //             progress[id] = 'pending';
  //           }
  //         });

  //         setIngestionProgress(progress);
  //         console.log("[DEBUG] Updated ingestion progress:", progress);

  //         const allCompleted = documentIds.every(id =>
  //           progress[id] === 'completed'
  //         );

  //         if (allCompleted) {
  //           console.log("[DEBUG] All documents ingested successfully.");
  //           clearInterval(interval);
  //           resolve();
  //         }
  //       } catch (error) {
  //         console.error("[DEBUG] Polling error:", error);
  //         // Don't immediately fail - log the error but continue polling
  //         // unless we've hit the timeout
  //         const elapsedTime = Date.now() - startTime;
  //         if (elapsedTime >= MAX_POLLING_TIME) {
  //           clearInterval(interval);
  //           reject(error);
  //         }
  //       }
  //     }, POLLING_INTERVAL);

  //     // Cleanup function to clear interval if component unmounts
  //     return () => clearInterval(interval);
  //   });
  // };

  const handleUpload = async () => {
    console.log('[DEBUG] handleUpload called. Files to upload:', files);
    setIsUploading(true);
    setPollingError(null);

    try {
      console.log('[DEBUG] Initiating upload process...');
      const uploaded = (await onUpload(files, hiRes)) || [];
      console.log(
        '[DEBUG] Upload API call completed. Uploaded docs:',
        uploaded
      );
      setUploadedDocs(uploaded);

      const documentIds = uploaded.map((doc) => doc.documentId);
      console.log(
        '[DEBUG] Starting ingestion polling for document IDs:',
        documentIds
      );
      await pollForCompletion(documentIds);
      console.log('[DEBUG] Ingestion process complete.');
    } catch (error) {
      console.error('[DEBUG] Error during upload/ingestion process:', error);
      setPollingError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      if (!pollingError) {
        console.log('[DEBUG] Resetting state and closing dialog.');
        setFiles([]);
        setIsUploading(false);
        onClose();
      }
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

        {hiRes && (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              hi-res mode is enabled. This provides higher quality results using
              VLMs, but processing will take longer.
            </AlertDescription>
          </Alert>
        )}

        {pollingError && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{pollingError}</AlertDescription>
          </Alert>
        )}

        {isUploading ? (
          uploadedDocs.length > 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
              <p className="text-lg font-semibold">
                {Object.keys(ingestionProgress).length > 0
                  ? 'Ingesting Files...'
                  : 'Upload complete. Waiting for ingestion...'}
              </p>
              <p className="text-sm text-gray-500 text-center">
                Ingestion is taking place on the remote server...
              </p>
              <ul className="w-full">
                {uploadedDocs.map((doc) => {
                  const status = ingestionProgress[doc.documentId] || 'Pending';
                  return (
                    <li key={doc.documentId} className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-xs">{doc.title}</span>
                        <span className="text-xs text-gray-500">{status}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        {status !== 'completed' ? (
                          <div
                            className="bg-blue-600 h-2 rounded-full animate-pulse"
                            style={{ width: '100%' }}
                          ></div>
                        ) : (
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: '100%' }}
                          ></div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-base"></div>
              <p className="text-lg font-semibold">Uploading Files...</p>
              <p className="text-sm text-gray-500 text-center">
                Please do not navigate away from this page while the upload is
                in progress.
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
          )
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

export default UploadDialog;
