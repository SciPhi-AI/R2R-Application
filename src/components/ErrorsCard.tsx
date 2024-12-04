'use client';

import { GradientPinkRed } from '@visx/gradient';
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

import OverlayWrapper from '@/components/OverlayWrapper';
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
  count: Math.floor(Math.random() * 5),
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

  const hourlyData = Array(24).fill(0);

  logs.results.forEach((log) => {
    const logTime = new Date(log.timestamp);
    if (logTime >= twentyFourHoursAgo) {
      let hourIndex =
        23 - Math.floor((now.getTime() - logTime.getTime()) / (60 * 60 * 1000));
      hourIndex = Math.max(0, Math.min(23, hourIndex));
      hourlyData[hourIndex]++;
    }
  });

  return hourlyData.map((count, index) => ({
    hour: index,
    count: count,
    date: new Date(now.getTime() - (23 - index) * 60 * 60 * 1000),
  }));
};

const ErrorsBarChart = withTooltip<
  {
    data: { hour: number; count: number; date: Date }[];
    width: number;
    height: number;
  },
  TooltipData
>(
  ({
    data,
    width,
    height,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  }: {
    data: { hour: number; count: number; date: Date }[];
    width: number;
    height: number;
  } & WithTooltipProvidedProps<TooltipData>) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = scaleBand({
      range: [0, innerWidth],
      domain: data.map((d) => d.hour),
      padding: 0.2,
    });

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    if (isNaN(maxCount)) {
      console.error('Invalid maxCount value:', maxCount);
    }
    const yScale = scaleLinear({
      range: [innerHeight, 0],
      domain: [0, isNaN(maxCount) ? 1 : maxCount],
      nice: true,
    });
    const yTicks = generateYAxisTicks(isNaN(maxCount) ? 1 : maxCount);

    const minBarHeight = 2;

    return (
      <div style={{ position: 'relative' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <GradientPinkRed id="error-bar-gradient" />
          <Group left={margin.left} top={margin.top}>
            {data.map((d) => {
              const barHeight =
                d.count === 0
                  ? 0
                  : Math.max(
                      innerHeight - (yScale(d.count) ?? 0),
                      minBarHeight
                    );
              const barX = xScale(d.hour);
              return (
                <Bar
                  key={`bar-${d.hour}`}
                  x={barX ?? 0}
                  y={innerHeight - barHeight}
                  height={barHeight}
                  width={xScale.bandwidth()}
                  fill="url(#error-bar-gradient)"
                  onMouseEnter={() => {
                    const top = yScale(d.count);
                    const left = (barX ?? 0) + xScale.bandwidth() / 2;
                    showTooltip({
                      tooltipData: d,
                      tooltipTop: top,
                      tooltipLeft: left,
                    });
                  }}
                  onMouseLeave={() => hideTooltip()}
                />
              );
            })}
            {xScale
              .domain()
              .filter((_, i) => i % 3 === 0)
              .map((tick) => {
                const tickX = xScale(tick);
                return (
                  <text
                    key={`x-axis-${tick}`}
                    x={(tickX ?? 0) + xScale.bandwidth() / 2}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize={10}
                  >
                    {tick}h
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
        {tooltipOpen && tooltipData && (
          <Tooltip
            top={tooltipTop}
            left={tooltipLeft}
            style={{
              ...defaultTooltipStyles,
              backgroundColor: '#283238',
              color: 'white',
            }}
          >
            <div>
              <strong>{`${tooltipData.hour}:00`}</strong>
            </div>
            <div>{`Errors: ${tooltipData.count}`}</div>
            <div>{`${tooltipData.date.toLocaleString()}`}</div>
          </Tooltip>
        )}
      </div>
    );
  }
);

const ErrorsCard: React.FC = () => {
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

  const useRealData = false;

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
        const logs = await client.system.logs({});
        const processedData = null;
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
          <CardTitle className="text-xl">Errors</CardTitle>
        </div>
        <CardDescription>
          Errors that your R2R server has seen over the past 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent
        className="pt-0 flex-grow flex flex-col"
        style={{ minHeight: '300px', maxHeight: '400px' }}
      >
        <div
          ref={chartRef}
          className="mt-4 flex-grow relative"
          style={{
            minHeight: '250px',
            maxHeight: '350px',
            aspectRatio: '16 / 9',
          }}
        >
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {logData && dimensions.width > 0 && dimensions.height > 0 && (
            <OverlayWrapper>
              <ErrorsBarChart
                data={logData}
                width={dimensions.width}
                height={dimensions.height}
              />
            </OverlayWrapper>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorsCard;
