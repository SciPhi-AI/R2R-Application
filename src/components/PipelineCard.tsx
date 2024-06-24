'use client';
import {
  motion,
  useMotionTemplate,
  MotionValue,
  useMotionValue,
} from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiExternalLink, FiX } from 'react-icons/fi';
import { useUserContext } from '@/context/UserContext';

import { GridPattern } from '@/components/shared/GridPattern';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const StopPropagationWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return <div onClick={stopPropagation}>{children}</div>;
};

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

export function PipeCard({
  pipeline,
  className,
}: {
  pipeline: any;
  className?: string;
}) {
  const router = useRouter();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const { removeWatchedPipeline } = useUserContext();

  const handleClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.delete-button')) {
      router.push(`/pipeline/${pipeline.pipelineId}`);
    }
  };

  const handleDelete = () => {
    removeWatchedPipeline(pipeline.pipelineId);
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
      className={`group relative flex cursor-pointer rounded-2xl bg-transparent transition-shadow hover:shadow-md hover:shadow-zinc-900/5 dark:bg-white/2.5 dark:hover:shadow-black/5 ${className}`}
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
      <div className="flex justify-between items-center relative rounded-2xl p-4 sm:p-8 w-full">
        <div className="flex-1">
          <div className="text-2xl font-medium h-[30px] line-clamp-1">
            {pipeline.pipelineName}
          </div>
          <p className="mt-1 overflow-hidden text-ellipsis dark:text-zinc-500 whitespace-nowrap w-46">
            {pipeline.deploymentUrl}
          </p>
        </div>
        <div className="absolute top-0 right-0 mt-2 mr-2 flex space-x-2">
          <div className="bg-color7 p-2 rounded-full invisible group-hover:visible group-hover:animate-handleHoverLinkIconAnimation hover:bg-opacity-80 transition-colors duration-200">
            <FiExternalLink size="16" className="text-color1" />
          </div>
          <StopPropagationWrapper>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="delete-button bg-red-500 p-2 rounded-full invisible group-hover:visible group-hover:animate-handleHoverLinkIconAnimation hover:bg-opacity-80 transition-colors duration-200">
                  <FiX size="16" className="text-white" />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to unwatch this pipeline?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Unwatching {pipeline.pipelineName} won't delete it, but
                    you'll have to rewatch it to see it in your dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Unwatch
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </StopPropagationWrapper>
        </div>
      </div>
    </div>
  );
}
