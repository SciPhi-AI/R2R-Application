import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import Layout from '@/components/Layout';
import Pagination from '@/components/ui/altPagination';
import BarChart from '@/components/ui/BarChart';
import { InfoIcon } from '@/components/ui/InfoIcon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserContext } from '@/context/UserContext';

import { R2RClient } from '../../../r2r-ts-client';
import {
  R2RAnalyticsRequest,
  FilterCriteria,
  AnalysisTypes,
} from '../../../r2r-ts-client/models';

type FilterDisplayNameKeys =
  | 'search_latency'
  | 'search_metrics'
  | 'rag_generation_latency'
  | 'error';

const filterDisplayNames: Record<FilterDisplayNameKeys, string> = {
  search_latency: 'Search Latency',
  search_metrics: 'Search Metrics',
  rag_generation_latency: 'RAG Latency',
  error: 'Errors',
};

const MetricCard: React.FC<{
  title: FilterDisplayNameKeys;
  metrics: Record<string, number | string> | undefined;
}> = ({ title, metrics }) => {
  const defaultMetrics = {
    count: 'N/A',
    mean: 'N/A',
    std: 'N/A',
    min: 'N/A',
    max: 'N/A',
  };

  const displayMetrics = metrics || defaultMetrics;

  return (
    <div className="bg-zinc-800 rounded-lg shadow-lg p-6 m-4">
      <div className="flex justify-center items-center mb-4">
        <h6 className="text-lg font-bold text-blue-500">
          {filterDisplayNames[title] || title} Metrics
        </h6>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon width="w-5" height="h-5" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Aggregate statistics around your data.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {Object.entries(displayMetrics).map(([metric, value]) => (
        <div key={metric} className="flex justify-between">
          <span className="font-bold text-blue-500">{metric}:</span>
          <span className="text-white pr-2">
            {value !== null && value !== undefined ? value : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
};

const PercentileCard: React.FC<{
  title: FilterDisplayNameKeys;
  percentiles: Record<string, number | string> | undefined;
}> = ({ title, percentiles }) => {
  const defaultPercentiles = {
    p10: 'N/A',
    p25: 'N/A',
    p50: 'N/A',
    p90: 'N/A',
  };

  const displayPercentiles = percentiles || defaultPercentiles;

  return (
    <div className="bg-zinc-800 rounded-lg shadow-lg p-6 m-4">
      <div className="flex justify-center items-center mb-4">
        <h6 className="text-lg font-bold text-blue-500">
          {filterDisplayNames[title] || title} Percentiles
        </h6>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Shows the values below which a given percentage of observations
                in your data fall.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {Object.entries(displayPercentiles).map(([percentile, value]) => (
        <div key={percentile} className="flex justify-between">
          <span className="font-bold text-blue-500">
            {percentile}th Percentile:
          </span>
          <span className="text-white pr-2">
            {value !== null && value !== undefined ? value : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
};

const AnalyticsTable: React.FC<{ data: any[]; filterKey: string }> = ({
  data,
  filterKey,
}) => {
  const maxLogs = 5; // Set the maximum number of logs to display

  const renderLogRows = () => {
    const rows = [];
    for (let i = 0; i < maxLogs; i++) {
      const entry = data[i];
      if (entry) {
        rows.push(
          <tr key={i}>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '200px' }}
              >
                {entry.log_id}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '200px' }}
              >
                {entry.key}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '200px' }}
              >
                {entry.value}
              </div>
            </td>
            <td className="px-4 py-2 text-white">
              <div
                className="overflow-x-auto whitespace-nowrap"
                style={{ width: '200px' }}
              >
                {entry.timestamp}
              </div>
            </td>
          </tr>
        );
      } else {
        rows.push(
          <tr key={i}>
            <td colSpan={4} className="px-4 py-2 text-center text-white">
              <div
                className="flex justify-center items-center space-x-2"
                style={{ width: '900px' }}
              >
                &nbsp;
              </div>
            </td>
          </tr>
        );
      }
    }
    return rows;
  };

  return (
    <div key={filterKey} className="mt-4 flex justify-center">
      <div className="table-container">
        <table className="min-w-full bg-zinc-800 border border-gray-600">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="px-4 py-2 text-left text-white">Log ID</th>
              <th className="px-4 py-2 text-left text-white">Key</th>
              <th className="px-4 py-2 text-left text-white">Value</th>
              <th className="px-4 py-2 text-left text-white">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              renderLogRows()
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-2 text-center text-white">
                  <div
                    className="flex justify-center items-center space-x-2"
                    style={{ width: '900px' }}
                  >
                    No analytics data available.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AnalysisResults: React.FC<{
  analysisResults: any;
  percentiles: any;
  selectedFilter: string;
}> = ({ analysisResults, percentiles, selectedFilter: filterFromProps }) => {
  const [selectedFilter, setSelectedFilter] =
    useState<FilterDisplayNameKeys>('search_latency');

  return (
    <>
      <MetricCard
        key={`${selectedFilter}-metrics`}
        title={selectedFilter}
        metrics={analysisResults}
      />
      <PercentileCard
        key={`${selectedFilter}-percentile`}
        title={selectedFilter}
        percentiles={percentiles}
      />
    </>
  );
};

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const router = useRouter();

  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const [selectedFilter, setSelectedFilter] = useState('search_latency');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;
  const apiUrl = pipeline?.deploymentUrl;

  const fetchAnalytics = (client: R2RClient, filter: string) => {
    const filters = { [filter]: filter };
    const metricsAnalysisTypes = {
      [filter]:
        filter === 'error'
          ? ['bar_chart', filter]
          : ['basic_statistics', filter],
    };
    const percentiles = [10, 25, 50, 90];

    const filter_criteria: FilterCriteria = { [filter]: filter };
    const analysis_types: AnalysisTypes = {
      [filter]:
        filter === 'error'
          ? ['bar_chart', filter]
          : ['basic_statistics', filter],
    };

    const analyticsRequest: R2RAnalyticsRequest = {
      filter_criteria,
      analysis_types,
    };

    Promise.all([
      client.analytics(analyticsRequest),
      ...percentiles.map((percentile) => {
        const percentileAnalysisTypes: AnalysisTypes = {
          [filter]: ['percentile', filter, percentile.toString()],
        };
        const percentileRequest: R2RAnalyticsRequest = {
          filter_criteria,
          analysis_types: percentileAnalysisTypes,
        };
        return client.analytics(percentileRequest);
      }),
    ])
      .then(([metricsData, ...percentilesData]) => {
        const percentileResults = percentilesData.reduce((acc, data, index) => {
          acc[`p${percentiles[index]}`] = data.results[filter]?.value;
          return acc;
        }, {});

        setAnalyticsData({
          [filter]: metricsData.results[filter],
          percentiles: percentileResults,
          filtered_logs: {
            [filter]: metricsData.results.filtered_logs?.[filter],
          },
        });
      })
      .catch((error) => {
        console.error('Error fetching analytics data:', error);
      });
  };

  useEffect(() => {
    if (apiUrl) {
      const client = new R2RClient(apiUrl);
      fetchAnalytics(client, selectedFilter);
    }
  }, [apiUrl, selectedFilter]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(
    (analyticsData.filtered_logs?.[selectedFilter]?.length || 0) / logsPerPage
  );

  const currentLogs = analyticsData.filtered_logs?.[selectedFilter]?.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen container">
        <div className="mt-[5rem] sm:mt-[5rem]">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-blue-500 pl-4">Analytics</h3>
            <div className="pr-4">
              <Select onValueChange={(value) => setSelectedFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={selectedFilter} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="search_latency">Search Latency</SelectItem>
                  <SelectItem value="search_metrics">Search Metrics</SelectItem>
                  <SelectItem value="rag_generation_latency">
                    RAG Latency
                  </SelectItem>
                  {/* <SelectItem value="error">Errors</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex mt-4">
            <div className="w-1/4">
              <AnalysisResults
                analysisResults={analyticsData[selectedFilter]}
                percentiles={analyticsData.percentiles}
                selectedFilter={selectedFilter}
              />
            </div>

            <div className="w-3/4">
              <BarChart data={analyticsData} selectedFilter={selectedFilter} />
              <AnalyticsTable data={currentLogs} filterKey={selectedFilter} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Analytics;
