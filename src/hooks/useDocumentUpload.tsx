import { useState } from 'react';

import { useUserContext } from '@/context/UserContext';

interface UploadedDoc {
  documentId: string;
  title: string;
}

interface UseDocumentUploadResult {
  uploadDocuments: (files: File[], hiRes: boolean) => Promise<UploadedDoc[]>;
  isUploading: boolean;
  error: string | null;
}

export function useDocumentUpload(): UseDocumentUploadResult {
  const { getClient } = useUserContext();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocuments = async (
    files: File[],
    hiRes: boolean
  ): Promise<UploadedDoc[]> => {
    setIsUploading(true);
    setError(null);
    const client = await getClient();
    if (!client) {
      setError('Failed to get authenticated client');
      setIsUploading(false);
      return [];
    }
    try {
      const uploaded: UploadedDoc[] = [];
      await Promise.all(
        files.map(async (file) => {
          const result = await client.documents.create({
            file,
            ingestionMode: hiRes ? 'hi‑res' : 'fast',
          });
          uploaded.push({
            documentId: result.results.documentId,
            title: file.name,
          });
        })
      );
      return uploaded;
    } catch (err: any) {
      setError(err?.message || 'Unknown error occurred');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadDocuments, isUploading, error };
}
