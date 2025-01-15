import { Loader, FileSearch2, SlidersHorizontal } from 'lucide-react';
import { DocumentResponse } from 'r2r-js';
import React, { useState } from 'react';

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
import { IngestionStatus, KGExtractionStatus } from '@/types';

import ExtractButtonContainer from './ExtractContainer';

interface DocumentsTableProps {
  documents: DocumentResponse[];
  loading: boolean;

  // ------------------ NEW PROP ------------------
  // If true, we have existing data but are fetching updated info
  isRefetching?: boolean;

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
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  loading,
  isRefetching,
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

  const handleRefreshWithDelay = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait 2.5s
    onRefresh();
  };

  const columns: Column<DocumentResponse>[] = [
    {
      key: 'title',
      label: 'Title',
      truncatedSubstring: true,
      copyable: true,
      headerTooltip: 'The title of the document',
    },
    {
      key: 'id',
      label: 'Document ID',
      truncate: true,
      copyable: true,
      headerTooltip: 'The document ID, used to uniquely identify the document',
    },
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
      label: 'Ingestion Status',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending', 'enriched'],
      headerTooltip: 'The status of the document ingestion',
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' | 'enriched' =
          'pending';
        switch (doc.ingestionStatus) {
          case IngestionStatus.SUCCESS:
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
        return <Badge variant={variant}>{doc.ingestionStatus}</Badge>;
      },
    },
    {
      key: 'extractionStatus',
      label: 'Extraction Status',
      headerTooltip:
        'The status of the document extraction, which follows ingestion',
      filterable: true,
      filterType: 'multiselect',
      filterOptions: ['success', 'failed', 'pending', 'processing', 'enriched'],
      renderCell: (doc) => {
        let variant: 'success' | 'destructive' | 'pending' = 'pending';
        switch (doc.extractionStatus) {
          case KGExtractionStatus.SUCCESS:
          case KGExtractionStatus.ENRICHED:
            variant = 'success';
            break;
          case KGExtractionStatus.FAILED:
            variant = 'destructive';
            break;
          case KGExtractionStatus.PENDING:
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
    {
      key: 'summary',
      label: 'Summary',
      truncatedSubstring: true,
      selected: true,
    },
  ];

  const renderActions = (doc: DocumentResponse) =>
    hideActions ? null : (
      <div className="flex space-x-1 justify-end">
        {/* Example: re-enable if your API supports updating */}
        {/* <UpdateButtonContainer
          id={doc.id}
          onUpdateSuccess={() => onRefresh()}
          showToast={toast}
        /> */}
        {/* <ExtractButtonContainer
          id={doc.id}
          ingestionStatus={doc.ingestionStatus}
          showToast={toast}
        /> */}
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
          disabled={
            doc.ingestionStatus !== IngestionStatus.SUCCESS &&
            doc.ingestionStatus !== IngestionStatus.ENRICHED
          }
          shape="slim"
          tooltip="View Document Info"
        >
          <FileSearch2 className="h-6 w-6" />
        </Button>
      </div>
    );

  return (
    <div>
      {/* If we're truly loading for the first time and have no docs */}
      {loading && documents.length === 0 ? (
        <div className="flex justify-center items-center mt-12">
          <Loader className="animate-spin" size={64} />
        </div>
      ) : (
        <>
          {/* Show a subtle "Refreshing..." message if we do have data and are refetching */}
          {isRefetching && documents.length > 0 && (
            <div className="mb-2 text-sm text-gray-400">Refreshing data...</div>
          )}

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
                          onCheckedChange={(checked) => {
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Right side: Upload and Delete buttons */}
            {!hideActions && (
              <div className="flex space-x-2">
                <UploadButton
                  setUploadedDocuments={() => {}}
                  onUploadSuccess={async () => {
                    await handleRefreshWithDelay();
                    onSelectAll(false);
                    await handleRefreshWithDelay();
                    await handleRefreshWithDelay();
                    await handleRefreshWithDelay();
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
                    // small delay
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    await onRefresh();
                  }}
                  showToast={toast}
                />
              </div>
            )}
          </div>

          <Table
            data={documents}
            columns={columns.filter((col) => visibleColumns[col.key] === true)}
            onSelectAll={handleSelectAllInternal}
            onSelectItem={handleSelectItemInternal}
            selectedItems={selectedItems}
            actions={renderActions}
            initialFilters={{}}
            tableHeight="600px"
            currentPage={currentPage}
            onPageChange={(page) => onPageChange?.(page)}
            maxLength={15}
            itemsPerPage={10}
            showPagination={showPagination}
            loading={loading}
            enableColumnToggle={false}
            totalEntries={Math.max(10, totalEntries || 0)}
            emptyTableText="No data available, try ingesting a document first."
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

// import { Loader, FileSearch2, SlidersHorizontal } from 'lucide-react';
// import { DocumentResponse } from 'r2r-js';
// import React, { useState, useMemo } from 'react';

// import { DeleteButton } from '@/components/ChatDemo/deleteButton';
// import DownloadFileContainer from '@/components/ChatDemo/DownloadFileContainer';
// import Table, { Column } from '@/components/ChatDemo/Table';
// import UpdateButtonContainer from '@/components/ChatDemo/UpdateButtonContainer';
// import { UploadButton } from '@/components/ChatDemo/upload';
// import DocumentInfoDialog from '@/components/ChatDemo/utils/documentDialogInfo';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/Button';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Input } from '@/components/ui/input';
// import {
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
// } from '@/components/ui/popover';
// import { useToast } from '@/components/ui/use-toast';
// import { IngestionStatus, KGExtractionStatus } from '@/types';

// import ExtractButtonContainer from './ExtractContainer';

// interface DocumentsTableProps {
//   documents: DocumentResponse[];
//   loading: boolean;
//   onRefresh: () => void;
//   pendingDocuments: string[];
//   setPendingDocuments: React.Dispatch<React.SetStateAction<string[]>>;
//   showPagination?: boolean;
//   onSelectAll: (selected: boolean) => void;
//   onSelectItem: (itemId: string, selected: boolean) => void;
//   selectedItems: string[];
//   hideActions?: boolean;
//   visibleColumns: Record<string, boolean>;
//   onToggleColumn: (columnKey: string, isVisible: boolean) => void;
//   totalEntries?: number;
//   currentPage?: number;
//   onPageChange?: (page: number) => void;
//   itemsPerPage: number;
//   filters: Record<string, any>;
//   onFiltersChange: (filters: Record<string, any>) => void;
//   searchQuery: string;
//   onSearchQueryChange: (query: string) => void;
// }

// const DocumentsTable: React.FC<DocumentsTableProps> = ({
//   documents,
//   loading,
//   onRefresh,
//   pendingDocuments,
//   setPendingDocuments,
//   showPagination = true,
//   onSelectAll,
//   onSelectItem,
//   selectedItems,
//   hideActions = false,
//   visibleColumns,
//   onToggleColumn,
//   totalEntries,
//   currentPage = 1,
//   onPageChange,
// }) => {
//   const { toast } = useToast();
//   const [selectedDocumentId, setSelectedDocumentId] = useState('');
//   const [isDocumentInfoDialogOpen, setIsDocumentInfoDialogOpen] =
//     useState(false);
//   const [searchQuery, setSearchQuery] = useState('');

//   const handleSelectAllInternal = (selected: boolean) => {
//     onSelectAll(selected);
//   };

//   const handleSelectItemInternal = (itemId: string, selected: boolean) => {
//     onSelectItem(itemId, selected);
//   };

//   const handleRefreshWithDelay = async () => {
//     await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait for 2.5 second
//     onRefresh();
//   };

//   const columns: Column<DocumentResponse>[] = [
//     {
//       key: 'title',
//       label: 'Title',
//       truncatedSubstring: true,
//       // sortable: true,
//       copyable: true,
//       headerTooltip: 'The title of the document',
//     },
//     {
//       key: 'id',
//       label: 'Document ID',
//       truncate: true,
//       copyable: true,
//       headerTooltip: 'The document ID, used to uniquely identify the document',
//     },
//     // { key: 'ownerId', label: 'Owner ID', truncate: true, copyable: true },
//     {
//       key: 'collectionIds',
//       label: 'Collection IDs',
//       renderCell: (doc) =>
//         doc.collectionIds && doc.collectionIds.length > 0
//           ? doc.collectionIds.join(', ')
//           : 'N/A',
//       selected: false,
//     },
//     {
//       key: 'ingestionStatus',
//       label: 'Ingestion Status',
//       filterable: true,
//       filterType: 'multiselect',
//       filterOptions: ['success', 'failed', 'pending', 'enriched'],
//       headerTooltip: 'The status of the document ingestion',
//       renderCell: (doc) => {
//         let variant: 'success' | 'destructive' | 'pending' | 'enriched' =
//           'pending';
//         switch (doc.ingestionStatus) {
//           case IngestionStatus.SUCCESS:
//             variant = 'success';
//             break;
//           case IngestionStatus.ENRICHED:
//             variant = 'success';
//             break;
//           case IngestionStatus.FAILED:
//             variant = 'destructive';
//             break;
//           case IngestionStatus.PENDING:
//             variant = 'pending';
//             break;
//         }
//         return <Badge variant={variant}>{doc.ingestionStatus}</Badge>;
//       },
//     },
//     {
//       key: 'extractionStatus',
//       label: 'Extraction Status',
//       headerTooltip:
//         'The status of the document extraction, which follows ingestion',
//       filterable: true,
//       filterType: 'multiselect',
//       filterOptions: ['success', 'failed', 'pending', 'processing', 'enriched'],
//       renderCell: (doc) => {
//         let variant: 'success' | 'destructive' | 'pending' = 'pending';
//         switch (doc.extractionStatus) {
//           case KGExtractionStatus.SUCCESS:
//             variant = 'success';
//             break;
//           case KGExtractionStatus.ENRICHED:
//             variant = 'success';
//             break;
//           case KGExtractionStatus.FAILED:
//             variant = 'destructive';
//             break;
//           case KGExtractionStatus.PENDING:
//             variant = 'pending';
//             break;
//           case KGExtractionStatus.PROCESSING:
//             variant = 'pending';
//             break;
//         }
//         return <Badge variant={variant}>{doc.extractionStatus}</Badge>;
//       },
//     },
//     { key: 'documentType', label: 'Type', selected: false },
//     {
//       key: 'metadata',
//       label: 'Metadata',
//       renderCell: (doc) => JSON.stringify(doc.metadata),
//       selected: false,
//     },
//     { key: 'version', label: 'Version', selected: false },
//     {
//       key: 'createdAt',
//       label: 'Created At',
//       sortable: true,
//       renderCell: (doc) => new Date(doc.createdAt).toLocaleString(),
//       // truncatedSubstring: true,
//     },
//     {
//       key: 'updatedAt',
//       label: 'Updated At',
//       sortable: true,
//       renderCell: (doc) => new Date(doc.updatedAt).toLocaleString(),
//       selected: false,
//     },
//   ];

//   const renderActions = (doc: DocumentResponse) =>
//     hideActions ? null : (
//       <div className="flex space-x-1 justify-end">
//         {/* TODO: Add this back once the API supports it
//         <UpdateButtonContainer
//           id={doc.id}
//           onUpdateSuccess={() => onRefresh()}
//           showToast={toast}
//         /> */}
//         {/* <ExtractButtonContainer
//           id={doc.id}
//           ingestionStatus={doc.ingestionStatus}
//           showToast={toast}
//         /> */}
//         <DownloadFileContainer
//           id={doc.id}
//           fileName={doc.title ? doc.title : ''}
//           showToast={toast}
//         />
//         <Button
//           onClick={() => {
//             setSelectedDocumentId(doc.id);
//             setIsDocumentInfoDialogOpen(true);
//           }}
//           color="text_gray"
//           disabled={
//             doc.ingestionStatus !== IngestionStatus.SUCCESS &&
//             doc.ingestionStatus !== IngestionStatus.ENRICHED
//           }
//           shape="slim"
//           tooltip="View Document Info"
//         >
//           <FileSearch2 className="h-6 w-6" />
//         </Button>
//       </div>
//     );

//   // Client-side search filtering
//   // const filteredDocuments = useMemo(() => {
//   //   if (!searchQuery.trim()) {
//   //     return documents;
//   //   }
//   //   const query = searchQuery.toLowerCase();
//   //   return documents.filter(
//   //     (doc) =>
//   //       doc.title?.toLowerCase().includes(query) ||
//   //       doc.id.toLowerCase().includes(query)
//   //   );
//   // }, [searchQuery, documents]);
//   const displayedDocuments = documents; // no filtering

//   return (
//     <div>
//       {loading && documents.length == 0 ? (
//         <div className="flex justify-center items-center mt-12">
//           <Loader className="animate-spin" size={64} />
//         </div>
//       ) : (
//         <>
//           <div className="flex justify-between items-center mb-4">
//             {/* Column toggle popover */}
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button color="light">
//                   <SlidersHorizontal className="h-4 w-4" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent align="start">
//                 <div className="grid gap-4 p-4">
//                   <div className="space-y-2">
//                     <h4 className="font-medium leading-none">Toggle Columns</h4>
//                     <p className="text-sm text-muted-foreground">
//                       Select which columns to display in the table.
//                     </p>
//                   </div>
//                   <div className="grid gap-2">
//                     {columns.map((col) => (
//                       <div
//                         key={col.key}
//                         className="flex items-center space-x-2"
//                       >
//                         <Checkbox
//                           id={`column-toggle-${col.key}`}
//                           checked={visibleColumns[col.key]}
//                           onCheckedChange={(
//                             checked: boolean | 'indeterminate'
//                           ) => {
//                             if (typeof checked === 'boolean') {
//                               onToggleColumn(col.key, checked);
//                             }
//                           }}
//                         />
//                         <label
//                           htmlFor={`column-toggle-${col.key}`}
//                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                         >
//                           {col.label}
//                         </label>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </PopoverContent>
//             </Popover>

//             {/* Middle: Search input */}
//             <div className="flex-grow mx-4">
//               <Input
//                 placeholder="Search by Title or Document ID"
//                 value={searchQuery}
//                 onChange={(e) => {
//                   setSearchQuery(e.target.value);
//                 }}
//               />
//             </div>

//             {/* Right side: Upload and Delete buttons */}
//             {!hideActions && (
//               <div className="flex space-x-2">
//                 <UploadButton
//                   setUploadedDocuments={() => {}}
//                   onUploadSuccess={async () => {
//                     await handleRefreshWithDelay();
//                     onSelectAll(false);
//                     return [];
//                   }}
//                   showToast={toast}
//                   setPendingDocuments={setPendingDocuments}
//                   setCurrentPage={() => {}}
//                   documentsPerPage={10}
//                 />
//                 <DeleteButton
//                   selectedDocumentIds={selectedItems}
//                   onDelete={() => onSelectAll(false)}
//                   onSuccess={async () => {
//                     // # sleep one second
//                     // await new Promise((resolve) => setTimeout(resolve, 1500));
//                     // await onRefresh();
//                     console.log("handling refresh...")
//                     await handleRefreshWithDelay();
//                     console.log("handling refresh...")
//                     await handleRefreshWithDelay();
//                     onSelectAll(false);

//                   }}
//                   showToast={toast}
//                 />
//               </div>
//             )}
//           </div>

//           <Table
//             data={displayedDocuments}
//             columns={columns.filter((col) => visibleColumns[col.key] === true)}
//             onSelectAll={handleSelectAllInternal}
//             onSelectItem={handleSelectItemInternal}
//             selectedItems={selectedItems}
//             actions={renderActions}
//             initialFilters={{}}
//             tableHeight="600px"
//             currentPage={currentPage}
//             onPageChange={(page) => {
//               if (onPageChange) {
//                 onPageChange(page);
//               }
//             }}
//             maxLength={15}
//             itemsPerPage={10}
//             showPagination={showPagination}
//             loading={loading}
//             enableColumnToggle={false}
//             totalEntries={Math.max(10, totalEntries || 0)}
//             emptyTableText={
//               'No data available, try ingesting a document first.'
//             }
//           />
//         </>
//       )}

//       {selectedDocumentId && (
//         <DocumentInfoDialog
//           id={selectedDocumentId}
//           open={isDocumentInfoDialogOpen}
//           onClose={() => {
//             setIsDocumentInfoDialogOpen(false);
//             setSelectedDocumentId('');
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default DocumentsTable;
