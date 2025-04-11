import { ChevronUpSquare, ChevronDownSquare, Filter } from 'lucide-react';
import React, { useState, useMemo } from 'react';

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
  truncatedSubstring?: boolean;
  copyable?: boolean;
  selected?: boolean;
}

interface TableProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  onSelectAll?: (selected: boolean) => void;
  onSelectItem?: (itemId: string, selected: boolean) => void;
  selectedItems?: string[];
  actions?: (item: T) => React.ReactNode;
  initialSort?: { key: string; order: 'asc' | 'desc' };
  initialFilters?: Record<string, any>;
  filters?: Record<string, any>;
  tableHeight?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  showPagination?: boolean;
  loading: boolean;
  enableColumnToggle?: boolean;
  totalEntries?: number;
  getRowKey?: (item: T) => string | number;
}

function Table<T extends object>({
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
  totalEntries,
  getRowKey = (item: T) => {
    const idKey = 'id' as keyof T;
    const id = item[idKey];
    return id ? id.toString() : Math.random().toString();
  },
}: TableProps<T>) {
  const [sort, setSort] = useState(
    initialSort || { key: '', order: 'asc' as const }
  );
  const [filters, setFilters] = useState(initialFilters || {});

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    Object.entries(filters).forEach(([key, value]) => {
      const column = columns.find((col) => col.key === key);
      if (
        column &&
        value !== undefined &&
        value !== null &&
        value !== '' &&
        ((Array.isArray(value) && value.length > 0) ||
          typeof value === 'string')
      ) {
        result = result.filter((item) => {
          const itemValue = (item as any)[key];
          if (column.filterType === 'multiselect') {
            return value.includes(itemValue?.toLowerCase());
          } else if (column.filterType === 'select') {
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
  const totalPages = totalEntries
    ? Math.ceil(totalEntries / itemsPerPage)
    : Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const currentPageData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // When using filtered data, apply pagination after filtering
    if (Object.keys(filters).length > 0 || sort.key) {
      return filteredAndSortedData.slice(startIndex, endIndex);
    }

    // For unfiltered data, use the entire dataset
    const paginatedData = data.slice(startIndex, endIndex);

    // Ensure uniqueness using getRowKey
    const uniqueData = new Map<string | number, T>();
    paginatedData.forEach((item) => {
      const key = getRowKey(item);
      if (!uniqueData.has(key)) {
        uniqueData.set(key, item);
      }
    });
    return Array.from(uniqueData.values());
  }, [
    data,
    currentPage,
    itemsPerPage,
    filters,
    sort.key,
    filteredAndSortedData,
    getRowKey,
  ]);

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
  };

  const isAllSelected = currentPageData.every((item) =>
    selectedItems.includes(getRowKey(item).toString())
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
      onSelectItem(getRowKey(item).toString(), checked);
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
    } else if (col.truncatedSubstring && typeof content === 'string') {
      const maxLength = 20;
      const truncated =
        content.length > maxLength
          ? `${content.substring(0, maxLength)}...`
          : content;
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
      {/* Remove the column toggle popover as it's now handled in DocumentsTable */}
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
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2 text-white text-center overflow-hidden"
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2 truncate">{col.label}</span>
                    {col.sortable && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger
                            asChild
                            onClick={() => handleSort(col.key)}
                          >
                            <div className="p-1 cursor-pointer">
                              {sort.key === col.key && sort.order === 'asc' ? (
                                <ChevronUpSquare className="h-4 w-4 hover:bg-zinc-500" />
                              ) : (
                                <ChevronDownSquare className="h-4 w-4 hover:bg-zinc-500" />
                              )}
                            </div>
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
              ))}
              {actions && (
                <th className="w-[120px] px-4 py-2 text-white text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentPageData.map((item) => (
              <tr key={getRowKey(item)}>
                {onSelectItem && (
                  <td className="w-[50px] px-4 py-2 text-white text-center">
                    <Checkbox
                      checked={selectedItems.includes(
                        getRowKey(item).toString()
                      )}
                      onCheckedChange={(checked: boolean | 'indeterminate') =>
                        handleSelectItemInternal(item, checked as boolean)
                      }
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-2 text-white text-center overflow-hidden"
                  >
                    <div className="overflow-x-auto whitespace-nowrap">
                      {renderCellContent(item, col)}
                    </div>
                  </td>
                ))}
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
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-2 text-white text-center overflow-hidden"
                  ></td>
                ))}
                {actions && <td></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div>
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
