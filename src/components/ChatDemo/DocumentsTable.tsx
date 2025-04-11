import { Loader, FileSearch2, SlidersHorizontal } from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React, { useState } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import DownloadFileContainer from '@/components/ChatDemo/DownloadFileContainer';
import Table, { Column } from '@/components/ChatDemo/Table';
import { UploadButton } from '@/components/ChatDemo/upload';
import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { IngestionStatus, KGExtractionStatus } from '@/types';

import ExtractButtonContainer from './ExtractContainer';

interface DocumentsTableProps {
  documents: DocumentResponse[];
  loading: boolean;
  onRefresh: () => void;
  pendingDocuments: string[];
  setPendingDocuments: React.Dispatch<React.SetStateAction<string[]>>;
  showPagination?: boolean;
  onSelectAll: (selected: boolean) => void;
  onSelectItem: (itemId: string, selected: boolean) => void;
  selectedItems: string[];
  hideActions?: boolean;
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
  middleContent?: React.ReactNode;
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
  middleContent,
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

  const columns: Column<DocumentResponse>[] = [
    {
      key: 'title',
      label: 'Title',
      truncatedSubstring: true,
      sortable: true,
      copyable: true,
    },
    { key: 'id', label: 'Document ID', truncate: true, copyable: true },
    { key: 'ownerId', label: 'Owner ID', truncate: true, copyable: true },
    {
      key: 'collectionIds',
      label: 'Collection IDs',
      renderCell: (doc) =>
        doc.collectionIds && doc.collectionIds.length > 0
          ? doc.collectionIds.join(', ')
          : 'N/A',
      selected: false,
    },
    {
      key: 'ingestionStatus',
      label: 'Ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending'],
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' = 'pending';
        switch (doc.ingestionStatus) {
          case IngestionStatus.SUCCESS:
            variant = 'success';
            break;
          case IngestionStatus.FAILED:
            variant = 'destructive';
            break;
          case IngestionStatus.PENDING:
            variant = 'pending';
            break;
          case IngestionStatus.PARSING:
            variant = 'pending';
            break;
          case IngestionStatus.EXTRACTING:
            variant = 'pending';
            break;
          case IngestionStatus.CHUNKING:
            variant = 'pending';
            break;
          case IngestionStatus.AUGMENTING:
            variant = 'pending';
            break;
          case IngestionStatus.ENRICHING:
            variant = 'pending';
            break;
          case IngestionStatus.STORING:
            variant = 'pending';
            break;
        }
        return <Badge variant={variant}>{doc.ingestionStatus}</Badge>;
      },
    },
    {
      key: 'extractionStatus',
      label: 'Extraction',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending', 'processing'],
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' = 'pending';
        switch (doc.extractionStatus) {
          case KGExtractionStatus.SUCCESS:
            variant = 'success';
            break;
          case KGExtractionStatus.FAILED:
            variant = 'destructive';
            break;
          case KGExtractionStatus.PENDING:
            variant = 'pending';
            break;
          case KGExtractionStatus.PROCESSING:
            variant = 'pending';
            break;
        }
        return <Badge variant={variant}>{doc.extractionStatus}</Badge>;
      },
    },
    { key: 'documentType', label: 'Type', selected: false },
    {
      key: 'metadata',
      label: 'Metadata',
      renderCell: (doc) => JSON.stringify(doc.metadata),
      selected: false,
    },
    { key: 'version', label: 'Version', selected: false },
    {
      key: 'createdAt',
      label: 'Created At',
      sortable: true,
      renderCell: (doc) => new Date(doc.createdAt).toLocaleString(),
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      renderCell: (doc) => new Date(doc.updatedAt).toLocaleString(),
      selected: false,
    },
  ];

  const renderActions = (doc: DocumentResponse) =>
    hideActions ? null : (
      <div className="flex space-x-1 justify-end">
        <ExtractButtonContainer
          id={doc.id}
          ingestionStatus={doc.ingestionStatus}
          showToast={toast}
        />
        <DownloadFileContainer
          id={doc.id}
          fileName={doc.title ? doc.title : ''}
          showToast={toast}
        />
        <Button
          onClick={() => {
            setSelectedDocumentId(doc.id);
            setIsDocumentInfoDialogOpen(true);
          }}
          color="text_gray"
          disabled={doc.ingestionStatus !== IngestionStatus.SUCCESS}
          shape="slim"
          tooltip="View Document Info"
        >
          <FileSearch2 className="h-6 w-6" />
        </Button>
      </div>
    );

  const displayedDocuments = documents;

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

            {middleContent}

            {/* Right side: Upload and Delete buttons */}
            {!hideActions && (
              <div className="flex space-x-2">
                <UploadButton
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
            data={displayedDocuments}
            columns={columns.filter((col) => visibleColumns[col.key] === true)}
            onSelectAll={handleSelectAllInternal}
            onSelectItem={handleSelectItemInternal}
            selectedItems={selectedItems}
            actions={renderActions}
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
