import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/context/UserContext';
import { DeleteButtonProps } from '@/types';

interface ExtendedDeleteButtonProps extends DeleteButtonProps {
  collectionId?: string;
  isCollection?: boolean;
  graphId?: string;
  isGraph?: boolean;
  userId?: string;
  isUser?: boolean;
}

export const DeleteButton: React.FC<ExtendedDeleteButtonProps> = ({
  selectedDocumentIds,
  onDelete,
  onSuccess,
  showToast,
  collectionId,
  isCollection = false,
  graphId,
  isGraph = false,
  userId,
  isUser = false,
}) => {
  const { getClient } = useUserContext();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleDelete = async () => {
    try {
      if (isUser) {
        if (!password || !confirmPassword) {
          setPasswordError('Both password fields are required');
          return;
        }
        if (password !== confirmPassword) {
          setPasswordError('Passwords do not match');
          return;
        }
      }

      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      if (isCollection && collectionId) {
        await client.collections.delete({
          id: collectionId,
        });
        showToast({
          variant: 'success',
          title: 'Collection deleted',
          description: 'The collection has been successfully deleted',
        });
        onSuccess();
        router.push('/collections');
      } else if (isGraph && graphId) {
        // await client.graphs.reset({
        //   collectionId: graphId,
        // });
        showToast({
          variant: 'success',
          title: 'Graph deleted',
          description: 'The graph has been successfully deleted',
        });
        onSuccess();
        router.push('/graphs');
      } else if (isUser && userId && password) {
        await client.users.delete({
          id: userId,
          password: password,
        });
        showToast({
          variant: 'success',
          title: 'Account deleted',
          description: 'Your account has been successfully deleted',
        });
        onSuccess();
        router.push('/auth/login');
      } else if (selectedDocumentIds.length > 0) {
        for (const documentId of selectedDocumentIds) {
          await client.documents.delete({
            id: documentId,
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
          title: `Failed to delete ${isCollection ? 'collection' : isUser ? 'account' : isGraph ? 'graph' : 'documents'}`,
          description: error.message,
        });
      } else {
        showToast({
          variant: 'destructive',
          title: `Failed to delete ${isCollection ? 'collection' : isUser ? 'account' : isGraph ? 'graph' : 'documents'}`,
          description: 'An unknown error occurred',
        });
      }
    }
  };

  const isDisabled = isCollection
    ? !collectionId
    : isUser
      ? !userId
      : isGraph
        ? !graphId
        : selectedDocumentIds.length === 0;

  const handleDialogClose = () => {
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className={`pl-2 pr-2 py-2 px-4 ${isDisabled ? 'cursor-not-allowed' : ''}`}
          color="danger"
          shape="rounded"
          disabled={isDisabled}
          style={{ zIndex: 20, minWidth: '100px' }}
        >
          <Trash2 className="mr-2 h-4 w-4 mt-1" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete{' '}
            {isUser
              ? 'your account'
              : isCollection
                ? 'the collection'
                : isGraph
                  ? 'the graph'
                  : 'the selected documents'}
            ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.{' '}
            {isUser ? (
              <div className="mt-4 space-y-4">
                <p className="text-red-500">
                  Please enter your password to confirm deletion of your
                  account.
                </p>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className="w-full"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className="w-full"
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                </div>
              </div>
            ) : (
              `${
                isCollection
                  ? 'The collection'
                  : isGraph
                    ? 'The graph'
                    : 'The selected documents'
              } will be permanently deleted.`
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDialogClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
