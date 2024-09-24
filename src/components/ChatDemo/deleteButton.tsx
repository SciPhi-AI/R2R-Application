import { AlertTriangle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';
import { DeleteButtonProps } from '@/types';

interface ExtendedDeleteButtonProps extends DeleteButtonProps {
  collectionId?: string;
  isCollection?: boolean;
}

export const DeleteButton: React.FC<ExtendedDeleteButtonProps> = ({
  selectedDocumentIds,
  onDelete,
  onSuccess,
  showToast,
  collectionId,
  isCollection = false,
}) => {
  const { getClient } = useUserContext();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      if (isCollection && collectionId) {
        await client.deleteCollection(collectionId);
        showToast({
          variant: 'success',
          title: 'Collection deleted',
          description: 'The collection has been successfully deleted',
        });
        onSuccess();
        router.push('/collections');
      } else if (selectedDocumentIds.length > 0) {
        // Delete documents one by one to ensure correct format
        for (const documentId of selectedDocumentIds) {
          await client.delete({
            document_id: {
              $eq: documentId,
            },
          });
        }
        showToast({
          variant: 'success',
          title: 'Documents deleted',
          description: 'The selected documents have been successfully deleted',
        });
        onSuccess();
        onDelete();
      }
    } catch (error: unknown) {
      console.error('Error deleting:', error);
      if (error instanceof Error) {
        showToast({
          variant: 'destructive',
          title: `Failed to delete ${isCollection ? 'collection' : 'documents'}`,
          description: error.message,
        });
      } else {
        showToast({
          variant: 'destructive',
          title: `Failed to delete ${isCollection ? 'collection' : 'documents'}`,
          description: 'An unknown error occurred',
        });
      }
    }
  };

  const isDisabled = isCollection
    ? !collectionId
    : selectedDocumentIds.length === 0;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className={`pl-2 pr-2 py-2 px-4 ${isDisabled ? 'cursor-not-allowed' : ''}`}
          color="danger"
          shape="rounded"
          disabled={isDisabled}
          style={{ zIndex: 20 }}
        >
          <Trash2 className="mr-2 h-4 w-4 mt-1" />
          Delete {isCollection ? 'Collection' : 'File(s)'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete the{' '}
            {isCollection ? 'collection' : 'selected documents'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.{' '}
            {isCollection ? 'The collection' : 'The selected documents'} will be
            permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
