import { FileMinus, UserRoundX } from 'lucide-react';
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

export interface RemoveButtonProps {
  itemId: string;
  collectionId: string;
  itemType: 'document' | 'user';
  onSuccess: () => void;
  showToast: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

export const RemoveButton: React.FC<RemoveButtonProps> = ({
  itemId,
  collectionId,
  itemType,
  onSuccess,
  showToast,
}) => {
  const { getClient } = useUserContext();

  const handleRemove = async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      if (itemType === 'document') {
        await client.removeDocumentFromCollection(itemId, collectionId);
      } else if (itemType === 'user') {
        await client.removeUserFromCollection(itemId, collectionId);
      }

      showToast({
        variant: 'success',
        title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} removed`,
        description: `The ${itemType} has been successfully removed from the collection`,
      });
      onSuccess();
    } catch (error: unknown) {
      console.error(`Error removing ${itemType}:`, error);
      if (error instanceof Error) {
        showToast({
          variant: 'destructive',
          title: `Failed to remove ${itemType}`,
          description: error.message,
        });
      } else {
        showToast({
          variant: 'destructive',
          title: `Failed to remove ${itemType}`,
          description: 'An unknown error occurred',
        });
      }
    }
  };

  const Icon = itemType === 'document' ? FileMinus : UserRoundX;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button color="filled" shape="slim">
          <Icon className="h-6 w-6" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to remove this {itemType} from the collection?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove the {itemType} from the current collection.
            The {itemType} will not be deleted from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
