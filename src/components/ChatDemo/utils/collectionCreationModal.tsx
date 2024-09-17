import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

interface CollectionCreationModalProps {
  open: boolean;
  onClose: () => void;
  onCollectionCreated: () => void;
}

const CollectionCreationModal: React.FC<CollectionCreationModalProps> = ({
  open,
  onClose,
  onCollectionCreated,
}) => {
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Collection name is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      await client.createGroup(name.trim(), description.trim() || undefined);
      toast({
        title: 'Collection Created',
        description: `Collection "${name}" has been successfully created.`,
      });
      setName('');
      setDescription('');
      onClose();
      onCollectionCreated();
    } catch (error: any) {
      console.error('Error creating collection:', error);
      toast({
        title: 'Error',
        description:
          error?.message ||
          'An unexpected error occurred while creating the collection.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Collection</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <label className="block mb-2 font-medium">
            Collection Name<span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter collection name"
            required
          />
        </div>
        <div className="mt-4">
          <label className="block mb-2 font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter collection description (optional)"
          />
        </div>
        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <Button color="filled" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button color="filled" onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionCreationModal;
