import { animated, useTransition, interpolate } from '@react-spring/web';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import Pie, { ProvidedProps, PieArcDatum } from '@visx/shape/lib/shapes/Pie';
import { EntityResponse } from 'r2r-js/dist/types';
import React from 'react';

const MIN_PERCENTAGE_THRESHOLD = 0.02;

interface PieData {
  category: string;
  count: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

const defaultMargin = { top: 20, right: 20, bottom: 20, left: 20 };

interface KnowledgeGraphProps {
  entities: EntityResponse[];
  width: number;
  height: number;
  margin?: typeof defaultMargin;
}

export default function KnowledgeGraph({
  entities,
  width,
  height,
  margin = defaultMargin,
}: KnowledgeGraphProps) {
  if (width < 10 || height < 10) {
    return null;
  }

  // Process entities to get category counts
  const categoryMap = new Map<string, number>();
  entities.forEach((entity) => {
    const category = entity.category || 'Uncategorized';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  const total = Array.from(categoryMap.values()).reduce(
    (sum, count) => sum + count,
    0
  );
  const categoryData: CategoryCount[] = [];
  let otherCount = 0;

  Array.from(categoryMap.entries()).forEach(([category, count]) => {
    const percentage = count / total;
    if (percentage >= MIN_PERCENTAGE_THRESHOLD) {
      categoryData.push({ category, count });
    } else {
      otherCount += count;
    }
  });

  if (otherCount > 0) {
    categoryData.push({ category: 'Other', count: otherCount });
  }

  // Create color scale
  const getColor = scaleOrdinal({
    domain: categoryData.map((d) => d.category),
    range: [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEEAD',
      '#D4A5A5',
      '#9B786F',
      '#A8E6CF',
    ],
  });

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Text overlay - positioned absolutely in top left */}
      <div className="absolute top-8 left-8 z-10">
        <h3 className="text-lg font-medium text-left text-primary">
          Distribution of Entity Categories
        </h3>
        <div className="text-sm text-muted-foreground text-left">
          Breaks down the types of entities in your collection
        </div>
      </div>

      {/* Centered pie chart */}
      <svg width={width} height={height}>
        <Group top={centerY + margin.top} left={centerX + margin.left}>
          <Pie
            data={categoryData}
            pieValue={(data) => data.count}
            outerRadius={radius}
            innerRadius={radius * 0.6}
            cornerRadius={3}
            padAngle={0.02}
          >
            {(pie) => (
              <AnimatedPie
                {...pie}
                getKey={(arc) => arc.data.category}
                getColor={(arc) => getColor(arc.data.category)}
              />
            )}
          </Pie>
        </Group>
      </svg>
    </div>
  );
}

type AnimatedStyles = { startAngle: number; endAngle: number; opacity: number };

const fromLeaveTransition = () => ({
  startAngle: 0,
  endAngle: 2 * Math.PI,
  opacity: 1,
});

const enterUpdateTransition = ({ startAngle, endAngle }: PieArcDatum<any>) => ({
  startAngle,
  endAngle,
  opacity: 1,
});

type AnimatedPieProps<Datum> = ProvidedProps<Datum> & {
  getKey: (d: PieArcDatum<Datum>) => string;
  getColor: (d: PieArcDatum<Datum>) => string;
};

function AnimatedPie({
  arcs,
  path,
  getKey,
  getColor,
}: AnimatedPieProps<PieData>) {
  const transitions = useTransition<PieArcDatum<PieData>, AnimatedStyles>(
    arcs,
    {
      from: fromLeaveTransition,
      enter: enterUpdateTransition,
      update: enterUpdateTransition,
      leave: fromLeaveTransition,
      keys: getKey,
      config: {
        duration: 500,
        tension: 120,
        friction: 14,
      },
    }
  );

  return transitions((props, arc, { key }) => {
    const [centroidX, centroidY] = path.centroid(arc);
    const percentage = (arc.endAngle - arc.startAngle) / (2 * Math.PI);
    const hasSpaceForLabel = percentage >= 0.02;

    return (
      <g key={key}>
        <animated.path
          d={interpolate(
            [props.startAngle, props.endAngle],
            (startAngle, endAngle) =>
              path({
                ...arc,
                startAngle,
                endAngle,
              })
          )}
          fill={getColor(arc)}
        />
        {hasSpaceForLabel && (
          <animated.g style={{ opacity: props.opacity }}>
            <text
              fill="white"
              x={centroidX}
              y={centroidY}
              dy=".33em"
              fontSize={9}
              textAnchor="middle"
              pointerEvents="none"
            >
              {`${getKey(arc)} (${arc.data.count})`}
            </text>
          </animated.g>
        )}
      </g>
    );
  });
}
