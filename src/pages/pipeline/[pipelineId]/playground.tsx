'use client';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { Result } from '@/components/ChatDemo/result';
// TODO: do we want to implement this in OSS?
// import { Search } from '@/components/ChatDemo/search';
import { Title } from '@/components/ChatDemo/title';
import { UploadButton } from '@/components/ChatDemo/upload';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';

import { R2RClient } from '../../../r2r-js-client';

const Index: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  let query = '';
  if (searchParams) {
    query = decodeURIComponent(searchParams.get('q') || '');
  }

  const [pipelineTooltipVisible, setPipelineTooltipVisible] = useState(false);
  const [userTooltipVisible, setUserTooltipVisible] = useState(false);

  const [model, setModel] = useState('gpt-4-turbo');
  const [modelTooltipVisible, setModelTooltipVisible] = useState(false);

  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const userId = '063edaf8-3e63-4cb9-a4d6-a855f36376c3';

  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;

  console.log('passing apiUrl = ', apiUrl);

  useEffect(() => {
    if (apiUrl) {
      const client = new R2RClient(apiUrl);
      client
        .getDocumentsInfo()
        .then((documents) => {
          setUploadedDocuments(documents['results']);
        })
        .catch((error) => {
          console.error('Error fetching user documents:', error);
        });
    }
  }, [apiUrl]);

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen container">
        <div className="absolute inset-0 bg-zinc-900 mt-[5rem] sm:mt-[5rem] ">
          {/* {isLoading && (
            <Loader className="mx-auto mt-20 animate-spin" size={64} />
          )} */}
          {true && (
            <>
              <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1">
                <div className="flex items-center justify-start">
                  <div className="mt-6 pr-2">
                    <UploadButton
                      userId={userId}
                      apiUrl={apiUrl}
                      uploadedDocuments={uploadedDocuments}
                      setUploadedDocuments={setUploadedDocuments}
                    />
                  </div>
                  <div className="flex-grow">
                    <label
                      htmlFor="apiUrl"
                      className="block text-sm font-medium text-zinc-300"
                    >
                      Pipeline URL
                      <span
                        className="inline-block ml-1 relative cursor-pointer"
                        onMouseEnter={() => setPipelineTooltipVisible(true)}
                        onMouseLeave={() => setPipelineTooltipVisible(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-zinc-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {pipelineTooltipVisible && (
                          <div
                            style={{ width: '350px' }}
                            className="absolute left-6 -top-2 bg-zinc-800 text-zinc-200 px-2 py-1 rounded text-xs z-10 pb-2 pt-2"
                          >
                            Enter the URL where your pipeline is deployed. This
                            is the URL where the R2R API is running.
                          </div>
                        )}
                      </span>
                    </label>
                    <input
                      type="text"
                      id="apiUrl"
                      name="apiUrl"
                      value={pipeline?.deploymentUrl}
                      disabled={true}
                      className="text-gray-500 mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-not-allowed"
                    />
                  </div>
                  <div className="flex-grow ml-4">
                    <label
                      htmlFor="userId"
                      className="block text-sm font-medium text-zinc-300"
                    >
                      User ID
                      <span
                        className="inline-block ml-1 relative cursor-pointer"
                        onMouseEnter={() => setUserTooltipVisible(true)}
                        onMouseLeave={() => setUserTooltipVisible(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-zinc-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {userTooltipVisible && (
                          <div
                            style={{ width: '250px' }}
                            className="absolute left-6 -top-2 bg-zinc-800 text-zinc-200 px-2 py-1 rounded text-xs z-10 pb-2 pt-2"
                          >
                            Each user interacts with the deployed pipeline
                            through an allocated User ID, allowing for
                            user-level interaction, tracking, and management.
                          </div>
                        )}
                      </span>
                    </label>
                    <input
                      type="text"
                      id="userId"
                      name="userId"
                      value={userId}
                      disabled={true}
                      className="text-gray-500 mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-not-allowed"
                    />
                  </div>
                  <div className="flex-grow ml-4">
                    <label
                      htmlFor="userId"
                      className="block text-sm font-medium text-zinc-300"
                    >
                      Model
                      <span
                        className="inline-block ml-1 relative cursor-pointer"
                        onMouseEnter={() => setModelTooltipVisible(true)}
                        onMouseLeave={() => setModelTooltipVisible(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-zinc-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {modelTooltipVisible && (
                          <div
                            style={{ width: '250px' }}
                            className="absolute left-6 -top-2 bg-zinc-800 text-zinc-200 px-2 py-1 rounded text-xs z-10 pb-2 pt-2"
                          >
                            The model used in the R2R application can be
                            specified here. The default model is GPT-4 Turbo,
                            but any model from OpenAI, Anthropic, VertexAI,
                            ...etc are readily supported. In order to run with
                            one of these models, the appropriate environment
                            variables must be set on the backend.
                          </div>
                        )}
                      </span>
                    </label>
                    <input
                      type="text"
                      id="model"
                      name="Model"
                      value={model}
                      // disabled={true}
                      onChange={(e) => setModel(e.target.value)}
                      className="text-black mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mx-auto max-w-6xl inset-4 md:inset-8 flex mt-20 max-h-4xl">
                <div className="flex-1 bg-zinc-800 rounded-r-2xl relative overflow-y-scroll border-2 border-zinc-600 mt-4">
                  <div className="h-20 pointer-events-none w-full backdrop-filter absolute top-0"></div>
                  <div className="px-4 md:px-8 pt-6 pb-24 h-full overflow-auto max-h-[80vh]">
                    <style jsx>{`
                      div::-webkit-scrollbar {
                        width: 10px;
                      }
                      div::-webkit-scrollbar-thumb {
                        background-color: #555;
                        border-radius: 5px;
                      }
                      div::-webkit-scrollbar-thumb:hover {
                        background: #333;
                      }
                    `}</style>{' '}
                    <Title
                      query={query}
                      userId={userId}
                      model={model}
                      setModel={setModel}
                    ></Title>
                    <Result
                      query={query}
                      model={model}
                      userId={userId}
                      apiUrl={apiUrl}
                      uploadedDocuments={uploadedDocuments}
                      setUploadedDocuments={setUploadedDocuments}
                    ></Result>
                  </div>
                  <div className="h-80 pointer-events-none w-full backdrop-filter absolute bottom-0 bg-gradient-to-b from-transparent to-zinc-900 [mask-image:linear-gradient(to_top,zinc-800,transparent)]"></div>
                  <div className="absolute inset-x-0 bottom-6 px-4 md:px-8">
                    <div className="w-full">
                      {/* <Search pipeline={pipeline}></Search> */}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default Index;
