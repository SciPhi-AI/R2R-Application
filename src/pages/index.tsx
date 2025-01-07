import {
  BookOpenText,
  FileText,
  Boxes,
  MessageCircle,
  ScanSearch,
  BarChart2,
  FileSearch,
  Users,
  Settings,
  PanelsTopLeft,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress"

import R2RServerCard from '@/components/ChatDemo/ServerCard';
import Layout from '@/components/Layout';
import RequestsCard from '@/components/RequestsCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { CardTitle, CardHeader, CardContent, Card } from '@/components/ui/card';
import { useUserContext } from '@/context/UserContext';


const HomePage = () => {
  const router = useRouter();
  const { isAuthenticated, isSuperUser, pipeline, client, authState } = useUserContext();
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);


  const [limits, setLimits] = useState<any>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);

  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else {
      // Fetch the user's limit usage once they are authenticated
      fetchLimits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchLimits() {
    try {
      setIsLoadingLimits(true);
      console.log('authState.userId = ', authState.userId)
      const result = await client.users.getLimits({id: authState.userId}); 
      console.log('result = ', result)
      // ^ This calls our new Python method 
      //   or if using the JS SDK, it'd be client.users.getLimits() 
      //   depending on your actual environment.
      setLimits(result.results);
    } catch (error) {
      console.error("Failed to fetch user limits:", error);
    } finally {
      setIsLoadingLimits(false);
    }
  }
  console.log('limits = ', limits)

  if (!isAuthenticated) {
    return null;
  }  return (
    <Layout includeFooter>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="relative bg-zinc-900 p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left column - Alert */}
            <div className="w-full flex flex-col gap-4">
              <Alert variant="default" className="flex flex-col">
                <AlertTitle className="text-lg ">
                  <div className="flex gap-2 text-xl">
                    <span className="text-gray-500 dark:text-gray-200 font-semibold">
                      Your SciPhi Cloud!
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
                      <Boxes className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">
                          Collections
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Manage and share groups of documents and create
                          knowledge graphs.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Chat</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Generate RAG responses.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <ScanSearch className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Search</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Conduct search over your documents and collections.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex space-x-4">
                      <Button
                        className="flex items-center justify-center px-4 py-2 text-sm"
                        color="transparent"
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
                        color="transparent"
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


              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Card className="w-full sm:w-1/3 flex flex-col">
                    <CardHeader className="flex flex-row items-center space-x-2">
                      {/* <div className="text-md ">Monthly Requests</div> */}
                      <CardTitle>Monthly Requests</CardTitle>

                    </CardHeader>
                    <CardContent className="flex flex-col justify-end flex-grow">
                    <div className="flex flex-row space-x-2 mb-3">
                        <div className="w-[100%] ">
                        <div className="flex justify-between text-sm">
                        <div>
                          <div className="font-bold">Search</div>
                        </div>
                          <span className="font-bold">{`${limits.usage?.globalPerMin?.used}/${limits.usage?.globalPerMin?.limit}0`}</span>
                        </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </div>
                      <div className="flex flex-row space-x-2 mt-3">
                        <div className="w-[100%] ">
                        <div className="flex justify-between text-sm">
                        <div>
                          <div className="font-bold">RAG</div>
                        </div>
                          <span className="font-bold">{`${limits.usage?.globalPerMin?.used}/${limits.usage?.globalPerMin?.limit}`}</span>
                        </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="w-full sm:w-1/3 flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-semibold">Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Documents</span>
                          <span className="text-2xl font-bold">47/100</span>
                        </div>
                        <Progress value={47} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>47% used</span>
                          <span>53 remaining</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="w-full sm:w-1/3 flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-semibold">Chunks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Chunks</span>
                          <span className="text-2xl font-bold">47/100</span>
                        </div>
                        <Progress value={47} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>47% used</span>
                          <span>53 remaining</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* <Card className="w-full sm:w-1/3 flex flex-col">
                    <CardHeader className="flex flex-row items-center space-x-2">
                      <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center items-end flex-grow">
                      <div className="text-xl font-bold">
                        0 / 100
                      </div>
                    </CardContent>
                  </Card> */}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-1/2"></div>
                </div>
              </div>

            </div>

            {/* Right column - Cards */}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default HomePage;
