import { useRouter } from 'next/router';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Layout from '@/components/Layout';
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
import { InfoIcon } from '@/components/ui/InfoIcon';
import { isValidUrl, useValidation } from '@/lib/utils';
import { WatchButton } from '@/components/ui/WatchButton';

type PipelineMenuProps = {
  pipelineName: string;
  setPipelineName: (value: string) => void;
  deploymentUrl: string;
  setDeploymentUrl: (value: string) => void;
};

function PipelineMenu({
  pipelineName,
  setPipelineName,
  deploymentUrl,
  setDeploymentUrl,
}: PipelineMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineId] = useState(uuidv4());
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

  const { inputStyles: pipelineNameStyles, isValid: isPipelineNameValid } =
    useValidation(pipelineName, (value) => value.trim() !== '');
  const { inputStyles: deploymentUrlStyles, isValid: isDeploymentUrlValid } =
    useValidation(deploymentUrl, isValidUrl);

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
                    <Label htmlFor="project-name">Pipeline Name</Label>
                    <Input
                      placeholder="Name Your Pipeline"
                      className={`w-full ${pipelineNameStyles}`}
                      onChange={(e) => setPipelineName(e.target.value)}
                      value={pipelineName}
                    />
                  </div>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="github-url">Deployment URL</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon width="w-5" height="h-5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Must point at a remote containing a properly built
                            SciPhi pipeline.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Input
                      key="github-url"
                      id="github-url"
                      placeholder="http://0.0.0.0:8000"
                      className={`w-full ${deploymentUrlStyles}`}
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
                      disabled
                    />
                  </div>
                </section>
                <hr className="border-t border-gray-600 my-4" />
              </div>
              <WatchButton
                isLoading={isLoading}
                isPipelineNameValid={isPipelineNameValid}
                isDeploymentUrlValid={isDeploymentUrlValid}
                onClick={handleSubmit}
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
        <div className="flex flex-col grid-cols-2 sm:flex-row justify-center sm:justify-center sm:flex-wrap w-full"></div>
        <div className="pt-2 pb-20 w-full max-w-[1150px] flex justify-center">
          <PipelineMenu
            pipelineName={pipelineName}
            setPipelineName={setPipelineName}
            deploymentUrl={deploymentUrl}
            setDeploymentUrl={setDeploymentUrl}
          />
        </div>
      </main>
    </Layout>
  );
}
