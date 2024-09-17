import { ChevronUpSquare, ChevronDownSquare, Filter } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Pagination from '@/components/ui/pagination';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

interface TableProps<T> {
  items: T[];
  columns: string[];
  itemsPerPage: number;
  maxRows: number;
}

function Table<T extends { id: string }>({
  items,
  columns,
  itemsPerPage,
  maxRows,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCriteria, setFilterCriteria] = useState({
    sort: 'title',
    order: 'asc',
  });
  const [statusFilter, setStatusFilter] = useState({
    success: true,
    failure: true,
    pending: true,
  });

  const filteredItems = useMemo(() => {
    return items
      .filter(
        (item) =>
          ((item as any).ingestion_status?.toLowerCase() === 'success' &&
            statusFilter.success) ||
          ((item as any).ingestion_status?.toLowerCase() === 'failure' &&
            statusFilter.failure) ||
          ((item as any).ingestion_status?.toLowerCase() === 'pending' &&
            statusFilter.pending)
      )
      .sort((a, b) => {
        if (filterCriteria.sort === 'title') {
          return filterCriteria.order === 'asc'
            ? (a as any).title.localeCompare((b as any).title)
            : (b as any).title.localeCompare((a as any).title);
        }
        return 0;
      });
  }, [items, filterCriteria, statusFilter]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const slicedItems = filteredItems.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    const emptyRowsCount = maxRows - slicedItems.length;
    const emptyRows = Array(emptyRowsCount)
      .fill(null)
      .map((_, index) => ({ id: `empty-${index}` }));

    return [...slicedItems, ...emptyRows];
  }, [filteredItems, currentPage, itemsPerPage, maxRows]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="flex flex-col">
      <div
        className="overflow-x-auto"
        style={{ height: `${(maxRows + 1) * 48}px` }}
      >
        <table className="w-full h-full bg-zinc-800 border border-gray-600">
          <thead className="sticky top-0 bg-zinc-800 z-10">
            <tr className="border-b border-gray-600">
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-white text-center">
                  {col === 'title' ? (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">{col}</span>
                      <button
                        onClick={() =>
                          setFilterCriteria({
                            sort: 'title',
                            order:
                              filterCriteria.order === 'asc' ? 'desc' : 'asc',
                          })
                        }
                      >
                        {filterCriteria.order === 'asc' ? (
                          <ChevronUpSquare />
                        ) : (
                          <ChevronDownSquare />
                        )}
                      </button>
                    </div>
                  ) : col === 'ingestion_status' ? (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">{col}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Filter className="h-4 w-4 hover:bg-zinc-500 cursor-pointer" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">
                                Filter by Status
                              </h4>
                            </div>
                            <div className="grid gap-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="filter-success"
                                  checked={statusFilter.success}
                                  onCheckedChange={(checked) =>
                                    setStatusFilter((prev) => ({
                                      ...prev,
                                      success: checked === true,
                                    }))
                                  }
                                />
                                <label htmlFor="filter-success">Success</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="filter-failure"
                                  checked={statusFilter.failure}
                                  onCheckedChange={(checked) =>
                                    setStatusFilter((prev) => ({
                                      ...prev,
                                      failure: checked === true,
                                    }))
                                  }
                                />
                                <label htmlFor="filter-failure">Failure</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="filter-pending"
                                  checked={statusFilter.pending}
                                  onCheckedChange={(checked) =>
                                    setStatusFilter((prev) => ({
                                      ...prev,
                                      pending: checked === true,
                                    }))
                                  }
                                />
                                <label htmlFor="filter-pending">Pending</label>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    col
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr
                key={item.id}
                className={item.id.startsWith('empty-') ? 'h-12' : ''}
              >
                {columns.map((col) => (
                  <td
                    key={`${item.id}-${col}`}
                    className="px-4 py-2 text-white text-center"
                  >
                    {item.id.startsWith('empty-') ? (
                      '\u00A0'
                    ) : col === 'ingestion_status' ? (
                      <Badge
                        variant={
                          (item as any)[col]?.toLowerCase() === 'success'
                            ? 'success'
                            : (item as any)[col]?.toLowerCase() === 'failure'
                              ? 'destructive'
                              : 'default'
                        }
                      >
                        {(item as any)[col]}
                      </Badge>
                    ) : (
                      (item as any)[col]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default Table;
