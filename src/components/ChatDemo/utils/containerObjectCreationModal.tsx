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

export enum ContainerType {
  Collection = 'collection',
  Graph = 'graph',
}

interface containerObjectCreationModalProps {
  containerType: ContainerType;
  open: boolean;
  onClose: () => void;
  onCollectionCreated: () => void;
}

const ContainerObjectCreationModal: React.FC<
  containerObjectCreationModalProps
> = ({ containerType, open, onClose, onCollectionCreated }) => {
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const capitalizedType =
    containerType.charAt(0).toUpperCase() + containerType.slice(1);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: `${capitalizedType} name is required.`,
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

      const createPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      if (containerType === ContainerType.Collection) {
        await client.collections.create(createPayload);
      } else {
        await client.graphs.create(createPayload);
      }

      toast({
        title: `${capitalizedType} Created`,
        description: `${capitalizedType} "${name}" has been successfully created.`,
        variant: 'success',
      });
      setName('');
      setDescription('');
      onClose();
      onCollectionCreated();
    } catch (error: any) {
      console.error(`Error creating ${containerType}:`, error);
      toast({
        title: 'Error',
        description:
          error?.message ||
          `An unexpected error occurred while creating the ${containerType}.`,
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
          <DialogTitle className="text-2xl">
            Create a New {capitalizedType}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <label className="block mb-2 font-medium">
            {capitalizedType} Name<span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Enter ${containerType} name`}
            required
          />
        </div>
        <div className="mt-4">
          <label className="block mb-2 font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Enter ${containerType} description (optional)`}
          />
        </div>
        <DialogFooter className="mt-6">
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

export default ContainerObjectCreationModal;
