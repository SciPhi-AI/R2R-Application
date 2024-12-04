'use client';

import { AxisLeft, AxisBottom } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import {
  withTooltip,
  Tooltip,
  defaultStyles as defaultTooltipStyles,
} from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import { bisector } from 'd3-array';
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

// Example data (you can replace this with your actual data)
const exampleData = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(2024, 7, i + 1), // August 1-7, 2024
  count: Math.floor(Math.random() * 1000),
}));

// Accessors
const getDate = (d: { date: Date }): Date => d.date;
const getCount = (d: { count: number }) => d.count;
const bisectDate = bisector<{ date: Date }, Date>((d) => d.date).left;

const generateExampleData = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(2024, 7, i + 1), // August 1-7, 2024
    count: 500 + Math.floor(Math.random() * 100) * (i + 1), // Ensures growth
  }));
};

interface TooltipData {
  date: Date;
  count: number;
}

export type WAUChartProps = {
  width: number;
  height: number;
};

const WAUChart = withTooltip<WAUChartProps, TooltipData>(
  ({
    width,
    height,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  }: WAUChartProps & WithTooltipProvidedProps<TooltipData>) => {
    const [data] = useState(generateExampleData); // Use useState to store the data

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = scaleTime({
      range: [0, innerWidth],
      domain: [
        Math.min(...data.map((d) => getDate(d).getTime())),
        Math.max(...data.map((d) => getDate(d).getTime())),
      ],
    });

    const yScale = scaleLinear({
      range: [innerHeight, 0],
      domain: [0, Math.max(...data.map(getCount))],
      nice: true,
    });

    // Handler for tooltip
    const handleTooltip = (
      event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
    ) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x - margin.left);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;
      if (d1 && getDate(d1)) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      showTooltip({
        tooltipData: d,
        tooltipLeft: xScale(getDate(d)) + margin.left,
        tooltipTop: yScale(getCount(d)) + margin.top,
      });
    };

    return width < 10 ? null : (
      <div style={{ position: 'relative' }}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <AxisBottom
              top={innerHeight}
              scale={xScale}
              stroke="white"
              tickStroke="white"
              tickLabelProps={() => ({
                fill: 'white',
                fontSize: 11,
                textAnchor: 'middle',
              })}
            />
            <AxisLeft
              scale={yScale}
              stroke="white"
              tickStroke="white"
              tickLabelProps={() => ({
                fill: 'white',
                fontSize: 11,
                textAnchor: 'end',
                dy: '0.33em',
              })}
            />
            <LinePath
              data={data}
              x={(d) => xScale(getDate(d))}
              y={(d) => yScale(getCount(d))}
              stroke="#0d47a1"
              strokeWidth={2}
              curve={curveMonotoneX}
            />
            <rect
              width={innerWidth}
              height={innerHeight}
              fill="transparent"
              onTouchStart={handleTooltip}
              onTouchMove={handleTooltip}
              onMouseMove={handleTooltip}
              onMouseLeave={() => hideTooltip()}
            />
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
              <strong>
                {(tooltipData as TooltipData).date.toLocaleDateString()}
              </strong>
            </div>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              {`Users: ${(tooltipData as TooltipData).count}`}
            </div>
          </Tooltip>
        )}
      </div>
    );
  }
);

const WAUCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getClient } = useUserContext();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const useRealData = false;

  useEffect(() => {
    const fetchLogData = async () => {
      if (!useRealData) {
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
        // Process logs into suitable data format here
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
          <CardTitle className="text-xl">Weekly Active Users</CardTitle>
        </div>
        <CardDescription>
          Number of weekly active users over the past 30 days.
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
          {!isLoading &&
            !error &&
            dimensions.width > 0 &&
            dimensions.height > 0 && (
              <OverlayWrapper>
                <WAUChart width={dimensions.width} height={dimensions.height} />
              </OverlayWrapper>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WAUCard;
