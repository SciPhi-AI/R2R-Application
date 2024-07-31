import { Check, ClipboardCheck, Link, BookOpenText } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import { PipelineStatus } from '@/components/ChatDemo/PipelineStatus';
import Layout from '@/components/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUserContext } from '@/context/UserContext';

const PipelinePage = () => {
  const router = useRouter();
  const { isAuthenticated, pipeline } = useUserContext();
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

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
    <Layout isConnected={isConnected}>
      <main className="w-full flex flex-col min-h-screen mt-[4rem] sm:mt-[6rem] container mb-[4rem] sm:mb-[6rem]">
        <h1 className="text-white text-2xl mb-4">R2R</h1>
        <Separator />
        <Alert variant="default" className="mt-3">
          <AlertTitle className="text-lg ">
            <div className="flex gap-2 text-xl">
              <span className="text-gray-500 dark:text-gray-200">
                You're now connected to your R2R deployment!{' '}
                <a
                  href={`/playground`}
                  className="text-link hover:text-link-hover"
                >
                  Test it out in the playground!
                </a>
              </span>
            </div>
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              The R2R dashboard has a number of tools to help you manage your
              pipelines.
            </p>
            <div className="flex">
              <div className="text-left">
                <ul className="list-none pl-0">
                  <li className="flex items-start mb-1 pl-4">
                    <span className="mr-2">🗂️</span>
                    <span>
                      Documents: Upload, update, and delete documents and their
                      metadata.
                    </span>
                  </li>
                  <li className="flex items-start mb-1 pl-4">
                    <span className="mr-2">🛝</span>
                    <span>
                      Playground: Stream RAG and knowledge graph responses with
                      different models and configurable settings.
                    </span>
                  </li>
                  <li className="flex items-start mb-1 pl-4">
                    <span className="mr-2">📊</span>
                    <span>
                      Analytics: View aggregate statistics around latencies and
                      metrics with detailed histograms.
                    </span>
                  </li>
                  <li className="flex items-start mb-1 pl-4">
                    <span className="mr-2">📜</span>
                    <span>
                      Logs: Track user queries, search results, and LLM
                      responses.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <p className="mb-2">
              <br />
              Have a feature request or found a bug? Create a Github issue and
              help us improve the R2R dashboard!
            </p>
            <div className="space-x-2">
              <Button
                className="h-10 w-40 py-2.5"
                variant={'filled'}
                onClick={() =>
                  window.open(
                    'https://github.com/SciPhi-AI/R2R-Dashboard/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=',
                    '_blank'
                  )
                }
              >
                Feature Request
              </Button>
              <Button
                className="h-10 w-40 py-2.5"
                variant={'filled'}
                onClick={() =>
                  window.open(
                    'https://github.com/SciPhi-AI/R2R-Dashboard/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=',
                    '_blank'
                  )
                }
              >
                Report a Bug
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap -mx-2">
          <div className="flex flex-col w-full sm:flex-row">
            <div className="w-full sm:w-1/2 px-2 flex flex-col">
              <Card className="my-6 w-full sm:max-w-xl lg:max-w-2xl flex-grow">
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl">R2R Deployment</CardTitle>
                  <PipelineStatus onStatusChange={setIsConnected} />
                  <CardDescription>
                    This is a deployment of an R2R RAG pipeline. Read the
                    default{' '}
                    <a
                      href="https://r2r-docs.sciphi.ai/deep-dive/rag"
                      className="text-link hover:text-link-hover"
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
                    <Link width="20" height="20" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {pipeline?.deploymentUrl}
                    </span>

                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <ClipboardCheck
                        className="w-4 h-4 cursor-pointer"
                        onClick={() => {
                          handleCopy(pipeline!.deploymentUrl);
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
          <div className="w-full px-2 mt-6">
            <h2 className="text-xl mb-4">SDKs</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Card className="w-full sm:w-1/4 flex flex-col">
                <CardHeader className="flex flex-row items-center space-x-2">
                  <Image
                    src="/images/python-logo.svg"
                    alt="Python Logo"
                    width={30}
                    height={30}
                  />
                  <CardTitle>Python SDK</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-end flex-grow">
                  <div className="flex flex-row space-x-2">
                    <Button
                      className="rounded-md py-1 px-3"
                      variant="filled"
                      onClick={() =>
                        window.open(
                          'https://r2r-docs.sciphi.ai/walkthrough',
                          '_blank'
                        )
                      }
                    >
                      <div className="flex items-center">
                        <BookOpenText size={20} className="mr-2" />
                        <span>Docs</span>
                      </div>
                    </Button>
                    <Button
                      className="rounded-md py-1 px-3"
                      variant="filled"
                      onClick={() =>
                        window.open(
                          'https://github.com/SciPhi-AI/R2R',
                          '_blank'
                        )
                      }
                    >
                      <div className="flex items-center">
                        <Image
                          src="/images/github-mark.svg"
                          alt="GitHub Logo"
                          width={20}
                          height={20}
                          className="mr-2"
                        />
                        <span>View on GitHub</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="w-full sm:w-1/4 flex flex-col">
                <CardHeader className="flex flex-row items-center space-x-2">
                  <Image
                    src="/images/javascript-logo.svg"
                    alt="JavaScript Logo"
                    width={30}
                    height={30}
                  />
                  <CardTitle>JavaScript SDK</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-end flex-grow">
                  <div className="flex flex-row space-x-2">
                    <Button
                      className="rounded-md py-1 px-3"
                      variant="filled"
                      onClick={() =>
                        window.open(
                          'https://github.com/SciPhi-AI/r2r-js',
                          '_blank'
                        )
                      }
                    >
                      <div className="flex items-center">
                        <BookOpenText size={20} className="mr-2" />
                        <span>Docs</span>
                      </div>
                    </Button>
                    <Button
                      className="rounded-md py-1 px-3"
                      variant="filled"
                      onClick={() =>
                        window.open(
                          'https://github.com/SciPhi-AI/r2r-js',
                          '_blank'
                        )
                      }
                    >
                      <div className="flex items-center">
                        <Image
                          src="/images/github-mark.svg"
                          alt="GitHub Logo"
                          width={20}
                          height={20}
                          className="mr-2"
                        />
                        <span>View on GitHub</span>
                      </div>
                    </Button>
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
