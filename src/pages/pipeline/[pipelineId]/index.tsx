import { useRouter } from 'next/router';
import { useState } from 'react';

import Layout from '@/components/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUserContext } from '@/context/UserContext';

import {
  CheckIcon,
  ClipboardDocumentCheckIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const PipelinePage = () => {
  const [copied, setCopied] = useState(false);

  const { watchedPipelines } = useUserContext();
  const router = useRouter();
  const { pipelineId } = router.query;
  const pipeline = watchedPipelines[pipelineId as string];

  const handleCopy = (text: string) => {
    if (!navigator.clipboard) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
      document.body.removeChild(textarea);
    } else {
      navigator.clipboard.writeText(text).then(
        () => {},
        (err) => {
          console.error('Failed to copy text: ', err);
        }
      );
    }
  };

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen mt-[4rem] sm:mt-[6rem] container mb-[4rem] sm:mb-[6rem]">
        <h1 className="text-white text-2xl mb-4">
          Pipeline{' '}
          <code className="font-mono text-gray-500 text-sm">
            id:{pipeline?.pipelineId}
          </code>
        </h1>
        <Separator />
        <Alert variant="default" className="mt-3">
          <AlertTitle className="text-lg text-center">
            <div className="flex items-center justify-center gap-2 text-xl">
              <span className="text-gray-500 dark:text-gray-200">
                👀 You're now watching a pipeline! <br />
                <a
                  href={`${pipeline?.pipelineId}/playground`}
                  className="text-blue-500"
                >
                  Test it out now in the playground!
                </a>
              </span>
            </div>
          </AlertTitle>
          <AlertDescription>
            <p className="text-center mb-2">
              There are a number of tools in the R2R dashboard to help you
              manage your RAG pipelines.
            </p>
            <div className="flex justify-center">
              <div className="text-left">
                <ul className="list-none pl-0">
                  <li className="flex items-start mb-1">
                    <span className="mr-2">🗂️</span>
                    <span>
                      Documents: Upload, update, and delete documents and their
                      metadata.
                    </span>
                  </li>
                  <li className="flex items-start mb-1">
                    <span className="mr-2">🛝</span>
                    <span>
                      Playground: Stream RAG and knowledge graph responses with
                      different models and configurable settings.
                    </span>
                  </li>
                  <li className="flex items-start mb-1">
                    <span className="mr-2">📊</span>
                    <span>
                      Analytics: View aggregate statistics around latencies and
                      metrics with detailed histograms.
                    </span>
                  </li>
                  <li className="flex items-start mb-1">
                    <span className="mr-2">📜</span>
                    <span>
                      Logs: Track user queries, search results, and LLM
                      responses.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap -mx-2">
          <div className="flex flex-col w-full sm:flex-row">
            <div className="w-full sm:w-1/2 px-2 flex flex-col">
              <Card className="my-6 w-full sm:max-w-xl lg:max-w-2xl flex-grow">
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl">
                    {pipeline?.pipelineName}
                  </CardTitle>
                  <CardDescription>
                    This is a deployment of an R2R RAG pipeline. Read the
                    default{' '}
                    <a
                      href="https://r2r-docs.sciphi.ai/deep-dive/rag"
                      className="text-blue-500"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      application documentation here
                    </a>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-4" />
                  <div className="flex items-center gap-2 pt-4">
                    <LinkIcon width="20" height="20" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {pipeline?.deploymentUrl}
                    </span>

                    {copied ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <ClipboardDocumentCheckIcon
                        className="w-4 h-4 cursor-pointer"
                        onClick={() => {
                          handleCopy(pipeline?.deploymentUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default PipelinePage;
