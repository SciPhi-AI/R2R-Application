'use client';

import {
  motion,
  useMotionTemplate,
  MotionValue,
  useMotionValue,
} from 'framer-motion';
import { useRouter } from 'next/router';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Collection, Graph } from '@/types';

/* ----------------------------------------------------------------------------
 * 1. Grid / Resource pattern logic borrowed from ContainerObjectCard
 * -------------------------------------------------------------------------- */

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
  // For uniqueness in SSR, you can also do `useId` from 'react' if needed:
  const patternId = React.useId();

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
          {squares.map(([sx, sy]) => (
            <rect
              strokeWidth="0"
              key={`${sx}-${sy}`}
              width={width + 1}
              height={height + 1}
              x={sx * width}
              y={sy * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

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
          className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg]
                     fill-black/[0.02] stroke-black/5
                     dark:fill-gray-600/10 dark:stroke-gray-800"
          {...gridProps}
        />
      </div>
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[rgb(7,7,7)] to-[rgb(16,255,3)]
                   opacity-0 transition duration-300 group-hover:opacity-90
                   dark:from-indigo-600 dark:to-[#262b3c]"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay
                   transition duration-300 group-hover:opacity-100"
        style={style}
      >
        <GridPattern
          width={72}
          height={56}
          x="50%"
          className="absolute inset-x-0 inset-y-[-30%]
                     h-[160%] w-full skew-y-[-18deg]
                     fill-black/50 stroke-black/70
                     dark:fill-white/2.5 dark:stroke-white/10"
          {...gridProps}
        />
      </motion.div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 2. Base shadcn/ui–style Card components
 * -------------------------------------------------------------------------- */

const BaseCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
BaseCard.displayName = 'BaseCard';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

/* ----------------------------------------------------------------------------
 * 3. “AdvancedCard” merges both: Card layout + Resource highlight pattern
 * --------------------------------------------------------------------------
   - Use it just like a normal Card, or pass in `containerObject` to get
     the “name + description + route on click” behavior from ContainerObjectCard.
---------------------------------------------------------------------------- */

interface AdvancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  containerObject?: Collection | Graph;
  /**
   * If true, we automatically route to /graphs/:id or /collections/:id on click.
   * Otherwise, you can control your own onClick handler.
   */
  autoNavigate?: boolean;
}

const AdvancedCard = React.forwardRef<HTMLDivElement, AdvancedCardProps>(
  (
    { containerObject, autoNavigate = true, className, children, ...props },
    ref
  ) => {
    const router = useRouter();
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function onMouseMove({
      currentTarget,
      clientX,
      clientY,
    }: React.MouseEvent<HTMLDivElement>) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    const handleClick = React.useCallback(() => {
      if (autoNavigate && containerObject) {
        const currentPath = router.pathname;
        const route = currentPath.includes('/graphs')
          ? 'graphs'
          : 'collections';
        router.push(`/${route}/${containerObject.id}`);
      }
    }, [autoNavigate, containerObject, router]);

    return (
      <div
        ref={ref}
        onClick={handleClick}
        onMouseMove={onMouseMove}
        className={cn(
          'group relative overflow-hidden rounded-2xl bg-zinc-800 ' +
            'transition-shadow hover:shadow-md hover:shadow-zinc-900/5 ' +
            'dark:bg-white/2.5 dark:hover:shadow-black/5 ',
          className
        )}
        {...props}
      >
        {/* This is the animated “highlight” background grid pattern */}
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

        {/* Inner “content” area. 
            If you’re simply using <CardHeader> etc., you can place them here */}
        <div className="relative flex flex-col rounded-2xl p-4 sm:p-6 w-full h-full">
          {/* If containerObject is provided, we can show its name + desc automatically */}
          {containerObject && (
            <>
              <h2 className="text-xl font-medium truncate w-full text-white mb-2 text-center">
                {containerObject.name}
              </h2>
              {containerObject.description && (
                <p className="text-white text-center">
                  {containerObject.description.length > 32
                    ? `${containerObject.description.substring(0, 32)}...`
                    : containerObject.description}
                </p>
              )}
            </>
          )}
          {/* If you pass children, or <CardHeader> etc., they’ll appear below. */}
          {children}
        </div>
      </div>
    );
  }
);

AdvancedCard.displayName = 'AdvancedCard';

/* ----------------------------------------------------------------------------
 * 4. Exports
 * -------------------------------------------------------------------------- */
export {
  // The “plain” Card building blocks
  BaseCard as Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  // The merged “fancy” version with framer-motion highlight
  AdvancedCard,
};
