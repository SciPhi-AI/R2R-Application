import { createContext, useContext, useState } from 'react';

import { Pipeline } from '@/types';

interface PipelineContextProps {
  pipelines: Record<string, Pipeline>;
  updatePipelines(pipelineId: string, pipeline: Pipeline): void;
}

const PipelineContext = createContext<PipelineContextProps>({
  pipelines: {},
  updatePipelines: () => {},
});

export const usePipelineContext = () => useContext(PipelineContext);

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pipelines, setPipeline] = useState<Record<number, Pipeline>>({});
  const updatePipelines = async (pipelineId: string, pipeline: Pipeline) => {
    if (!pipeline) {
      console.error('pipeline is null', { pipelineId });
      return;
    }

    if (typeof pipeline.deploymentUrl === 'string') {
      try {
        pipeline.deploymentUrl = JSON.parse(pipeline.deploymentUrl);
      } catch (e) {
        console.error('Error parsing deployment', { pipelineId, pipeline });
      }
    }
    setPipeline((prevPipelines) => ({
      ...prevPipelines,
      [pipelineId]: pipeline,
    }));
  };

  return (
    <PipelineContext.Provider value={{ pipelines, updatePipelines }}>
      {children}
    </PipelineContext.Provider>
  );
};
