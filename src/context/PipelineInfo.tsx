import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import { useUserContext } from '@/context/UserContext';
import { Pipeline } from '@/types';

export const usePipelineInfo = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const { watchedPipelines } = useUserContext();

  useEffect(() => {
    const fetchPipelineInfo = () => {
      setIsLoading(true);
      const id = router.query.pipelineId as string;

      if (id && watchedPipelines) {
        const pipelineData = watchedPipelines[id];
        if (pipelineData) {
          setPipeline({
            pipelineName: pipelineData.pipelineName,
            deploymentUrl: pipelineData.deploymentUrl,
            pipelineId: id,
          });
        } else {
          setPipeline(null);
        }
      } else {
        setPipeline(null);
      }

      setIsLoading(false);
    };

    fetchPipelineInfo();
  }, [router.query, watchedPipelines]);

  return { pipeline, isLoading };
};
