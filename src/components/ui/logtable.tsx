import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import Pagination from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const LOGS_PER_PAGE = 10;
const COLLAPSIBLE_THRESHOLD = 100;

interface Log {
  id: string;
  run_id: string;
  run_type: string;
  timestamp: string;
  userId: string;
  entries: any[];
  value?: any;
}

interface LogTableProps {
  logs: Log[];
}

const LogTable: React.FC<LogTableProps> = ({ logs }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>(
    {}
  );

  const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE);

  const paginatedLogs = logs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const toggleCell = (logId: string) => {
    setExpandedCells((prev) => ({ ...prev, [logId]: !prev[logId] }));
  };

  const prettifyJSON = (value: any): string => {
    if (typeof value !== 'object') {
      return String(value);
    }
    return JSON.stringify(value, null, 2);
  };

  const renderValue = (log: Log) => {
    const isEmptyArray = Array.isArray(log.value) && log.value.length === 0;
    const isCollapsible =
      !isEmptyArray &&
      ((typeof log.value === 'string' &&
        log.value.length > COLLAPSIBLE_THRESHOLD) ||
        (typeof log.value === 'object' && log.value !== null));
    const prettyValue = prettifyJSON(log.value);

    if (isEmptyArray) {
      return null;
    }

    if (isCollapsible) {
      return (
        <Collapsible open={expandedCells[log.id]}>
          <CollapsibleTrigger
            onClick={() => toggleCell(log.id)}
            className="flex items-center w-full text-left"
          >
            {expandedCells[log.id] ? (
              <ChevronDown className="flex-shrink-0 h-5 w-5" />
            ) : (
              <ChevronRight className="flex-shrink-0 h-5 w-5" />
            )}
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

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/5 text-white">Run ID</TableHead>
            <TableHead className="w-1/5 text-white">Run Type</TableHead>
            <TableHead className="w-1/5 text-white">Timestamp</TableHead>
            <TableHead className="w-1/5 text-white">User ID</TableHead>
            <TableHead className="w-1/5 text-white">Entries</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedLogs.map((log) => (
            <TableRow key={log.run_id}>
              <TableCell>
                {log.run_id
                  ? `${log.run_id.substring(0, 8)}...${log.run_id.slice(-8)}`
                  : 'N/A'}
              </TableCell>
              <TableCell>{log.run_type}</TableCell>
              <TableCell>{log.timestamp}</TableCell>
              <TableCell>
                {log.userId
                  ? `${log.userId.substring(0, 8)}...${log.userId.slice(-8)}`
                  : 'N/A'}
              </TableCell>
              {log.entries && log.entries.length > 0 && (
                <TableCell>
                  {renderValue({ ...log, id: log.run_id, value: log.entries })}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default LogTable;
