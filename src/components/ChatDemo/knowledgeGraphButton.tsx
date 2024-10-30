// KnowledgeGraphButton.tsx
import {
  FileUp,
  PencilLine,
  Workflow,
  BrainCog,
  BrainCircuit,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { useUserContext } from '@/context/UserContext';

import { GraphDialog, GraphOperationType } from './GraphDialog';

interface KnowledgeGraphButtonProps {
  collectionId: string;
  showToast: any;
}

export const KnowledgeGraphButton: React.FC<KnowledgeGraphButtonProps> = ({
  collectionId,
  showToast,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operationType, setOperationType] =
    useState<GraphOperationType>('create');

  const handleOpenDialog = (type: GraphOperationType) => {
    setOperationType(type);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="pl-2 pr-2 py-2 px-4"
            color="filled"
            shape="rounded"
            style={{ zIndex: 20, minWidth: '100px' }}
          >
            <Workflow className="mr-2 h-4 w-4 mt-1" />
            Knowledge Graph
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[150px] p-1">
          <div className="flex flex-col gap-1">
            <Button
              onClick={() => handleOpenDialog('create')}
              color="secondary"
              className="flex justify-between items-center"
            >
              <BrainCog className="mr-2 h-4 w-4" />
              <span>Create Graph</span>
            </Button>
            <Button
              onClick={() => handleOpenDialog('enrich')}
              color="secondary"
              className="flex justify-between items-center"
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              <span>Enrich Graph</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <GraphDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        collectionId={collectionId}
        operationType={operationType}
        showToast={showToast}
      />
    </>
  );
};
