// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const COLLAPSIBLE_THRESHOLD = 100;
const LOGS_PER_PAGE = 5;

const LogTable = ({ logs }) => {
  const [expandedCells, setExpandedCells] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedLogs, setPaginatedLogs] = useState([]);

  const toggleCell = (rowId) => {
    setExpandedCells((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE);

  useEffect(() => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    const endIndex = startIndex + LOGS_PER_PAGE;
    setPaginatedLogs(logs.slice(startIndex, endIndex));
  }, [currentPage, logs]);

  const truncateValue = (value, maxLength = 50) => {
    if (typeof value === 'string' && value.length > maxLength) {
      return value.substring(0, maxLength) + '...';
    }
    return value;
  };

  const prettifyJSON = (value) => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch (e) {
      return value;
    }
  };

  const renderValue = (value, id) => {
    const isCollapsible =
      typeof value === 'string' && value.length > COLLAPSIBLE_THRESHOLD;
    const prettyValue = prettifyJSON(value);

    if (isCollapsible) {
      return (
        <Collapsible open={expandedCells[id]}>
          <CollapsibleTrigger
            onClick={() => toggleCell(id)}
            className="flex items-center w-full text-left"
          >
            {expandedCells[id] ? (
              <ChevronDown className="mr-2 flex-shrink-0" />
            ) : (
              <ChevronRight className="mr-2 flex-shrink-0" />
            )}
            <span className="truncate">{truncateValue(prettyValue)}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 whitespace-pre-wrap overflow-x-auto text-xs">
              {prettyValue}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      );
    } else {
      return (
        <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
          {prettyValue}
        </pre>
      );
    }
  };

  const renderLogEntries = (log) => {
    if (
      !log.entries ||
      !Array.isArray(log.entries) ||
      log.entries.length === 0
    ) {
      return (
        <TableRow key={`${log.run_id}-no-entries`} className="align-top">
          <TableCell className="w-1/6"></TableCell>
          <TableCell className="w-1/6"></TableCell>
          <TableCell className="w-1/6 pt-3">No entries</TableCell>
          <TableCell className="w-1/2">-</TableCell>
        </TableRow>
      );
    }

    return log.entries.map((entry, index) => (
      <TableRow key={`${log.run_id}-${index}`} className="align-top">
        <TableCell className="w-1/6"></TableCell>
        <TableCell className="w-1/6"></TableCell>
        <TableCell className="w-1/6 pt-3">{entry.key}</TableCell>
        <TableCell className="w-1/2">
          {renderValue(entry.value, `${log.run_id}-${index}`)}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/6">Run ID</TableHead>
            <TableHead className="w-1/6">Run Type</TableHead>
            <TableHead className="w-1/6">Key</TableHead>
            <TableHead className="w-1/2">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedLogs.map((log) => (
            <React.Fragment key={log.run_id}>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={4} className="font-semibold">
                  Run ID: {log.run_id} ({log.run_type || 'N/A'})
                </TableCell>
              </TableRow>
              {renderLogEntries(log)}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          onClick={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LogTable;
