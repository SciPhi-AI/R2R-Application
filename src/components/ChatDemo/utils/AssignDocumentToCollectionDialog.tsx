import { Loader } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import DocumentsTable from '@/components/ChatDemo/DocumentsTable';
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

interface AssignDocumentToCollectionDialogProps {
  open: boolean;
  onClose: () => void;
  collection_id: string;
  onAssignSuccess: () => void;
}

const AssignDocumentToCollectionDialog: React.FC<
  AssignDocumentToCollectionDialogProps
> = ({ open, onClose, collection_id, onAssignSuccess }) => {
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [allDocuments, setAllDocuments] = useState<DocumentInfoType[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<
    DocumentInfoType[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllDocuments = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const data = await client.documentsOverview();
        console.log('data:', data);

        // Filter out documents that are already in the collection
        const filteredDocs = (data.results || []).filter(
          (doc: DocumentInfoType) => !doc.collection_ids.includes(collection_id)
        );

        setAllDocuments(filteredDocs);
        setFilteredDocuments(filteredDocs);
        setTotalItems(filteredDocs.length);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch documents. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [getClient, toast, collection_id]
  );

  useEffect(() => {
    if (open) {
      fetchAllDocuments(1);
      setSelectedDocumentIds([]);
      setSearchQuery('');
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
      setSelectedDocumentIds(filteredDocuments.map((doc) => doc.id));
    } else {
      setSelectedDocumentIds([]);
    }
  };

  const handleSelectItem = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedDocumentIds((prev) => [...prev, itemId]);
    } else {
      setSelectedDocumentIds((prev) => prev.filter((id) => id !== itemId));
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
        client.assignDocumentToCollection(docId, collection_id)
      );

      await Promise.all(assignPromises);

      toast({
        title: 'Success',
        description: 'Selected documents have been assigned to the collection.',
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">
            Assign Documents to Collection
          </DialogTitle>
          <Input
            placeholder="Search by Title or Document ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center mt-20">
            <Loader className="animate-spin" size={64} />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-4">
            All documents are already assigned to this collection.
          </div>
        ) : (
          <>
            <DocumentsTable
              documents={filteredDocuments}
              loading={false}
              totalItems={filteredDocuments.length}
              currentPage={currentPage}
              onPageChange={(page) => {
                setCurrentPage(page);
              }}
              itemsPerPage={1000}
              onRefresh={() => fetchAllDocuments(currentPage)}
              pendingDocuments={pendingDocuments}
              setPendingDocuments={setPendingDocuments}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              selectedItems={selectedDocumentIds}
              showPagination={false}
            />
            <DialogFooter className="mt-4 flex justify-end space-x-2">
              <Button
                onClick={handleAssign}
                color="filled"
                disabled={assigning || selectedDocumentIds.length === 0}
                style={{ zIndex: 20 }}
              >
                Assign to Collection
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignDocumentToCollectionDialog;
