import { Loader, FileSearch2, FileDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import DownloadFileContainer from '@/components/ChatDemo/DownloadFileContainer';
import Table, { Column } from '@/components/ChatDemo/Table';
import UpdateButtonContainer from '@/components/ChatDemo/UpdateButtonContainer';
import { UploadButton } from '@/components/ChatDemo/upload';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IngestionStatus, DocumentInfoType } from '@/types';

interface DocumentsTableProps {
  documents: DocumentInfoType[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onRefresh: () => void;
  pendingDocuments: string[];
  setPendingDocuments: React.Dispatch<React.SetStateAction<string[]>>;
  showPagination?: boolean;
  onSelectAll: (selected: boolean) => void;
  onSelectItem: (itemId: string, selected: boolean) => void;
  selectedItems: string[];
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  loading,
  totalItems,
  currentPage,
  onPageChange,
  itemsPerPage,
  onRefresh,
  pendingDocuments,
  setPendingDocuments,
  showPagination = true,
  onSelectAll,
  onSelectItem,
  selectedItems,
}) => {
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    order: 'asc' | 'desc';
  }>({ key: 'title', order: 'asc' });
  const [filters, setFilters] = useState<Record<string, any>>({
    ingestion_status: ['success', 'failure', 'pending'],
  });

  // Mapping function for ingestion status
  const mapIngestionStatus = (status: string): IngestionStatus => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'success') {
      return IngestionStatus.SUCCESS;
    }
    if (lowerStatus === 'failure') {
      return IngestionStatus.FAILURE;
    }
    return IngestionStatus.PENDING;
  };

  const mappedDocuments = useMemo(() => {
    return documents.map((doc) => ({
      ...doc,
      ingestion_status: mapIngestionStatus(doc.ingestion_status),
      kg_creation_status: mapIngestionStatus(doc.kg_creation_status),
    }));
  }, [documents]);

  const handleSelectAllInternal = (selected: boolean) => {
    onSelectAll(selected);
  };

  const handleSelectItemInternal = (itemId: string, selected: boolean) => {
    onSelectItem(itemId, selected);
  };

  const columns: Column<DocumentInfoType>[] = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'id', label: 'Document ID', truncate: true, copyable: true },
    { key: 'user_id', label: 'User ID', truncate: true, copyable: true },
    {
      key: 'collection_ids',
      label: 'Collection IDs',
      renderCell: (doc) =>
        doc.collection_ids && doc.collection_ids.length > 0
          ? doc.collection_ids.join(', ')
          : 'N/A',
      selected: false,
    },
    {
      key: 'ingestion_status',
      label: 'Ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failure', 'pending'],
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' = 'pending';
        switch (doc.ingestion_status) {
          case IngestionStatus.SUCCESS:
            variant = 'success';
            break;
          case IngestionStatus.FAILURE:
            variant = 'destructive';
            break;
          case IngestionStatus.PENDING:
            variant = 'pending';
            break;
        }
        return <Badge variant={variant}>{doc.ingestion_status}</Badge>;
      },
    },
    {
      key: 'kg_creation_status',
      label: 'KG Creation',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failure', 'pending'],
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' = 'pending';
        switch (doc.kg_creation_status) {
          case IngestionStatus.SUCCESS:
            variant = 'success';
            break;
          case IngestionStatus.FAILURE:
            variant = 'destructive';
            break;
          case IngestionStatus.PENDING:
            variant = 'pending';
            break;
        }
        return <Badge variant={variant}>{doc.kg_creation_status}</Badge>;
      },
      selected: false,
    },
    { key: 'type', label: 'Type', selected: false },
    {
      key: 'metadata',
      label: 'Metadata',
      renderCell: (doc) => JSON.stringify(doc.metadata),
      selected: false,
    },
    { key: 'version', label: 'Version', selected: false },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      renderCell: (doc) => new Date(doc.created_at).toLocaleString(),
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      sortable: true,
      renderCell: (doc) => new Date(doc.updated_at).toLocaleString(),
      selected: false,
    },
  ];

  const renderActions = (doc: DocumentInfoType) => (
    <div className="flex space-x-1 justify-end">
      <UpdateButtonContainer
        id={doc.id}
        onUpdateSuccess={() => onPageChange(currentPage)}
        showToast={toast}
      />

      <DownloadFileContainer
        id={doc.id}
        fileName={doc.title}
        showToast={toast}
      ></DownloadFileContainer>
      <Button
        onClick={() => {
          setSelectedDocumentId(doc.id);
          setIsDocumentInfoDialogOpen(true);
        }}
        color="filled"
        disabled={doc.ingestion_status !== IngestionStatus.SUCCESS}
        shape="slim"
        tooltip="View Document Info"
      >
        <FileSearch2 className="h-6 w-6" />
      </Button>
    </div>
  );

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center mt-12">
          <Loader className="animate-spin" size={64} />
        </div>
      ) : (
        <>
          <div className="flex justify-end items-center space-x-2 -mb-8">
            <UploadButton
              userId={null}
              uploadedDocuments={documents}
              setUploadedDocuments={() => {}}
              onUploadSuccess={async () => {
                await onRefresh();
                onSelectAll(false);
                return [];
              }}
              showToast={toast}
              setPendingDocuments={setPendingDocuments}
              setCurrentPage={() => {}}
              documentsPerPage={10}
            />
            <DeleteButton
              selectedDocumentIds={selectedItems}
              onDelete={() => onSelectAll(false)}
              onSuccess={async () => {
                await onPageChange(1);
                await onRefresh();
              }}
              showToast={toast}
            />
          </div>

          <Table
            data={mappedDocuments}
            currentData={mappedDocuments}
            columns={columns}
            onSelectAll={handleSelectAllInternal}
            onSelectItem={handleSelectItemInternal}
            selectedItems={selectedItems}
            actions={renderActions}
            initialSort={sortConfig}
            initialFilters={filters}
            tableHeight="600px"
            currentPage={currentPage}
            onPageChange={onPageChange}
            totalItems={totalItems}
            onSort={(key, order) => setSortConfig({ key, order })}
            onFilter={(newFilters) => setFilters(newFilters)}
            showPagination={showPagination}
          />
        </>
      )}

      {selectedDocumentId && (
        <DocumentInfoDialog
          id={selectedDocumentId}
          open={isDocumentInfoDialogOpen}
          onClose={() => {
            setIsDocumentInfoDialogOpen(false);
            setSelectedDocumentId('');
          }}
        />
      )}
    </div>
  );
};

export default DocumentsTable;
