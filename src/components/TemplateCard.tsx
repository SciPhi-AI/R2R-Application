'use client';

import {
  motion,
  useMotionTemplate,
  MotionValue,
  useMotionValue,
} from 'framer-motion';

import { GridPattern } from '@/components/shared/GridPattern';

function ResourcePattern({
  mouseX,
  mouseY,
  ...gridProps
}: { mouseX: MotionValue<number>; mouseY: MotionValue<number> } & Omit<
  React.ComponentPropsWithoutRef<typeof GridPattern>,
  'width' | 'height' | 'x'
>) {
  const maskImage = useMotionTemplate`radial-gradient(100px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl transition duration-300 [mask-image:linear-gradient(white,transparent)] group-hover:opacity-50">
        <GridPattern
          width={72}
          height={56}
          x="50%"
          className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg] fill-black/[0.02] stroke-black/5 dark:fill-gray-600/10 dark:stroke-gray-800"
          {...gridProps}
        />
      </div>
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[rgb(7,7,7)] to-[rgb(16,255,3)] opacity-0 transition duration-300 group-hover:opacity-90 dark:from-blue-600 dark:to-[#262b3c]"
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

export function TemplateCard({
  title,
  description,
  PassedImage,
  className,
  handleClick,
}: {
  title: string;
  description: string;
  PassedImage: any;
  className?: string;
  handleClick: any;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // const handleClick = () => {
  //   // router.push(`/pipeline/${pipeline.id}`);
  // };

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
      className={`group relative flex cursor-not-allowed rounded-2xl bg-transparent transition-shadow hover:shadow-md hover:shadow-zinc-900/5 dark:bg-white/2.5 dark:hover:shadow-black/5 ${className}`}
    >
      <ResourcePattern
        mouseX={mouseX}
        mouseY={mouseY}
        y={16}
        squares={[
          [0, 1],
          [1, 3],
        ]}
      />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-zinc-900/7.5 group-hover:ring-zinc-900/10 dark:ring-white/10 dark:group-hover:ring-white/20" />
      <div className="flex justify-between items-center relative rounded-2xl pt-4 pl-8 pb-2 w-full pb-0 mb-0">
        <div className="flex-1">
          <div className=" text-2xl pb-1.5 text-slate-300 line-clamp-3">
            {title}
          </div>

          <PassedImage />
          <hr className="my-2 mr-5 h-0.5 bg-slate-500 border-0 p-0" />

          <div className="text-md text-gray-500 dark:text-gray-400 line-clamp-3">
            {description}
          </div>
        </div>
        <div className="absolute top-0 right-0 mt-2 mr-2">
          <div className="bg-blue-500 p-2 rounded-full invisible group-hover:visible group-hover:animate-handleHoverLinkIconAnimation">
            Select
          </div>
        </div>
      </div>
    </div>
  );
}
