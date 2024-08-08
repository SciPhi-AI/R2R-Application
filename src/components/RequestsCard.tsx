'use client';

import { GradientTealBlue } from '@visx/gradient';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import {
  withTooltip,
  Tooltip,
  defaultStyles as defaultTooltipStyles,
} from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import React, { useState, useEffect, useRef } from 'react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useUserContext } from '@/context/UserContext';

interface LogEntry {
  run_id: string;
  run_type: string;
  timestamp: string;
  user_id: string | null;
}

interface LogData {
  results: LogEntry[];
}

interface TooltipData {
  hour: number;
  count: number;
  date: Date;
}

// Temporary example data for a 24-hour period
const exampleData = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  count: Math.floor(Math.random() * 50),
}));

const generateYAxisTicks = (maxValue: number): number[] => {
  if (isNaN(maxValue) || maxValue === 0) {
    return [0];
  }
  if (maxValue <= 5) {
    return Array.from({ length: maxValue + 1 }, (_, i) => i);
  }
  const log10 = Math.floor(Math.log10(maxValue));
  const tickUnit = Math.pow(10, log10) / 2;
  const maxTick = Math.ceil(maxValue / tickUnit) * tickUnit;
  return Array.from({ length: 6 }, (_, i) => Math.round((i * maxTick) / 5));
};

const formatTickLabel = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const processLogData = (logs: LogData) => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const validLogs = logs.results.filter(
    (log) => new Date(log.timestamp) >= twentyFourHoursAgo
  );

  if (validLogs.length === 0) {
    return Array(24)
      .fill(0)
      .map((_, index) => ({
        hour: index,
        count: 0,
        date: new Date(now.getTime() - (23 - index) * 60 * 60 * 1000),
      }));
  }

  const earliestLog = new Date(
    Math.min(...validLogs.map((log) => new Date(log.timestamp).getTime()))
  );
  const latestLog = new Date(
    Math.max(...validLogs.map((log) => new Date(log.timestamp).getTime()))
  );

  const timeRange = latestLog.getTime() - earliestLog.getTime();

  let bucketSize: number;
  let bucketCount: number;

  if (timeRange <= 2 * 60 * 60 * 1000) {
    // 2 hours or less
    bucketSize = 5 * 60 * 1000; // 5 minutes
    bucketCount = Math.ceil(timeRange / bucketSize);
  } else if (timeRange <= 6 * 60 * 60 * 1000) {
    // 6 hours or less
    bucketSize = 15 * 60 * 1000; // 15 minutes
    bucketCount = Math.ceil(timeRange / bucketSize);
  } else if (timeRange <= 12 * 60 * 60 * 1000) {
    // 12 hours or less
    bucketSize = 30 * 60 * 1000; // 30 minutes
    bucketCount = Math.ceil(timeRange / bucketSize);
  } else {
    bucketSize = 60 * 60 * 1000; // 1 hour
    bucketCount = 24;
  }

  const buckets: { [key: number]: number } = {};

  for (let i = 0; i < bucketCount; i++) {
    buckets[i] = 0;
  }

  validLogs.forEach((log) => {
    const logTime = new Date(log.timestamp);
    const bucketIndex = Math.floor(
      (logTime.getTime() - earliestLog.getTime()) / bucketSize
    );
    if (buckets.hasOwnProperty(bucketIndex)) {
      buckets[bucketIndex]++;
    }
  });

  return Object.entries(buckets).map(([index, count]) => {
    const bucketStart = new Date(
      earliestLog.getTime() + parseInt(index) * bucketSize
    );
    return {
      hour: bucketStart.getHours() + bucketStart.getMinutes() / 60,
      count,
      date: bucketStart,
    };
  });
};

const RequestsBarChart = ({
  data,
  width,
  height,
}: {
  data: { hour: number; count: number; date: Date }[];
  width: number;
  height: number;
}) => {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    range: [0, innerWidth],
    domain: data.map((d) => d.hour.toString()),
    padding: 0.2,
  });

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const yScale = scaleLinear({
    range: [innerHeight, 0],
    domain: [0, maxCount],
    nice: true,
  });
  const yTicks = generateYAxisTicks(maxCount);

  const minBarHeight = 2;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <GradientTealBlue id="bar-gradient" />
      <Group left={margin.left} top={margin.top}>
        {data.map((d) => {
          const barHeight = Math.max(
            innerHeight - (yScale(d.count) ?? 0),
            minBarHeight
          );
          const barX = xScale(d.hour.toString());
          return (
            <Bar
              key={`bar-${d.hour}`}
              x={barX ?? 0}
              y={innerHeight - barHeight}
              height={barHeight}
              width={xScale.bandwidth()}
              fill="url(#bar-gradient)"
            />
          );
        })}
        {xScale
          .domain()
          .filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0)
          .map((tick) => {
            const tickX = xScale(tick);
            const hour = parseFloat(tick);
            const formattedTime = `${Math.floor(hour)}:${((hour % 1) * 60).toFixed(0).padStart(2, '0')}`;
            return (
              <text
                key={`x-axis-${tick}`}
                x={(tickX ?? 0) + xScale.bandwidth() / 2}
                y={innerHeight + 20}
                textAnchor="middle"
                fill="white"
                fontSize={10}
              >
                {formattedTime}
              </text>
            );
          })}
        {yTicks.map((tick) => (
          <text
            key={`y-axis-${tick}`}
            x={-10}
            y={yScale(tick) ?? 0}
            textAnchor="end"
            alignmentBaseline="middle"
            fill="white"
            fontSize={10}
          >
            {formatTickLabel(tick)}
          </text>
        ))}
      </Group>
    </svg>
  );
};

const RequestsCard: React.FC = () => {
  const [logData, setLogData] = useState<Array<{
    hour: number;
    count: number;
    date: Date;
  }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getClient } = useUserContext();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const useRealData = true;

  useEffect(() => {
    const fetchLogData = async () => {
      if (!useRealData) {
        setLogData(exampleData.map((d) => ({ ...d, date: new Date() })));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }
        const logs = await client.logs();
        const processedData = processLogData(logs);
        setLogData(processedData);
      } catch (error) {
        console.error('Error fetching log data:', error);
        setError('Failed to fetch log data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogData();
  }, [getClient, useRealData]);

  useEffect(() => {
    const observeTarget = chartRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    if (observeTarget) {
      resizeObserver.observe(observeTarget);
    }

    return () => {
      if (observeTarget) {
        resizeObserver.unobserve(observeTarget);
      }
    };
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Requests</CardTitle>
        </div>
        <CardDescription>
          Requests to your R2R server over the past 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent
        className="pt-0 flex-grow flex flex-col"
        style={{ minHeight: '300px', maxHeight: '400px' }}
      >
        <div
          ref={chartRef}
          className="mt-4 flex-grow"
          style={{
            minHeight: '250px',
            maxHeight: '350px',
            aspectRatio: '16 / 9',
          }}
        >
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {logData &&
            dimensions.width > 0 &&
            dimensions.height > 0 &&
            (logData.every((d) => d.count === 0) ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  No requests in the last 24 hours
                </p>
              </div>
            ) : (
              <RequestsBarChart
                data={logData}
                width={dimensions.width}
                height={dimensions.height}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestsCard;
