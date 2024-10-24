import { Loader, FileSearch2, SlidersHorizontal } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import DownloadFileContainer from '@/components/ChatDemo/DownloadFileContainer';
import Table, { Column } from '@/components/ChatDemo/Table';
import UpdateButtonContainer from '@/components/ChatDemo/UpdateButtonContainer';
import { UploadButton } from '@/components/ChatDemo/upload';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { IngestionStatus, DocumentInfoType } from '@/types';

interface DocumentsTableProps {
  documents: DocumentInfoType[];
  loading: boolean;
  onRefresh: () => void;
  pendingDocuments: string[];
  setPendingDocuments: React.Dispatch<React.SetStateAction<string[]>>;
  showPagination?: boolean;
  onSelectAll: (selected: boolean) => void;
  onSelectItem: (itemId: string, selected: boolean) => void;
  selectedItems: string[];
  hideActions?: boolean; // Optional prop to hide actions if needed
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (columnKey: string, isVisible: boolean) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  loading,
  onRefresh,
  pendingDocuments,
  setPendingDocuments,
  showPagination = true,
  onSelectAll,
  onSelectItem,
  selectedItems,
  hideActions = false,
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
    ingestion_status: ['success', 'failed', 'pending'],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {}
  );

  const itemsPerPage = 10;

  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    columns.forEach((col) => {
      initialVisibility[col.key] = col.selected !== false;
    });
    setVisibleColumns(initialVisibility);
  }, []);

  const handleToggleColumn = (columnKey: string, isVisible: boolean) => {
    setVisibleColumns((prev) => ({ ...prev, [columnKey]: isVisible }));
  };

  const mapIngestionStatus = (status: string): IngestionStatus => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'success') {
      return IngestionStatus.SUCCESS;
    }
    if (lowerStatus === 'failed') {
      return IngestionStatus.FAILED;
    }
    return IngestionStatus.PENDING;
  };

  const mappedDocuments = useMemo(() => {
    return documents.map((doc) => ({
      ...doc,
      ingestion_status: mapIngestionStatus(doc.ingestion_status),
      kg_extraction_status: mapIngestionStatus(doc.kg_extraction_status),
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
      filterOptions: ['success', 'failed', 'pending'],
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' = 'pending';
        switch (doc.ingestion_status) {
          case IngestionStatus.SUCCESS:
            variant = 'success';
            break;
          case IngestionStatus.FAILED:
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
      key: 'kg_extraction_status',
      label: 'KG Extraction',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending'],
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' = 'pending';
        switch (doc.kg_extraction_status) {
          case IngestionStatus.SUCCESS:
            variant = 'success';
            break;
          case IngestionStatus.FAILED:
            variant = 'destructive';
            break;
          case IngestionStatus.PENDING:
            variant = 'pending';
            break;
        }
        return <Badge variant={variant}>{doc.kg_extraction_status}</Badge>;
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

  const renderActions = (doc: DocumentInfoType) =>
    hideActions ? null : (
      <div className="flex space-x-1 justify-end">
        <UpdateButtonContainer
          id={doc.id}
          onUpdateSuccess={() => onRefresh()}
          showToast={toast}
        />
        <DownloadFileContainer
          id={doc.id}
          fileName={doc.title}
          showToast={toast}
        />
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

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (searchQuery.trim() === '') {
      return mappedDocuments;
    }
    const query = searchQuery.toLowerCase();
    return mappedDocuments.filter(
      (doc) =>
        doc.id.toLowerCase().includes(query) ||
        (doc.title && doc.title.toLowerCase().includes(query))
    );
  }, [searchQuery, mappedDocuments]);

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center mt-12">
          <Loader className="animate-spin" size={64} />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            {/* Column toggle popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button color="light">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <div className="grid gap-4 p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Toggle Columns</h4>
                    <p className="text-sm text-muted-foreground">
                      Select which columns to display in the table.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`column-toggle-${col.key}`}
                          checked={visibleColumns[col.key]}
                          onCheckedChange={(
                            checked: boolean | 'indeterminate'
                          ) => {
                            if (typeof checked === 'boolean') {
                              handleToggleColumn(col.key, checked);
                            }
                          }}
                        />
                        <label
                          htmlFor={`column-toggle-${col.key}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Middle: Search input */}
            <div className="flex-grow mx-4">
              <Input
                placeholder="Search by Title or Document ID"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>

            {/* Right side: Upload and Delete buttons */}
            {!hideActions && (
              <div className="flex space-x-2">
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
                    await onRefresh();
                  }}
                  showToast={toast}
                />
              </div>
            )}
          </div>

          <Table
            data={filteredDocuments}
            columns={columns.filter((col) => visibleColumns[col.key] !== false)}
            onSelectAll={handleSelectAllInternal}
            onSelectItem={handleSelectItemInternal}
            selectedItems={selectedItems}
            actions={renderActions}
            initialSort={sortConfig}
            initialFilters={filters}
            tableHeight="600px"
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onSort={(key, order) => setSortConfig({ key, order })}
            onFilter={(newFilters) => setFilters(newFilters)}
            showPagination={showPagination}
            loading={loading}
            enableColumnToggle={false}
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
