import {
  BookOpenText,
  FileText,
  MessageCircle,
  BarChart2,
  FileSearch,
  Users,
  Settings,
  PanelsTopLeft,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import R2RServerCard from '@/components/ChatDemo/ServerCard';
import Layout from '@/components/Layout';
import RequestsCard from '@/components/RequestsCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { CardTitle, CardHeader, CardContent, Card } from '@/components/ui/card';
import { useUserContext } from '@/context/UserContext';

const HomePage = () => {
  const router = useRouter();
  const { isAuthenticated, isSuperUser, pipeline } = useUserContext();
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isSuperUser()) {
      router.replace('/documents');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="absolute inset-0 bg-zinc-900 mt-[5rem] sm:mt-[5rem] mr-[5rem] ml-[5rem]">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left column - Alert */}
            <div className="w-full lg:w-2/3 flex flex-col gap-4">
              <Alert variant="default" className="flex flex-col">
                <AlertTitle className="text-lg ">
                  <div className="flex gap-2 text-xl">
                    <span className="text-gray-500 dark:text-gray-200 font-semibold">
                      You're connected to your R2R deployment!
                    </span>
                  </div>
                </AlertTitle>
                <AlertDescription>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                    Here, you'll find a number of tools to help you manage your
                    pipelines and deploy user-facing applications directly to
                    users.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">
                          Documents
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Upload, update, and delete documents and their
                          metadata.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Chat</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Stream RAG and knowledge graph responses with
                          different models and configurable settings.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Users</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Track user queries, search results, and LLM responses.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <FileSearch className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Logs</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Track user queries, search results, and LLM responses.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <BarChart2 className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">
                          Analytics
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Rich analytics and insights on your users' queries and
                          interactions.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Settings className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Settings</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Manage your R2R deployment settings and
                          configurations.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Have a feature request or found a bug? Create a Github
                      issue and help us improve R2R!
                    </p>
                    <div className="flex space-x-4">
                      <Button
                        className="flex items-center justify-center px-4 py-2 text-sm"
                        color="light"
                        onClick={() =>
                          window.open(
                            'https://github.com/SciPhi-AI/R2R/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=',
                            '_blank'
                          )
                        }
                      >
                        Feature Request
                      </Button>
                      <Button
                        className="flex items-center justify-center px-4 py-2 text-sm"
                        color="light"
                        onClick={() =>
                          window.open(
                            'https://github.com/SciPhi-AI/R2R/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=',
                            '_blank'
                          )
                        }
                      >
                        Report a Bug
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              {/* SDK Cards */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Card className="w-full sm:w-1/2 flex flex-col">
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
                          color="light"
                          onClick={() =>
                            window.open(
                              'https://r2r-docs.sciphi.ai/documentation/python-sdk/introduction',
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
                          color="light"
                          onClick={() =>
                            window.open(
                              'https://github.com/SciPhi-AI/R2R/tree/main/py',
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
                  <Card className="w-full sm:w-1/2 flex flex-col">
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
                          color="light"
                          onClick={() =>
                            window.open(
                              'https://r2r-docs.sciphi.ai/documentation/js-sdk/introduction',
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
                          color="light"
                          onClick={() =>
                            window.open(
                              'https://github.com/SciPhi-AI/R2R/tree/main/js/sdk',
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
                <div className="flex flex-col sm:flex-row gap-4">
                  <Card className="w-full sm:w-1/2 flex flex-col">
                    <CardHeader className="flex flex-row items-center space-x-2">
                      <Image
                        src="/images/hatchet-logo.svg"
                        alt="Python Logo"
                        width={30}
                        height={30}
                      />
                      <CardTitle>Hatchet</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-end flex-grow">
                      <div className="flex flex-row space-x-2">
                        <Button
                          className="rounded-md py-1 px-3"
                          color="light"
                          disabled={
                            !window.__RUNTIME_CONFIG__
                              ?.NEXT_PUBLIC_HATCHET_DASHBOARD_URL
                          }
                          onClick={() =>
                            window.open(
                              window.__RUNTIME_CONFIG__
                                .NEXT_PUBLIC_HATCHET_DASHBOARD_URL,
                              '_blank'
                            )
                          }
                          tooltip={
                            !window.__RUNTIME_CONFIG__
                              ?.NEXT_PUBLIC_HATCHET_DASHBOARD_URL ? (
                              <div>
                                Hatchet Dashboard Deployment URL unavailable.
                                <br />
                                <a
                                  href="https://r2r-docs.sciphi.ai/cookbooks/orchestration"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600 underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Learn more about orchestration with R2R Full.
                                </a>
                              </div>
                            ) : undefined
                          }
                        >
                          <div className="flex items-center">
                            <PanelsTopLeft size={20} className="mr-2" />
                            <span>Dashboard</span>
                          </div>
                        </Button>
                        <Button
                          className="rounded-md py-1 px-3"
                          color="light"
                          onClick={() =>
                            window.open(
                              'https://github.com/hatchet-dev/hatchet',
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
                  <div className="w-full sm:w-1/2"></div>
                </div>
              </div>
            </div>

            {/* Right column - Cards */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              {/* R2R Server Cards */}
              <div className="flex flex-col gap-4 flex-grow">
                {pipeline && (
                  <R2RServerCard
                    pipeline={pipeline}
                    onStatusChange={setIsConnected}
                  />
                )}

                <div className="flex-grow">
                  <RequestsCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default HomePage;
