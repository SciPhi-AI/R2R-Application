import React, { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input'; // Make sure you have this component
import debounce from '@/lib/debounce';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
  isLoading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const debouncedPageChange = useCallback(
    debounce((page: number) => {
      if (page >= 1 && page <= totalPages && !isLoading) {
        onPageChange(page);
      }
    }, 300),
    [onPageChange, totalPages, isLoading]
  );

  const handlePageChange = (newPage: number) => {
    console.log(`Pagination handlePageChange called with page: ${newPage}`);
    if (newPage >= 1 && newPage <= totalPages && !isLoading) {
      onPageChange(newPage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handleInputBlur = () => {
    const parsedPage = parseInt(inputPage, 10);
    if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= totalPages) {
      handlePageChange(parsedPage);
    } else {
      setInputPage(currentPage.toString());
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <nav className="flex justify-center items-center" aria-label="Pagination">
      <Button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
        color={currentPage <= 1 || isLoading ? 'disabled' : 'filled'}
        className="px-4 py-2 mx-1 w-32"
        aria-label="Previous page"
      >
        &lt; Previous
      </Button>
      <span className="mx-2">Page</span>
      <Input
        type="text"
        value={inputPage}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyPress={handleInputKeyPress}
        className="w-16 mx-2 text-center"
        disabled={isLoading}
      />
      <span className="mx-2">of {totalPages}</span>
      <Button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
        color={currentPage >= totalPages || isLoading ? 'disabled' : 'filled'}
        className="px-4 py-2 mx-1 w-32"
        aria-label="Next page"
      >
        Next &gt;
      </Button>
    </nav>
  );
};

export default Pagination;
