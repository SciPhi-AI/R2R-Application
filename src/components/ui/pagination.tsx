import React from 'react';

import { Button } from '@/components/ui/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const isPreviousDisabled = safeCurrentPage <= 1;
  const isNextDisabled = safeCurrentPage >= totalPages;

  return (
    <nav
      className="flex justify-center items-center mt-4"
      aria-label="Pagination"
    >
      <Button
        onClick={() => onPageChange(safeCurrentPage - 1)}
        disabled={isPreviousDisabled}
        color={isPreviousDisabled ? 'disabled' : 'filled'}
        className="px-4 py-2 mx-1 w-32"
        aria-label="Previous page"
      >
        &lt; Previous
      </Button>
      <span className="mx-2">
        Page {safeCurrentPage} of {Math.max(1, totalPages)}
      </span>
      <Button
        onClick={() => onPageChange(safeCurrentPage + 1)}
        disabled={isNextDisabled}
        color={isNextDisabled ? 'disabled' : 'filled'}
        className="px-4 py-2 mx-1 w-32"
        aria-label="Next page"
      >
        Next &gt;
      </Button>
    </nav>
  );
};

export default Pagination;
