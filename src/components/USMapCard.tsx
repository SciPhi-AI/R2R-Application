import { AlbersUsa } from '@visx/geo';
import { geoCentroid } from '@visx/vendor/d3-geo';
import React, { useEffect, useRef, useState } from 'react';
import * as topojson from 'topojson-client';
import { Topology, GeometryObject } from 'topojson-specification';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import stateAbbrs from './us-abbr.json';
import topology from './usa-topo.json';
const usaTopology = topology as unknown as Topology<{ states: GeometryObject }>;
type StateId = keyof typeof stateAbbrs;

export const background = '#1e1e1e';

interface FeatureShape {
  type: 'Feature';
  id: string;
  geometry: GeoJSON.MultiPolygon;
  properties: { name: string };
}

const unitedStates = topojson.feature(
  usaTopology,
  usaTopology.objects.states
) as GeoJSON.FeatureCollection<GeoJSON.MultiPolygon>;
const { features } = unitedStates;

export const colors: string[] = [
  '#0d47a1',
  '#2196f3',
  '#1565c0',
  '#1976d2',
  '#1e88e5',
]; // Blue color palette

// Dummy data for number of users per state
const usersPerState: Record<string, number> = {
  CA: 1000000,
  NY: 800000,
  TX: 750000,
  FL: 600000,
  WI: 500000,
  IL: 400000,
  MI: 300000,
  OH: 200000,
  PA: 100000,
  AK: 90000,
  HI: 80000,
  ID: 70000,
  WV: 60000,
  KY: 50000,
  TN: 40000,
  LA: 30000,
  MS: 20000,
  AL: 10000,
};

// X and Y adjustments to individual states
const coordOffsets: Record<string, number[]> = {
  FL: [11, 3],
  AK: [0, -4],
  CA: [-7, 0],
  NY: [5, 0],
  MI: [13, 20],
  LA: [-10, -3],
  HI: [-10, 10],
  ID: [0, 10],
  WV: [-2, 4],
  KY: [10, 0],
  TN: [0, 4],
};

const ignoredStates = ['VT', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD'];

const useDimensions = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observeTarget = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setTimeout(() => {
          setDimensions({ width, height });
        }, 100);
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

  return { ref, dimensions };
};

export default function USMapCard() {
  const { ref, dimensions } = useDimensions();
  const { width, height } = dimensions;

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = (width + height) / 1.55;

  const getColor = (stateId: string) => {
    const userCount = usersPerState[stateId] || 0;
    const index = Math.min(Math.floor(userCount / 200000), colors.length - 1);
    return colors[index];
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Users by Region: US</CardTitle>
        </div>
        <CardDescription>
          Requests to your R2R server over the past 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex-grow flex flex-col">
        <div
          ref={ref}
          className="w-full h-full"
          style={{ aspectRatio: '16 / 9' }}
        >
          {width > 0 && height > 0 && (
            <svg width={width} height={height}>
              <AlbersUsa<FeatureShape>
                data={features as FeatureShape[]}
                scale={scale}
                translate={[centerX, centerY - 25]}
              >
                {({ features }) =>
                  features.map(({ feature, path, projection }, i) => {
                    const coords: [number, number] | null = projection(
                      geoCentroid(feature)
                    );
                    const abbr: string =
                      (feature.id as StateId) in stateAbbrs
                        ? stateAbbrs[feature.id as StateId]
                        : '';

                    if (coordOffsets[abbr] && coords) {
                      coords[0] += coordOffsets[abbr][0];
                      coords[1] += coordOffsets[abbr][1];
                    }

                    const stylesObj = {
                      fill: '#FFF',
                      fontFamily: 'sans-serif',
                      cursor: 'default',
                    };

                    if (ignoredStates.includes(abbr)) {
                      return (
                        <path
                          key={`map-feature-${i}`}
                          d={path || ''}
                          fill={getColor(abbr)}
                          stroke={background}
                          strokeWidth={0.5}
                        />
                      );
                    }

                    return (
                      <React.Fragment key={`map-feature-${i}`}>
                        <path
                          key={`map-feature-${i}`}
                          d={path || ''}
                          fill={getColor(abbr)}
                          stroke={background}
                          strokeWidth={0.5}
                        />
                      </React.Fragment>
                    );
                  })
                }
              </AlbersUsa>
            </svg>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
