'use client';
import { localPoint } from '@visx/event';
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
import { Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef, useMemo } from 'react';

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

interface BucketData {
  timestamp: Date;
  count: number;
}

interface BarChartProps {
  data: BucketData[];
  width: number;
  height: number;
}

const BUCKET_SIZE_MINUTES = 60;
const HOURS_TO_SHOW = 24;
const BUCKETS_COUNT = (HOURS_TO_SHOW * 60) / BUCKET_SIZE_MINUTES;

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

const processLogData = (logs: LogData): BucketData[] => {
  const utcNow = new Date();
  const twentyFourHoursAgo = new Date(
    utcNow.getTime() - HOURS_TO_SHOW * 60 * 60 * 1000
  );

  const buckets: BucketData[] = Array.from(
    { length: BUCKETS_COUNT },
    (_, i) => ({
      timestamp: new Date(
        twentyFourHoursAgo.getTime() + i * BUCKET_SIZE_MINUTES * 60 * 1000
      ),
      count: 0,
    })
  );

  logs.results.forEach((log) => {
    const logTime = new Date(log.timestamp + 'Z');
    if (logTime >= twentyFourHoursAgo && logTime <= utcNow) {
      const bucketIndex = Math.floor(
        (logTime.getTime() - twentyFourHoursAgo.getTime()) /
          (BUCKET_SIZE_MINUTES * 60 * 1000)
      );
      if (bucketIndex >= 0 && bucketIndex < buckets.length) {
        buckets[bucketIndex].count++;
      }
    }
  });

  return buckets;
};

const RequestsBarChart = withTooltip<BarChartProps, BucketData>(
  ({
    data,
    width,
    height,
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  }: BarChartProps & WithTooltipProvidedProps<BucketData>) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = useMemo(
      () =>
        scaleBand({
          range: [0, innerWidth],
          domain: data.map((_, i) => i.toString()),
          padding: 0.2,
        }),
      [data, innerWidth]
    );

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const yScale = useMemo(
      () =>
        scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxCount],
          nice: true,
        }),
      [innerHeight, maxCount]
    );

    const yTicks = generateYAxisTicks(maxCount);

    const minBarHeight = 2;

    return (
      <div>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <GradientTealBlue id="bar-gradient" />
          <Group left={margin.left} top={margin.top}>
            {data.map((d, i) => {
              const barHeight = Math.max(
                innerHeight - (yScale(d.count) ?? 0),
                minBarHeight
              );
              const barX = xScale(i.toString());
              return (
                <Bar
                  key={`bar-${i}`}
                  x={barX ?? 0}
                  y={innerHeight - barHeight}
                  height={barHeight}
                  width={xScale.bandwidth()}
                  fill="url(#bar-gradient)"
                  onMouseLeave={() => hideTooltip()}
                  onMouseMove={(event) => {
                    const eventSvg = localPoint(event);
                    showTooltip({
                      tooltipData: d,
                      tooltipTop: eventSvg?.y ?? 0,
                      tooltipLeft: eventSvg?.x ?? 0,
                    });
                  }}
                />
              );
            })}
            {data
              .filter(
                (_, i) =>
                  i % ((HOURS_TO_SHOW * 60) / BUCKET_SIZE_MINUTES / 4) === 0
              )
              .map((d, i) => {
                const tickX = xScale(
                  (
                    (i * HOURS_TO_SHOW * 60) /
                    BUCKET_SIZE_MINUTES /
                    4
                  ).toString()
                );
                const hoursAgo = HOURS_TO_SHOW - i * 6;
                return (
                  <text
                    key={`x-axis-${i}`}
                    x={(tickX ?? 0) + xScale.bandwidth() / 2}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                  >
                    {hoursAgo === 0 ? 'Now' : `${hoursAgo}h ago`}
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
        {tooltipData && (
          <Tooltip
            top={tooltipTop}
            left={tooltipLeft}
            style={{
              ...defaultTooltipStyles,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
            }}
          >
            <div>
              <strong>Time (UTC):</strong> {tooltipData.timestamp.toUTCString()}
            </div>
            <div>
              <strong>Requests:</strong> {tooltipData.count}
            </div>
          </Tooltip>
        )}
      </div>
    );
  }
);

const RequestsCard: React.FC = () => {
  const { pipeline, getClient } = useUserContext();
  const [logData, setLogData] = useState<BucketData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { projectId } = router.query;

  const fetchLogData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const logs = await client.system.logs({});
      // const processedData = processLogData(logs);
      // setLogData(processedData);
    } catch (error) {
      console.error('Error fetching log data:', error);
      setError('Failed to fetch log data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pipeline?.deploymentUrl) {
      fetchLogData();
    }
  }, [pipeline?.deploymentUrl]);

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
    <Card className="max-height-64 flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Requests</CardTitle>
        </div>
        <CardDescription>
          Requests seen in the last 24 hours (UTC time).
        </CardDescription>
      </CardHeader>
      <CardContent
        className="flex-grow flex flex-col"
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
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="animate-spin" size={32} />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            logData &&
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestsCard;
