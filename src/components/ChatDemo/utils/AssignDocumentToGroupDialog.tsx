import { Loader } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import Table, { Column } from '@/components/ChatDemo/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { DocumentInfoType } from '@/types';

interface AssignDocumentToGroupDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onAssignSuccess: () => void;
}

const AssignDocumentToGroupDialog: React.FC<
  AssignDocumentToGroupDialogProps
> = ({ open, onClose, groupId, onAssignSuccess }) => {
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [allDocuments, setAllDocuments] = useState<DocumentInfoType[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<
    DocumentInfoType[]
  >([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchAllDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const data = await client.documentsOverview();
      const documents: DocumentInfoType[] = data.results || [];
      setAllDocuments(documents);
      setFilteredDocuments(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getClient, toast]);

  useEffect(() => {
    if (open) {
      fetchAllDocuments();
      setSearchQuery('');
      setSelectedDocumentIds([]);
    }
  }, [open, fetchAllDocuments]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDocuments(allDocuments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allDocuments.filter(
        (doc) =>
          doc.id.toLowerCase().includes(query) ||
          (doc.title && doc.title.toLowerCase().includes(query))
      );
      setFilteredDocuments(filtered);
    }
  }, [searchQuery, allDocuments]);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = filteredDocuments.map((doc) => doc.id);
      setSelectedDocumentIds(allIds);
    } else {
      setSelectedDocumentIds([]);
    }
  };

  const handleSelectItem = (item: DocumentInfoType, selected: boolean) => {
    if (selected) {
      setSelectedDocumentIds((prev) => [...prev, item.id]);
    } else {
      setSelectedDocumentIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const handleAssign = async () => {
    if (selectedDocumentIds.length === 0) {
      toast({
        title: 'No Documents Selected',
        description: 'Please select at least one document to assign.',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const assignPromises = selectedDocumentIds.map((docId) =>
        client.assignDocumentToGroup(docId, groupId)
      );

      await Promise.all(assignPromises);

      toast({
        title: 'Success',
        description: 'Selected documents have been assigned to the group.',
        variant: 'success',
      });

      onAssignSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign documents. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const columns: Column<DocumentInfoType>[] = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'id', label: 'Document ID', truncate: true, copyable: true },
    { key: 'user_id', label: 'User ID', truncate: true, copyable: true },
    {
      key: 'ingestion_status',
      label: 'Ingestion Status',
      renderCell: (doc) => (
        <Badge
          variant={
            doc.ingestion_status === 'success'
              ? 'success'
              : doc.ingestion_status === 'failure'
                ? 'destructive'
                : 'pending'
          }
        >
          {doc.ingestion_status}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-4">
              Assign Documents to Group
            </DialogTitle>
            <Input
              placeholder="Search by Document ID or Title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center items-center mt-20">
              <Loader className="animate-spin" size={64} />
            </div>
          ) : (
            <Table
              data={filteredDocuments}
              columns={columns}
              itemsPerPage={10}
              currentData={filteredDocuments.slice(0, 10)}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              selectedItems={filteredDocuments.filter((doc) =>
                selectedDocumentIds.includes(doc.id)
              )}
              initialSort={{ key: 'title', order: 'asc' }}
              initialFilters={{}}
              tableHeight="500px"
              currentPage={1} // Reset to first page
              onPageChange={() => {}} // Not handling pagination inside dialog
              totalItems={filteredDocuments.length}
            />
          )}
          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <Button
              onClick={handleAssign}
              color="filled"
              disabled={assigning || selectedDocumentIds.length === 0}
            >
              Assign to Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssignDocumentToGroupDialog;
