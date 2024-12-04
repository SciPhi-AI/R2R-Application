import { format, parseISO } from 'date-fns';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import { CollectionResponse } from 'r2r-js';
import { useEffect, useState, useCallback } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import AssignDocumentToCollectionDialog from '@/components/ChatDemo/utils/AssignDocumentToCollectionDialog';
import AssignUserToCollectionDialog from '@/components/ChatDemo/utils/AssignUserToCollectionDialog';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

export interface CollectionDialogProps {
  id: string;
  open: boolean;
  onClose: () => void;
}

const handleAssignSuccess = () => {
  // Do nothing
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) {
    return 'N/A';
  }
  const date = parseISO(dateString);
  return format(date, 'PPpp');
};

const formatValue = (value: any) => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value.toString();
};

const CollectionDialog: React.FC<CollectionDialogProps> = ({
  id,
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const { getClient } = useUserContext();
  const [collection, setCollection] = useState<CollectionResponse | null>(null);
  const [isAssignDocumentDialogOpen, setIsAssignDocumentDialogOpen] =
    useState(false);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchCollection = useCallback(async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const collection = await client.collections.retrieve({
        id: id,
      });

      setLoading(false);

      setCollection(collection.results);
    } catch (error) {
      console.error('Error fetching document chunks:', error);
      return { results: [], total_entries: 0 };
    }
  }, [getClient, id]);

  useEffect(() => {
    fetchCollection();
  }, [open, id, getClient, fetchCollection]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="text-white max-w-4xl">
          <div className="mt-4 space-y-2 h-[calc(90vh-120px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300 -mr-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold mb-2">
                Collection Overview
              </DialogTitle>
            </DialogHeader>
            {loading ? (
              <Loader className="mx-auto mt-20 animate-spin" size={64} />
            ) : (
              <>
                {collection && (
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <InfoRow label="Name" value={collection.name} />
                    <InfoRow
                      label="Description"
                      value={collection.description}
                    />
                    <InfoRow label="Collection ID" value={collection.id} />
                    <InfoRow
                      label="Dates"
                      values={[
                        {
                          label: 'Created',
                          value: formatDate(collection.created_at),
                        },
                        {
                          label: 'Updated',
                          value: formatDate(collection.updated_at),
                        },
                      ]}
                    />
                    <InfoRow label="Owner ID" value={collection.owner_id} />
                    <InfoRow
                      label="Access"
                      values={[
                        {
                          label: 'User Count',
                          value: collection.user_count,
                        },
                        {
                          label: 'Document Count',
                          value: collection.document_count,
                        },
                      ]}
                    />
                    <InfoRow
                      label="Graph"
                      values={[
                        {
                          label: 'Graph Cluster Status',
                          value: collection.graph_cluster_status,
                        },
                        {
                          label: 'Graph Sync Status',
                          value: collection.graph_sync_status,
                        },
                      ]}
                    />
                  </div>
                )}
              </>
            )}
            <DeleteButton
              collectionId={id}
              isCollection={true}
              onSuccess={() => router.push('/collections')}
              showToast={toast}
              selectedDocumentIds={[]}
              onDelete={() => {}}
            />
          </div>
          <Button
            onClick={() => setIsAssignDocumentDialogOpen(true)}
            type="button"
            color="filled"
            shape="rounded"
            className="pl-2 pr-2 text-white py-2 px-4"
            style={{ zIndex: 20 }}
          >
            Manage Files
          </Button>

          <Button
            onClick={() => setIsAssignUserDialogOpen(true)}
            type="button"
            color="filled"
            shape="rounded"
            className="pl-2 pr-2 text-white py-2 px-4"
            style={{ zIndex: 20 }}
          >
            Manage Users
          </Button>
        </DialogContent>
      </Dialog>
      <AssignDocumentToCollectionDialog
        open={isAssignDocumentDialogOpen}
        onClose={() => setIsAssignDocumentDialogOpen(false)}
        collection_id={id}
        onAssignSuccess={handleAssignSuccess}
      />
      <AssignUserToCollectionDialog
        open={isAssignUserDialogOpen}
        onClose={() => setIsAssignUserDialogOpen(false)}
        collection_id={id}
        onAssignSuccess={handleAssignSuccess}
      />
    </>
  );
};

// InfoRow Component
const InfoRow: React.FC<{
  label: string;
  value?: any;
  values?: { label?: string; value: any }[];
}> = ({ label, value, values }) => {
  const isLongContent =
    value?.length > 100 || values?.some((v) => v.value?.length > 100);

  return (
    <div
      className={`py-2 border-b border-gray-700/50 ${
        isLongContent
          ? 'flex flex-col space-y-2'
          : 'flex items-center justify-between'
      }`}
    >
      <span className="font-medium text-gray-200">{label}:</span>
      <span
        className={`text-gray-300 ${isLongContent ? 'mt-1' : 'flex items-center space-x-4'}`}
      >
        {value !== undefined
          ? formatValue(value)
          : values
            ? values.map((item, index) => (
                <span key={index} className="flex items-center">
                  {item.label && (
                    <span className="mr-1 text-gray-400">{item.label}:</span>
                  )}
                  <span>{formatValue(item.value)}</span>
                </span>
              ))
            : 'N/A'}
      </span>
    </div>
  );
};

export default CollectionDialog;
