import { Plus, X } from "lucide-react";
import { UnprocessedChunk } from "r2r-js/dist/types";
import React, { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChunks: (
    chunks: UnprocessedChunk[],
    documentId?: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
}

interface ChunkInput {
  id: number;
  text: string;
}

export const CreateDialog: React.FC<CreateDialogProps> = ({
  isOpen,
  onClose,
  onCreateChunks,
}) => {
  const [chunks, setChunks] = useState<ChunkInput[]>([{ id: 1, text: "" }]);
  const [documentId, setDocumentId] = useState<string>("");
  const [metadata, setMetadata] = useState<string>("");
  const [isMetadataValid, setIsMetadataValid] = useState<boolean>(true);
  const [isDocumentIdValid, setIsDocumentIdValid] = useState<boolean>(true);

  const validateMetadata = (value: string) => {
    if (!value) {
      setIsMetadataValid(true);
      return;
    }

    try {
      JSON.parse(value);
      setIsMetadataValid(true);
    } catch {
      setIsMetadataValid(false);
    }
  };

  const validateDocumentId = (value: string) => {
    if (!value) {
      setIsDocumentIdValid(true);
      return;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    setIsDocumentIdValid(uuidRegex.test(value));
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setMetadata(value);
    validateMetadata(value);
  };

  const handleDocumentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setDocumentId(value);
    validateDocumentId(value);
  };

  const addChunk = () => {
    const newId =
      chunks.length > 0 ? Math.max(...chunks.map((c) => c.id)) + 1 : 1;
    setChunks([...chunks, { id: newId, text: "" }]);
  };

  const removeChunk = (id: number) => {
    if (chunks.length > 1) {
      setChunks(chunks.filter((chunk) => chunk.id !== id));
    }
  };

  const updateChunkText = (id: number, text: string) => {
    setChunks(
      chunks.map((chunk) => (chunk.id === id ? { ...chunk, text } : chunk))
    );
  };

  const handleCreate = async () => {
    try {
      await onCreateChunks(
        chunks.map((chunk) => ({
          id: crypto.randomUUID(),
          text: chunk.text,
          collectionIds: [],
          metadata: {},
          documentId: documentId || undefined,
        }))
      );
      // Reset form
      setChunks([{ id: 1, text: "" }]);
      setDocumentId("");
      setMetadata("");
      onClose();
    } catch (error) {
      console.error("Error creating chunks:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Chunks</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Optional Document ID */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Document ID
            </label>
            <Input
              value={documentId}
              onChange={handleDocumentIdChange}
              placeholder="Optional UUID"
              className={`${
                isDocumentIdValid
                  ? ""
                  : "border-red-500 focus:ring-red-500 focus:border-red-500"
              }`}
            />
            {!isDocumentIdValid && (
              <p className="mt-1 text-sm text-red-500">Invalid UUID format</p>
            )}
          </div>

          {/* Chunks */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Chunks</label>
              <Button
                onClick={addChunk}
                color="secondary"
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Chunk
              </Button>
            </div>

            {chunks.map((chunk) => (
              <div key={chunk.id} className="relative">
                <Textarea
                  value={chunk.text}
                  onChange={(e) => updateChunkText(chunk.id, e.target.value)}
                  placeholder="Enter chunk text"
                  rows={3}
                  className="pr-8"
                />
                {chunks.length > 1 && (
                  <button
                    onClick={() => removeChunk(chunk.id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Metadata */}
          <div>
            <label className="block text-sm font-medium mb-1">Metadata</label>
            <Textarea
              value={metadata}
              onChange={handleMetadataChange}
              placeholder='Optional JSON: {"key": "value"}'
              rows={4}
              className={`${
                isMetadataValid
                  ? ""
                  : "border-red-500 focus:ring-red-500 focus:border-red-500"
              }`}
            />
            {!isMetadataValid && (
              <p className="mt-1 text-sm text-red-500">Invalid JSON format</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              chunks.some((chunk) => !chunk.text.trim()) ||
              !isMetadataValid ||
              !isDocumentIdValid
            }
            color="filled"
          >
            Create Chunks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
