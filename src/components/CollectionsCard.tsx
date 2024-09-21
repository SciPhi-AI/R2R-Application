'use client';

import {
  motion,
  useMotionTemplate,
  MotionValue,
  useMotionValue,
} from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useId } from 'react';

import { Collection } from '@/types';

interface ResourcePatternProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  y: number;
  squares: [number, number][];
}

function ResourcePattern({
  mouseX,
  mouseY,
  ...gridProps
}: ResourcePatternProps) {
  const maskImage = useMotionTemplate`radial-gradient(100px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl transition duration-300 group-hover:opacity-50">
        <GridPattern
          width={72}
          height={56}
          x="50%"
          className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg] fill-black/[0.02] stroke-black/5 dark:fill-gray-600/10 dark:stroke-gray-800"
          {...gridProps}
        />
      </div>
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[rgb(7,7,7)] to-[rgb(16,255,3)] opacity-0 transition duration-300 group-hover:opacity-90 dark:from-indigo-600 dark:to-[#262b3c]"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay transition duration-300 group-hover:opacity-100"
        style={style}
      >
        <GridPattern
          width={72}
          height={56}
          x="50%"
          className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg] fill-black/50 stroke-black/70 dark:fill-white/2.5 dark:stroke-white/10"
          {...gridProps}
        />
      </motion.div>
    </div>
  );
}

interface CollectionCardProps {
  collection: Collection;
  className?: string;
  children?: React.ReactNode;
}

export function CollectionCard({
  collection,
  className,
  children,
}: CollectionCardProps) {
  const router = useRouter();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleClick = () => {
    router.push(`/collection/${collection.collection_id}`);
  };

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onClick={handleClick}
      onMouseMove={onMouseMove}
      className={`group relative overflow-hidden cursor-pointer rounded-2xl bg-zinc-800 transition-shadow hover:shadow-md hover:shadow-zinc-900/5 dark:bg-white/2.5 dark:hover:shadow-black/5 hover:cursor-pointer ${className}`}
    >
      <div className="absolute inset-0">
        <ResourcePattern
          mouseX={mouseX}
          mouseY={mouseY}
          y={16}
          squares={[
            [0, 1],
            [1, 3],
          ]}
        />
      </div>
      <div className="relative flex flex-col rounded-2xl p-4 sm:p-6 w-full h-full -mt-4">
        <h2 className="text-xl font-medium truncate w-full text-white mb-2">
          {collection.name}
        </h2>
        <p className="text-white">
          {collection.description
            ? collection.description.length > 32
              ? `${collection.description.substring(0, 32)}...`
              : collection.description
            : ''}
        </p>
        {children}
      </div>
    </div>
  );
}

interface GridPatternProps extends React.ComponentPropsWithoutRef<'svg'> {
  width: number;
  height: number;
  x: string | number;
  y: string | number;
  squares: Array<[x: number, y: number]>;
}

function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: GridPatternProps) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
