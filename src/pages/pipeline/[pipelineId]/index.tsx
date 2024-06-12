import { Check, Link } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';

import Layout from '@/components/Layout';
import { Alert, AlertTitle } from '@/components/ui/alert';
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUserContext } from '@/context/UserContext';

function CopyIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
const PipelinePage = () => {
  const [copied, setCopied] = useState(false);

  const { watchedPipelines } = useUserContext();
  const router = useRouter();
  const { pipelineId } = router.query;
  const pipeline = watchedPipelines[pipelineId as string];

  const handleCopy = (text: string) => {
    if (!navigator.clipboard) {
      // Fallback for older browsers or environments where the Clipboard API is not available
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        // Optional: Show a success message or perform any other actions
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
      document.body.removeChild(textarea);
    } else {
      navigator.clipboard.writeText(text).then(
        () => {
          // Optional: Show a success message or perform any other actions
        },
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
          <AlertTitle className="text-lg">
            <div className="flex items-center gap-2 text-xl">
              <span className=" text-gray-500 dark:text-gray-200">
                {"🎉 Congratulations, you've launched a pipeline! "}
                <a
                  href={`${pipeline?.pipelineId}/playground`}
                  className="text-indigo-500"
                >
                  Click here to try it out.
                </a>
              </span>
            </div>
          </AlertTitle>
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
                    This is a deployment an R2R RAG pipeline. Read the default{' '}
                    <a
                      href="https://r2r-docs.sciphi.ai/deep-dive/app"
                      className="text-indigo-500"
                    >
                      application documentation here
                    </a>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-4" />
                  <div className="flex items-center gap-2 pt-4">
                    <Link width="20" height="20" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {pipeline?.deploymentUrl}
                    </span>

                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <CopyIcon
                        className="w-4 h-4 cursor-pointer"
                        onClick={() => {
                          handleCopy(pipeline?.deploymentUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
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
