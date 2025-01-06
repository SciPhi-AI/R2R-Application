// hooks/usePagination.ts
import { useState, useCallback, useEffect } from 'react';

interface UsePaginationProps<T> {
  fetchData: (
    offset: number,
    limit: number
  ) => Promise<{ results: T[]; totalEntries: number }>;
  pageSize: number;
  initialPage?: number;
  key?: string;
  initialPrefetchPages?: number;
  prefetchThreshold?: number;
}

function usePagination<T>({
  fetchData,
  pageSize,
  initialPage = 1,
  key,
  initialPrefetchPages = 0,
  prefetchThreshold = 0,
}: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const { results, totalEntries } = await fetchData(offset, pageSize);
        setData(results);
        setTotalItems(totalEntries);
        setCurrentPage(page);
      } catch (error) {
        console.error(`Error fetching data for page ${page}:`, error);
      } finally {
        setLoading(false);
      }
    },
    [fetchData, pageSize]
  );

  useEffect(() => {
    loadPage(initialPage);
  }, [initialPage, loadPage]);

  const goToPage = useCallback(
    (page: number) => {
      loadPage(page);
    },
    [loadPage]
  );

  return {
    data,
    currentPage,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    totalItems,
    loading,
    goToPage,
  };
}

export default usePagination;
