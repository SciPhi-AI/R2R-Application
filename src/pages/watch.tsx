import { Info } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserContext } from '@/context/UserContext';

const WatchButton = ({ pipelineName, deploymentUrl, isLoading, onSubmit }) => {
  const isDisabled = useMemo(
    () => !pipelineName || !deploymentUrl || isLoading,
    [pipelineName, deploymentUrl, isLoading]
  );

  return (
    <Button
      variant={isDisabled ? 'disabled' : 'filled'}
      className={`w-1/3 h-8 py-1 ${isDisabled ? 'cursor-not-allowed' : ''}`}
      onClick={onSubmit}
      disabled={isDisabled}
    >
      {isLoading ? 'Watching...' : 'Watch'}
    </Button>
  );
};

function PipelineMenu({
  pipelineName,
  setPipelineName,
  deploymentUrl,
  setDeploymentUrl,
}: {
  pipelineName: any;
  setPipelineName: any;
  deploymentUrl: any;
  setDeploymentUrl: any;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineId, _] = useState(uuidv4());
  const { addWatchedPipeline, watchedPipelines } = useUserContext();
  const router = useRouter();

  console.log('watchedPipelines = ', watchedPipelines);

  const handleSubmit = async () => {
    setIsLoading(true);
    console.log('adding watched pipe.. = ', {
      pipelineName,
      deploymentUrl,
      pipelineId,
    });
    addWatchedPipeline(pipelineId, { pipelineName, deploymentUrl, pipelineId });
    setIsLoading(false);
    router.push('/'); // Navigate to the home page
  };

  return (
    <Card className="w-full mt-4 bg-zinc-800">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Deploy a RAG Pipeline</CardTitle>
          <div
            className="flex flex-col items-end"
            style={{ height: '0px' }}
          ></div>
        </div>
        <CardDescription>
          To deploy a new Pipeline, import an existing GitHub Repository or
          <span className="font-bold text-slate-300">
            {' '}
            select a prebuilt pipeline above.
          </span>
        </CardDescription>
      </CardHeader>

      <CardFooter>
        <CardContent className="space-y-4 pt-6 w-full px-0">
          <div className="flex flex-col-reverse sm:flex-row gap-8">
            <div className="left-content w-full">
              <div className="mb-4">
                <section aria-labelledby="pipeline-info-heading">
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="project-name">
                      Pipeline Name
                      <span className="bg-red-100 text-red-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-red-200 dark:text-red-900 ml-1">
                        Required
                      </span>
                    </Label>
                    <Input
                      placeholder="Name Your Pipeline"
                      className="w-full"
                      onChange={(e) => setPipelineName(e.target.value)}
                      value={pipelineName}
                    />
                  </div>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="github-url">
                      Deployment URL
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 pt-1 text-gray-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Must point at a remote containing a properly built
                              SciPhi pipeline.
                              <br />
                              Refer to{' '}
                              <a
                                className="text-indigo-500"
                                href="https://github.com/SciPhi-AI/R2R-rag-prebuilt"
                              >
                                this example repo{' '}
                              </a>
                              as a starting point.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="bg-red-100 text-red-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-red-200 dark:text-red-900 ml-1">
                        Required
                      </span>
                    </Label>
                    <Input
                      key="github-url"
                      id="github-url"
                      placeholder="http://0.0.0.0:8000"
                      className="w-full"
                      onChange={(e) => setDeploymentUrl(e.target.value)}
                      value={deploymentUrl}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github-url">Pipeline ID</Label>
                    <Input
                      key="pipeline-id"
                      id="pipeline-id"
                      className="w-full"
                      value={pipelineId}
                      disabled={true}
                    />
                  </div>
                </section>
                <hr className="border-t border-gray-600 my-4" />
              </div>
              <WatchButton
                pipelineName={pipelineName}
                deploymentUrl={deploymentUrl}
                isLoading={isLoading}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </CardContent>
      </CardFooter>
    </Card>
  );
}

export default function Watch() {
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const router = useRouter();

  return (
    <Layout>
      <main className="w-full flex flex-col items-center min-h-screen mt-[4rem] sm:mt-[6rem] container">
        <div className="font-mono flex items-center text-xl pb-2 border-b-2 border-gray-400 w-full max-w-[1150px] mb-4">
          <div className="text-gray-200">{'Watch >> '}</div>
          <div className={`ml-4 font-bold text-indigo-600`}>RAG Pipeline</div>
        </div>
        <>
          <div className="flex flex-col grid-cols-2 sm:flex-row justify-center sm:justify-center sm:flex-wrap w-full"></div>
          <div className="pt-2 pb-20 w-full max-w-[1150px] flex justify-center">
            <PipelineMenu
              pipelineName={pipelineName}
              setPipelineName={setPipelineName}
              deploymentUrl={deploymentUrl}
              setDeploymentUrl={setDeploymentUrl}
            />
          </div>
        </>
      </main>
    </Layout>
  );
}
