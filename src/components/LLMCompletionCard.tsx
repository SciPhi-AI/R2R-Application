'use client';

import { Group } from '@visx/group';
import { PatternLines } from '@visx/pattern';
import { scaleBand, scaleLinear } from '@visx/scale';
import { ViolinPlot, BoxPlot } from '@visx/stats';
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
  timestamp: string;
  completion_time: number;
}

interface CompletionTimeData {
  hour: number;
  min: number;
  max: number;
  median: number;
  firstQuartile: number;
  thirdQuartile: number;
  outliers: number[];
  binData: { value: number }[];
}

interface TooltipData {
  hour: number;
  min: number;
  max: number;
  median: number;
  firstQuartile: number;
  thirdQuartile: number;
  name?: string;
}

export type LLMCompletionPlotProps = {
  width: number;
  height: number;
  data: CompletionTimeData[];
};

const LLMCompletionPlot = withTooltip<LLMCompletionPlotProps, TooltipData>(
  ({
    width,
    height,
    data,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  }: LLMCompletionPlotProps & WithTooltipProvidedProps<TooltipData>) => {
    const margin = { top: 40, right: 30, bottom: 50, left: 40 };
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const xScale = scaleBand<number>({
      range: [0, xMax],
      round: true,
      domain: data.map((d) => d.hour),
      padding: 0.4,
    });

    const values = data.flatMap(({ min, max }) => [min, max]);
    const yScale = scaleLinear<number>({
      range: [yMax, 0],
      round: true,
      domain: [0, Math.max(...values)],
    });

    const boxWidth = Math.min(40, xScale.bandwidth());

    return width < 10 ? null : (
      <div style={{ position: 'relative' }}>
        <svg width={width} height={height}>
          <PatternLines
            id="hViolinLines"
            height={3}
            width={3}
            stroke="#2a2a2a"
            strokeWidth={1}
            orientation={['horizontal']}
          />
          <Group top={margin.top} left={margin.left}>
            {yScale.ticks(5).map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={xMax}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke="#2a2a2a"
                strokeDasharray="2,2"
              />
            ))}
            {data.map((d, i) => (
              <g key={i}>
                <ViolinPlot
                  data={d.binData}
                  stroke="#4a4a4a"
                  left={xScale(d.hour)!}
                  width={boxWidth}
                  valueScale={yScale}
                  fill="url(#hViolinLines)"
                  value={(datum) => datum.value}
                />
                <BoxPlot
                  min={d.min}
                  max={d.max}
                  left={xScale(d.hour)! + 0.3 * boxWidth}
                  firstQuartile={d.firstQuartile}
                  thirdQuartile={d.thirdQuartile}
                  median={d.median}
                  boxWidth={boxWidth * 0.4}
                  fill="#4a4a4a"
                  fillOpacity={0.3}
                  stroke="#6a6a6a"
                  strokeWidth={2}
                  valueScale={yScale}
                  outliers={d.outliers}
                  minProps={{
                    onMouseOver: () => {
                      showTooltip({
                        tooltipTop: yScale(d.min) ?? 0 + margin.top,
                        tooltipLeft: xScale(d.hour)! + boxWidth + margin.left,
                        tooltipData: {
                          ...d,
                          name: `${d.hour}:00`,
                        },
                      });
                    },
                    onMouseLeave: () => {
                      hideTooltip();
                    },
                  }}
                  maxProps={{
                    onMouseOver: () => {
                      showTooltip({
                        tooltipTop: yScale(d.max) ?? 0 + margin.top,
                        tooltipLeft: xScale(d.hour)! + boxWidth + margin.left,
                        tooltipData: {
                          ...d,
                          name: `${d.hour}:00`,
                        },
                      });
                    },
                    onMouseLeave: () => {
                      hideTooltip();
                    },
                  }}
                  boxProps={{
                    onMouseOver: () => {
                      showTooltip({
                        tooltipTop: yScale(d.median) ?? 0 + margin.top,
                        tooltipLeft: xScale(d.hour)! + boxWidth + margin.left,
                        tooltipData: {
                          ...d,
                          name: `${d.hour}:00`,
                        },
                      });
                    },
                    onMouseLeave: () => {
                      hideTooltip();
                    },
                  }}
                  medianProps={{
                    style: {
                      stroke: 'white',
                    },
                    onMouseOver: () => {
                      showTooltip({
                        tooltipTop: yScale(d.median) ?? 0 + margin.top,
                        tooltipLeft: xScale(d.hour)! + boxWidth + margin.left,
                        tooltipData: {
                          ...d,
                          name: `${d.hour}:00`,
                        },
                      });
                    },
                    onMouseLeave: () => {
                      hideTooltip();
                    },
                  }}
                />
              </g>
            ))}
            <line x1={0} x2={0} y1={0} y2={yMax} stroke="#4a4a4a" />
            <line x1={0} x2={xMax} y1={yMax} y2={yMax} stroke="#4a4a4a" />
          </Group>
          {xScale
            .domain()
            .filter((_, i) => i % 2 === 0)
            .map((hour) => (
              <text
                key={hour}
                x={xScale(hour)! + xScale.bandwidth() / 2 + margin.left}
                y={height - 10}
                textAnchor="middle"
                fontSize={10}
                fill="#8a8a8a"
              >
                {hour}:00
              </text>
            ))}
          {yScale.ticks(5).map((tick) => (
            <text
              key={tick}
              x={margin.left - 10}
              y={yScale(tick) + margin.top}
              textAnchor="end"
              fontSize={10}
              fill="#8a8a8a"
            >
              {tick}s
            </text>
          ))}
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
              <strong>{tooltipData.name}</strong>
            </div>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              {tooltipData.max && <div>max: {tooltipData.max.toFixed(2)}s</div>}
              {tooltipData.thirdQuartile && (
                <div>
                  third quartile: {tooltipData.thirdQuartile.toFixed(2)}s
                </div>
              )}
              {tooltipData.median && (
                <div>median: {tooltipData.median.toFixed(2)}s</div>
              )}
              {tooltipData.firstQuartile && (
                <div>
                  first quartile: {tooltipData.firstQuartile.toFixed(2)}s
                </div>
              )}
              {tooltipData.min && <div>min: {tooltipData.min.toFixed(2)}s</div>}
            </div>
          </Tooltip>
        )}
      </div>
    );
  }
);

const LLMCompletionCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<CompletionTimeData[]>(
    []
  );
  const { getClient } = useUserContext();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const useRealData = false;

  const generateFakeData = (): CompletionTimeData[] => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      min: Math.random() * 2,
      max: 2 + Math.random() * 3,
      median: 1 + Math.random() * 2,
      firstQuartile: 0.5 + Math.random() * 1.5,
      thirdQuartile: 1.5 + Math.random() * 2,
      outliers: [Math.random() * 0.5, 4 + Math.random()],
      binData: Array.from({ length: 20 }, () => ({ value: Math.random() * 5 })),
    }));
  };

  const processLogData = (logs: LogEntry[]): CompletionTimeData[] => {
    // Process logs into hourly data
    const hourlyData: { [hour: number]: number[] } = {};
    logs.forEach((log) => {
      const hour = new Date(log.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(log.completion_time);
    });

    return Object.entries(hourlyData).map(([hour, times]) => {
      times.sort((a, b) => a - b);
      const min = Math.min(...times);
      const max = Math.max(...times);
      const median = times[Math.floor(times.length / 2)];
      const firstQuartile = times[Math.floor(times.length / 4)];
      const thirdQuartile = times[Math.floor((3 * times.length) / 4)];
      const iqr = thirdQuartile - firstQuartile;
      const outliers = times.filter(
        (t) => t < firstQuartile - 1.5 * iqr || t > thirdQuartile + 1.5 * iqr
      );

      return {
        hour: parseInt(hour),
        min,
        max,
        median,
        firstQuartile,
        thirdQuartile,
        outliers,
        binData: times.map((time) => ({ value: time })),
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      if (!useRealData) {
        setCompletionData(generateFakeData());
        setIsLoading(false);
        return;
      }

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }
        const logs = await client.system.logs({});
        // const processedData = processLogData(null);
        // setCompletionData(processedData);
      } catch (error) {
        console.error('Error fetching log data:', error);
        setError('Failed to fetch log data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
          <CardTitle className="text-xl">LLM Completion Time</CardTitle>
        </div>
        <CardDescription>
          LLM completion times over the past 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex-grow flex flex-col">
        <div
          ref={chartRef}
          className="mt-4 flex-grow"
          style={{ minHeight: '300px' }}
        >
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && completionData.length === 0 && (
            <p>No completion time data available.</p>
          )}
          {!isLoading &&
            !error &&
            completionData.length > 0 &&
            dimensions.width > 0 &&
            dimensions.height > 0 && (
              <OverlayWrapper>
                <LLMCompletionPlot
                  width={dimensions.width}
                  height={dimensions.height}
                  data={completionData}
                />
              </OverlayWrapper>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LLMCompletionCard;
