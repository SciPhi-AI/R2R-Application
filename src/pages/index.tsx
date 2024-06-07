import type { NextPage } from 'next';

import { CreatePipelineHeader } from '@/components/CreatePipelineHeader';
import Layout from '@/components/Layout';
import { PipeCard } from '@/components/PipelineCard';
import { Heading } from '@/components/shared/Heading';
import { Separator } from '@/components/ui/separator';
import 'react-tippy/dist/tippy.css';
import { useUserContext } from '@/context/UserContext';

const Home: NextPage = () => {
  const { watchedPipelines } = useUserContext();

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen mt-[4rem] sm:mt-[6rem] container">
        <div className="text-xl mb-4 pt-4">
          R2R - Build, deploy and observe your RAG pipelines
        </div>

        <Separator className="mt-8 mb-0" />

        <div className="text-2xl mt-4 pl-1">Pipelines </div>

        <>
          <CreatePipelineHeader />
          <Separator className="mt-6" />

          <div className="not-prose grid grid-cols-1 gap-y-6 gap-x-10 pt-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 dark:border-white/5 place-items-center sm:place-items-start">
            {Object.values(watchedPipelines).map((pipeline) => {
              console.log('pipeline', pipeline);
              if (pipeline.pipelineId) {
                return (
                  <PipeCard
                    key={pipeline.pipelineId}
                    pipeline={pipeline}
                    className="min-w-[250px] w-full sm:max-w-[250px]"
                  />
                );
              }
              return null;
            })}
          </div>
        </>
        <br />
      </main>
    </Layout>
  );
};

export default Home;
