import {
  ChevronUpSquare,
  ChevronDownSquare,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import CopyableContent from '@/components/ui/CopyableContent';
import Pagination from '@/components/ui/pagination';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'multiselect';
  filterOptions?: string[];
  renderCell?: (item: T) => React.ReactNode;
  truncate?: boolean;
  copyable?: boolean;
  selected?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  onSelectAll?: (selected: boolean) => void;
  onSelectItem?: (itemId: string, selected: boolean) => void;
  selectedItems?: string[];
  actions?: (item: T) => React.ReactNode;
  initialSort?: { key: string; order: 'asc' | 'desc' };
  initialFilters?: Record<string, any>;
  tableHeight?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  showPagination?: boolean;
  loading: boolean;
  enableColumnToggle?: boolean;
}

function Table<T extends { [key: string]: any }>({
  data,
  columns,
  itemsPerPage = 10,
  onSelectAll,
  onSelectItem,
  selectedItems = [],
  actions,
  initialSort,
  initialFilters,
  tableHeight = '600px',
  currentPage,
  onPageChange,
  onSort,
  onFilter,
  showPagination = true,
  loading,
  enableColumnToggle = true,
}: TableProps<T>) {
  const [sort, setSort] = useState(
    initialSort || { key: '', order: 'asc' as const }
  );
  const [filters, setFilters] = useState(initialFilters || {});
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    Object.fromEntries(columns.map((col) => [col.key, col.selected !== false]))
  );

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter((item) => {
          const itemValue = (item as any)[key];
          const column = columns.find((col) => col.key === key);
          if (column?.filterType === 'multiselect') {
            return (value as string[]).includes(itemValue);
          } else if (column?.filterType === 'select') {
            return itemValue === value;
          } else if (typeof value === 'string') {
            return itemValue
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (sort.key) {
      result.sort((a, b) => {
        const aValue = (a as any)[sort.key];
        const bValue = (b as any)[sort.key];
        if (aValue < bValue) {
          return sort.order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sort.order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, filters, sort, columns]);

  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentPageData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const handlePageChangeInternal = (page: number) => {
    if (page >= 1 && page <= totalPages && !loading) {
      onPageChange(page);
    }
  };

  const handleSort = (key: string) => {
    const newSort: { key: string; order: 'asc' | 'desc' } = {
      key,
      order: sort.key === key && sort.order === 'asc' ? 'desc' : 'asc',
    };
    setSort(newSort);
    if (onSort) {
      onSort(newSort.key, newSort.order);
    }
  };

  const handleFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
    onPageChange(1);
  };

  const isAllSelected = currentPageData.every((item) =>
    selectedItems.includes(item.id)
  );

  const handleSelectAllInternal = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const handleSelectItemInternal = (
    item: T,
    checked: boolean | 'indeterminate'
  ) => {
    if (onSelectItem && typeof checked === 'boolean') {
      onSelectItem(item.id, checked);
    }
  };

  const renderCellContent = (item: T, col: Column<T>) => {
    if (col.renderCell) {
      return col.renderCell(item);
    }
    const content = (item as any)[col.key];
    if (col.truncate && typeof content === 'string') {
      const truncated = `${content.substring(0, 8)}...${content.slice(-4)}`;
      return col.copyable ? (
        <CopyableContent content={content} truncated={truncated} />
      ) : (
        truncated
      );
    }
    return content;
  };

  const visibleRowsCount = currentPageData.length;
  const emptyRowsCount = Math.max(0, itemsPerPage - visibleRowsCount);

  return (
    <div className="flex flex-col h-full">
      {enableColumnToggle && (
        <div className="flex justify-between items-center mb-4">
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
                    <div key={col.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-toggle-${col.key}`}
                        checked={visibleColumns[col.key]}
                        onCheckedChange={(
                          checked: boolean | 'indeterminate'
                        ) => {
                          if (typeof checked === 'boolean') {
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [col.key]: checked,
                            }));
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
        </div>
      )}

      <div
        className="overflow-x-auto"
        style={{ height: tableHeight, maxWidth: '100%' }}
      >
        <table className="w-full bg-zinc-800 border border-gray-600">
          <thead className="sticky top-0 bg-zinc-800 z-10">
            <tr className="border-b border-gray-600">
              {onSelectAll && (
                <th className="w-[50px] px-4 py-2 text-white text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAllInternal}
                    disabled={currentPageData.length === 0}
                  />
                </th>
              )}
              {columns.map((col) =>
                visibleColumns[col.key] ? (
                  <th
                    key={col.key}
                    className="px-4 py-2 text-white text-center overflow-hidden"
                  >
                    <div className="flex items-center justify-center">
                      <span className="mr-2 truncate">{col.label}</span>
                      {col.sortable && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <button
                                onClick={() => handleSort(col.key)}
                                className="p-1"
                              >
                                {sort.key === col.key &&
                                sort.order === 'asc' ? (
                                  <ChevronUpSquare className="h-4 w-4 hover:bg-zinc-500 cursor-pointer" />
                                ) : (
                                  <ChevronDownSquare className="h-4 w-4 hover:bg-zinc-500 cursor-pointer" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Sort by {col.label}{' '}
                                {sort.order === 'asc'
                                  ? 'Descending'
                                  : 'Ascending'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {col.filterable && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Filter className="h-4 w-4 hover:bg-zinc-500 cursor-pointer ml-2" />
                          </PopoverTrigger>
                          <PopoverContent className="w-80 z-50">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">
                                  Filter by {col.label}
                                </h4>
                              </div>
                              {col.filterType === 'multiselect' ? (
                                <div className="space-y-2">
                                  {col.filterOptions?.map((option) => (
                                    <div
                                      key={option}
                                      className="flex items-center"
                                    >
                                      <Checkbox
                                        id={`filter-${col.key}-${option}`}
                                        checked={(
                                          filters[col.key] || []
                                        ).includes(option)}
                                        onCheckedChange={(
                                          checked: boolean | 'indeterminate'
                                        ) => {
                                          const currentFilters =
                                            filters[col.key] || [];
                                          const newFilters =
                                            checked === true
                                              ? [...currentFilters, option]
                                              : currentFilters.filter(
                                                  (f: string) => f !== option
                                                );
                                          handleFilter(col.key, newFilters);
                                        }}
                                      />
                                      <label
                                        htmlFor={`filter-${col.key}-${option}`}
                                        className="ml-2 text-sm"
                                      >
                                        {option}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              ) : col.filterType === 'select' ? (
                                <select
                                  value={filters[col.key] || ''}
                                  onChange={(e) =>
                                    handleFilter(col.key, e.target.value)
                                  }
                                  className="w-full p-2 border rounded"
                                >
                                  <option value="">All</option>
                                  {col.filterOptions?.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder={`Filter ${col.label}...`}
                                  value={filters[col.key] || ''}
                                  onChange={(e) =>
                                    handleFilter(col.key, e.target.value)
                                  }
                                  className="w-full p-2 border rounded"
                                />
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </th>
                ) : null
              )}
              {actions && (
                <th className="w-[120px] px-4 py-2 text-white text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentPageData.map((item) => (
              <tr key={item.id}>
                {onSelectItem && (
                  <td className="w-[50px] px-4 py-2 text-white text-center">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked: boolean | 'indeterminate') =>
                        handleSelectItemInternal(item, checked as boolean)
                      }
                    />
                  </td>
                )}
                {columns.map((col) =>
                  visibleColumns[col.key] ? (
                    <td
                      key={col.key}
                      className="px-4 py-2 text-white text-center overflow-hidden"
                    >
                      <div className="overflow-x-auto whitespace-nowrap">
                        {renderCellContent(item, col)}
                      </div>
                    </td>
                  ) : null
                )}
                {actions && (
                  <td className="w-[110px] px-4 py-2 text-white text-right">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
            {Array.from({ length: emptyRowsCount }).map((_, index) => (
              <tr key={`empty-${index}`} style={{ height: '50px' }}>
                {onSelectItem && <td></td>}
                {columns.map((col) =>
                  visibleColumns[col.key] ? <td key={col.key}></td> : null
                )}
                {actions && <td></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChangeInternal}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
}

export type { TableProps };
export default Table;
