import { KGRunType } from 'r2r-js';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserContext } from '@/context/UserContext';

export type GraphOperationType = 'create' | 'enrich';

interface GraphDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  operationType: GraphOperationType;
  showToast: any;
}

interface EstimateResults {
  message: string;
  document_count: number;
  number_of_jobs_created: number;
  total_chunks: number;
  estimated_entities: string;
  estimated_triples: string;
  estimated_llm_calls: string;
  estimated_total_in_out_tokens_in_millions: string;
  estimated_total_time_in_minutes: string;
  estimated_cost_in_usd: string;
}

export const GraphDialog: React.FC<GraphDialogProps> = ({
  isOpen,
  onClose,
  collectionId,
  operationType,
  showToast,
}) => {
  const { getClient } = useUserContext();
  const [estimate, setEstimate] = useState<EstimateResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreateOperation = operationType === 'create';
  const titleText = isCreateOperation
    ? 'Create Knowledge Graph'
    : 'Enrich Knowledge Graph';
  const loadingText = isCreateOperation
    ? 'Creating Graph...'
    : 'Enriching Graph...';
  const actionText = isCreateOperation ? 'Create Graph' : 'Enrich Graph';

  useEffect(() => {
    if (isOpen) {
      getEstimate();
    }
  }, [isOpen]);

  const getEstimate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const response = await (isCreateOperation
        ? client.createGraph(collectionId, KGRunType.ESTIMATE)
        : client.enrichGraph(collectionId, KGRunType.ESTIMATE));
      setEstimate(response.results);
    } catch (err: any) {
      // Handle specific 500 error for enrich graph
      if (err?.message?.includes('Status 500')) {
        const match = err.message.match(
          /Status 500: An error '(.+?)' occurred/
        );
        setError(match ? match[1] : 'An unexpected error occurred');
      } else {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to get ${operationType} estimate`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      (isCreateOperation
        ? client.createGraph(collectionId, KGRunType.RUN)
        : client.enrichGraph(collectionId, KGRunType.RUN)
      ).catch((err) => {
        showToast({
          variant: 'destructive',
          title: `${isCreateOperation ? 'Graph Creation' : 'Graph Enrichment'} Failed`,
          description:
            err instanceof Error ? err.message : 'An unexpected error occurred',
        });
      });

      showToast({
        variant: 'success',
        title: `${isCreateOperation ? 'Creating' : 'Enriching'} Knowledge Graph`,
        description: `The process has started and will continue in the background. You can monitor progress in the Documents tab.`,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${operationType} graph`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEstimate(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-background border shadow-md">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && !estimate && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-2" />
              <p>Getting estimate...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-4">
              {error}
            </div>
          )}

          {estimate && !error && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="font-medium">{estimate.document_count}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Chunks</p>
                  <p className="font-medium">{estimate.total_chunks}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Estimated Entities
                  </p>
                  <p className="font-medium">{estimate.estimated_entities}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Estimated Triples
                  </p>
                  <p className="font-medium">{estimate.estimated_triples}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Estimated Time
                  </p>
                  <p className="font-medium">
                    {estimate.estimated_total_time_in_minutes}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Estimated Cost
                  </p>
                  <p className="font-medium">
                    ${estimate.estimated_cost_in_usd}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {estimate.message}
                </p>
                <Button
                  onClick={handleAction}
                  disabled={isLoading}
                  color="filled"
                  className="w-full"
                >
                  {isLoading ? loadingText : actionText}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
