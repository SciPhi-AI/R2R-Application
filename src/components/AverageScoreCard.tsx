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

interface AverageScoreCardProps {
  scoreData?: Array<{ date: Date; score: number }>;
}

interface TooltipData {
  date: Date;
  score: number;
}

export type AverageScoreChartProps = {
  width: number;
  height: number;
  scoreData: Array<{ date: Date; score: number }>;
};

const getDate = (d: { date: Date }): Date => d.date;
const getScore = (d: { score: number }) => d.score;
const bisectDate = bisector<{ date: Date }, Date>((d) => d.date).left;

const AverageScoreChart = withTooltip<AverageScoreChartProps, TooltipData>(
  ({
    width,
    height,
    scoreData,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  }: AverageScoreChartProps & WithTooltipProvidedProps<TooltipData>) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = scaleTime({
      range: [0, innerWidth],
      domain: [
        Math.min(...scoreData.map((d) => getDate(d).getTime())),
        Math.max(...scoreData.map((d) => getDate(d).getTime())),
      ],
    });

    const yScale = scaleLinear({
      range: [innerHeight, 0],
      domain: [-1, 1],
      nice: true,
    });

    // Handler for tooltip
    const handleTooltip = (
      event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
    ) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x - margin.left);
      const index = bisectDate(scoreData, x0, 1);
      const d0 = scoreData[index - 1];
      const d1 = scoreData[index];
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
        tooltipTop: yScale(getScore(d)) + margin.top,
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
              data={scoreData}
              x={(d) => xScale(getDate(d))}
              y={(d) => yScale(getScore(d))}
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
              {`Score: ${(tooltipData as TooltipData).score.toFixed(2)}`}
            </div>
          </Tooltip>
        )}
      </div>
    );
  }
);

const AverageScoreCard: React.FC<AverageScoreCardProps> = ({
  scoreData: propScoreData,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scoreData, setScoreData] = useState<
    Array<{ date: Date; score: number }>
  >([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const { getClient } = useUserContext();

  const useRealData = false;

  // Generate fake data for the past 7 days
  const generateFakeData = () => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000),
      score: Math.random() * 2 - 1, // Random score between -1 and 1
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      if (!useRealData) {
        setScoreData(generateFakeData());
        setIsLoading(false);
        return;
      }

      if (propScoreData) {
        setScoreData(propScoreData);
        setIsLoading(false);
        return;
      }

      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }
        const logs = await client.system.logs({});
        // Use the prop data directly instead of processing it again
        setScoreData(logs.results);
      } catch (error) {
        console.error('Error fetching score data:', error);
        setError('Failed to fetch score data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [getClient, propScoreData, useRealData]);

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
          <CardTitle className="text-xl">Average Score</CardTitle>
        </div>
        <CardDescription>Average score over the past 7 days.</CardDescription>
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
          {!isLoading && !error && scoreData.length === 0 && (
            <p>No score data available.</p>
          )}
          {!isLoading &&
            !error &&
            scoreData.length > 0 &&
            dimensions.width > 0 &&
            dimensions.height > 0 && (
              <OverlayWrapper>
                <AverageScoreChart
                  width={dimensions.width}
                  height={dimensions.height}
                  scoreData={scoreData}
                />
              </OverlayWrapper>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AverageScoreCard;
