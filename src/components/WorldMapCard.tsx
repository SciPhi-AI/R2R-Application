import { Mercator, Graticule } from '@visx/geo';
import React, { useEffect, useRef, useState } from 'react';
import * as topojson from 'topojson-client';

import OverlayWrapper from '@/components/OverlayWrapper';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { brandingConfig } from '@/config/brandingConfig';

import topology from './world-topo.json';

export const background = '#1e1e1e';

interface FeatureShape {
  type: 'Feature';
  id: string;
  geometry: { coordinates: [number, number][][]; type: 'Polygon' };
  properties: { name: string };
}

// @ts-expect-error: TypeScript does not recognize the shape of the topojson feature
const world = topojson.feature(topology, topology.objects.units) as {
  type: 'FeatureCollection';
  features: FeatureShape[];
};

export const colors: string[] = [
  '#0d47a1',
  '#2196f3',
  '#1565c0',
  '#1976d2',
  '#1e88e5',
]; // Blue color palette

// Dummy data for number of users per country
const usersPerCountry: Record<string, number> = {
  USA: 1000000,
  CHN: 800000,
  IND: 750000,
  BRA: 600000,
  RUS: 500000,
  GBR: 400000,
  DEU: 300000,
  FRA: 200000,
  JPN: 100000,
  // Add more countries as needed
};

const useDimensions = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observeTarget = ref.current;
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

  return { ref, dimensions };
};

export default function WorldMapCard() {
  const { ref, dimensions } = useDimensions();
  const { width, height } = dimensions;

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = (width / 630) * 100;

  const getColor = (countryId: string) => {
    const userCount = usersPerCountry[countryId] || 0;
    const index = Math.min(Math.floor(userCount / 200000), colors.length - 1);
    return colors[index];
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Users by Region: World</CardTitle>
        </div>
        <CardDescription>
          Requests to your {brandingConfig.deploymentName} server over the past
          24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex-grow flex flex-col">
        <div
          ref={ref}
          className="w-full h-full"
          style={{ aspectRatio: '16 / 9' }}
        >
          {width > 0 && height > 0 && (
            <OverlayWrapper>
              <svg width={width} height={height}>
                <Mercator<FeatureShape>
                  data={world.features}
                  scale={scale}
                  translate={[centerX, centerY + 50]}
                >
                  {(mercator) => (
                    <g>
                      <Graticule
                        graticule={(g) => mercator.path(g) || ''}
                        stroke="rgba(255,255,255, 0)"
                      />
                      {mercator.features.map(({ feature, path }, i) => (
                        <path
                          key={`map-feature-${i}`}
                          d={path || ''}
                          fill={getColor(feature.id)}
                          stroke={background}
                          strokeWidth={0.5}
                        />
                      ))}
                    </g>
                  )}
                </Mercator>
              </svg>
            </OverlayWrapper>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
