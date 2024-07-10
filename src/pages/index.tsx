import type { NextPage } from 'next';

import { CreatePipelineHeader } from '@/components/CreatePipelineHeader';
import Layout from '@/components/Layout';
import { PipeCard } from '@/components/PipelineCard';
import { Separator } from '@/components/ui/separator';
import 'react-tippy/dist/tippy.css';
import { useUserContext } from '@/context/UserContext';

const Home: NextPage = () => {
  const { watchedPipelines } = useUserContext();
  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen mt-[4rem] sm:mt-[6rem] container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">R2R</h1>
          <p className="text-lg mt-2">
            R2R was designed to bridge the gap between local LLM experimentation
            and scalable, production-ready Retrieval-Augmented Generation (RAG).
            R2R provides a comprehensive and SOTA RAG system for developers,
            built around a RESTful API for ease of use.
          </p>
        </div>

        <div style={{
        backgroundColor: '#3f54be',
        // color: '#856404',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px',
        border: '1px solid #384bb4'
      }}>
        Note: R2R is connected at 'http://localhost:8000' by default. 
        <br/>
        You may need to attempt connections with 'http://0.0.0.0:8000' or 'http://127.0.0.1', depending on your network settings.
      </div>


        <Separator className="mb-8" />

        <div className="text-2xl mt-4 pl-1">R2R Deployments</div>

        <>
          <CreatePipelineHeader />
          <Separator className="mt-6" />

          <div className="not-prose grid grid-cols-1 gap-y-6 gap-x-10 pt-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 dark:border-white/5 place-items-center sm:place-items-start">
            {Object.values(watchedPipelines).map((pipeline) => {
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
