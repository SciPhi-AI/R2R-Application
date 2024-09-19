import { useState, useEffect, useCallback, useRef } from 'react';

interface PaginationResponse<T> {
  results: T[];
  total_entries: number;
}

interface UsePaginationProps<T> {
  key: string; // Unique key to identify the data source (e.g., document ID)
  fetchData: (offset: number, limit: number) => Promise<PaginationResponse<T>>;
  initialPage?: number;
  pageSize?: number;
  initialPrefetchPages?: number;
  prefetchThreshold?: number;
  includeUpdateData?: boolean;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  data: T[];
  loading: boolean;
  prefetching: boolean;
  goToPage: (page: number) => void;
  updateData?: (newData: T[], newTotalEntries: number) => void;
}

const usePagination = <T>({
  key,
  fetchData,
  initialPage = 1,
  pageSize = 10,
  initialPrefetchPages = 5,
  prefetchThreshold = 2,
  includeUpdateData = false,
}: UsePaginationProps<T> & {
  includeUpdateData?: boolean;
}): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [buffer, setBuffer] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefetching, setPrefetching] = useState(false);

  // To track in-flight fetches and prevent duplicates
  const inFlightFetches = useRef<Set<number>>(new Set());

  // Calculate total pages based on total entries
  const calculateTotalPages = useCallback(
    (total: number) => Math.max(1, Math.ceil(total / pageSize)),
    [pageSize]
  );

  // Fetch a page of data
  const fetchPage = useCallback(
    async (offset: number, limit: number, isPrefetch: boolean = false) => {
      if (inFlightFetches.current.has(offset)) {
        // Already fetching this offset
        return;
      }

      try {
        if (isPrefetch) {
          setPrefetching(true);
        } else {
          setLoading(true);
        }

        // Mark this offset as being fetched
        inFlightFetches.current.add(offset);

        const response = await fetchData(offset, limit);

        setBuffer((prev) => [
          ...prev,
          ...(Array.isArray(response.results) ? response.results : []),
        ]);

        if (response.total_entries !== undefined) {
          setTotalEntries(response.total_entries);
          setTotalPages(calculateTotalPages(response.total_entries));
        }
      } catch (error) {
        console.error(`Error fetching data at offset ${offset}:`, error);
        // Optionally handle errors (e.g., show a toast notification)
      } finally {
        // Remove the offset from in-flight fetches
        inFlightFetches.current.delete(offset);

        if (isPrefetch) {
          setPrefetching(false);
        } else {
          setLoading(false);
        }
      }
    },
    [fetchData, calculateTotalPages]
  );

  // Prefetch next data based on current page
  const prefetchNextData = useCallback(async () => {
    // Check if we've already fetched all available data
    if (buffer.length >= totalEntries) {
      return; // All data fetched, no need to prefetch more
    }

    const nextPage = currentPage + 1;
    const requiredEntries = nextPage * pageSize;

    if (
      buffer.length >= requiredEntries + prefetchThreshold * pageSize ||
      buffer.length >= totalEntries
    ) {
      // Buffer is sufficient; no need to prefetch
      return;
    }

    const offset = buffer.length;
    const limit = pageSize * initialPrefetchPages;

    await fetchPage(offset, limit, true);
  }, [
    currentPage,
    pageSize,
    prefetchThreshold,
    buffer.length,
    fetchPage,
    initialPrefetchPages,
    totalEntries,
  ]);

  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };

  // Update data buffer and pagination state
  const updateData = useCallback(
    (newData: T[], newTotalEntries: number) => {
      setBuffer(newData);
      setTotalEntries(newTotalEntries);
      setTotalPages(calculateTotalPages(newTotalEntries));
    },
    [calculateTotalPages]
  );

  // Reset pagination state when the key changes
  useEffect(() => {
    setCurrentPage(initialPage);
    setTotalEntries(0);
    setTotalPages(1);
    setBuffer([]);
    inFlightFetches.current.clear();
  }, [key, initialPage]);

  // Initial fetch when hook mounts or key changes
  useEffect(() => {
    const initialize = async () => {
      const offset = 0;
      const limit = pageSize * initialPrefetchPages;
      await fetchPage(offset, limit);
    };
    initialize();
  }, [fetchPage, pageSize, initialPrefetchPages, key]);

  // Prefetch next data after initial fetch
  useEffect(() => {
    if (totalEntries > 0) {
      prefetchNextData();
    }
  }, [totalEntries, prefetchNextData]);

  // Prefetch when current page changes
  useEffect(() => {
    prefetchNextData();
  }, [currentPage, prefetchNextData]);

  // Get data for current page
  const data = buffer.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return {
    currentPage,
    totalPages,
    data,
    loading,
    prefetching,
    goToPage,
    ...(includeUpdateData ? { updateData } : {}),
  };
};

export default usePagination;
