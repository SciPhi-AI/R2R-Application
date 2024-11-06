import { Loader, FileSearch2, SlidersHorizontal } from 'lucide-react';
import React, { useState, useMemo } from 'react';

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
import { IngestionStatus, KGExtractionStatus, DocumentInfoType } from '@/types';

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
  totalEntries?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage: number;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
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
  visibleColumns,
  onToggleColumn,
  totalEntries,
  currentPage = 1,
  onPageChange,
}) => {
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      filterOptions: ['success', 'failed', 'pending', 'enriched'],
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' | 'enriched' =
          'pending';
        switch (doc.ingestion_status) {
          case IngestionStatus.SUCCESS:
            variant = 'success';
            break;
          case IngestionStatus.ENRICHED:
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
          case KGExtractionStatus.SUCCESS:
            variant = 'success';
            break;
          case KGExtractionStatus.FAILED:
            variant = 'destructive';
            break;
          case KGExtractionStatus.PENDING:
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
          disabled={
            doc.ingestion_status !== IngestionStatus.SUCCESS &&
            doc.ingestion_status !== IngestionStatus.ENRICHED
          }
          shape="slim"
          tooltip="View Document Info"
        >
          <FileSearch2 className="h-6 w-6" />
        </Button>
      </div>
    );

  // Client-side search filtering
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) {
      return documents;
    }
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title?.toLowerCase().includes(query) ||
        doc.id.toLowerCase().includes(query)
    );
  }, [searchQuery, documents]);

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
                              onToggleColumn(col.key, checked);
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
            columns={columns.filter((col) => visibleColumns[col.key] === true)}
            onSelectAll={handleSelectAllInternal}
            onSelectItem={handleSelectItemInternal}
            selectedItems={selectedItems}
            actions={renderActions}
            initialSort={{ key: 'title', order: 'asc' }}
            initialFilters={{}}
            tableHeight="600px"
            currentPage={currentPage}
            onPageChange={(page) => {
              if (onPageChange) {
                onPageChange(page);
              }
            }}
            itemsPerPage={10}
            showPagination={showPagination}
            loading={loading}
            enableColumnToggle={false}
            totalEntries={totalEntries}
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
