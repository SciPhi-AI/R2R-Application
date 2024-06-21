import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';
import { R2RClient } from '../../../r2r-js-client';

type Prompt = {
  name: string;
  template: string;
  input_types: Record<string, any>;
};

interface AppData {
  config: string;
  prompts: Record<string, Prompt>;
}

const renderNestedConfig = (config: Record<string, any>, depth = 0) => {
  console.log('config = ', config);
  return Object.entries(config).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <React.Fragment key={key}>
          <tr className="border-t border-gray-600">
            <td
              className={
                'px-4 py-2 text-white ' + (depth === 0 ? 'font-bold' : '')
              }
              style={{ paddingLeft: (depth + 1) * 20 }}
            >
              {key}
            </td>
            {/* <td className="px-4 py-2 text-white">Object</td> */}
          </tr>
          {renderNestedConfig(value, depth + 1)}
        </React.Fragment>
      );
    } else {
      return (
        <tr key={key} className="border-t border-gray-600">
          <td
            className={
              'px-4 py-2 text-white ' + (depth === 0 ? 'font-bold' : '')
            }
            style={{ paddingLeft: (depth + 1) * 20 }}
          >
            {key}
          </td>
          <td className="px-4 py-2 text-white">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(value, null, 2)}
            </pre>
          </td>
        </tr>
      );
    }
  });
};

const Index: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const router = useRouter();

  const { pipelineId } = router.query;
  const { watchedPipelines } = useUserContext();
  const pipeline = watchedPipelines[pipelineId as string];
  const apiUrl = pipeline?.deploymentUrl;

  useEffect(() => {
    const fetchAppData = async () => {
      if (apiUrl) {
        const client = new R2RClient(apiUrl);

        try {
          const response = await client.appSettings();
          console.log('response = ', response);

          if (response.results && response.results.results) {
            setAppData(response.results.results as AppData);
          } else {
            throw new Error('Unexpected response structure');
          }
        } catch (err) {
          setError(err as Error);
        }
      }
    };

    fetchAppData();
  }, [apiUrl]);

  if (error) {
    return <div>Error fetching app data: {error.message}</div>;
  }

  if (!appData) {
    return <div>Loading...</div>;
  }

  console.log('appData = ', appData);
  const { config, prompts } = appData;

  return (
    <Layout>
      <main className="w-full flex flex-col min-h-screen container">
        <div className="absolute inset-0 bg-zinc-900 mt-[5rem] sm:mt-[5rem] ">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1">
            <div className="mt-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-blue-500 pl-4">
                  App Data
                </h3>
                <div className="flex justify-center mt-4">
                  <button
                    className={`px-4 py-2 mx-2 rounded ${activeTab === 'config' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                    onClick={() => setActiveTab('config')}
                  >
                    Config
                  </button>
                  <button
                    className={`px-4 py-2 mx-2 rounded ${activeTab === 'prompts' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                    onClick={() => setActiveTab('prompts')}
                  >
                    Prompts
                  </button>
                </div>
              </div>
              <div className="flex flex-col space-y-4 p-4">
                {activeTab === 'config' && (
                  <div className="bg-zinc-800 p-4 rounded">
                    <h4 className="text-xl font-bold text-white pb-2">
                      Config
                    </h4>
                    <table className="min-w-full bg-zinc-800 border border-gray-600">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="px-4 py-2 text-left text-white">
                            Key
                          </th>
                          <th className="px-4 py-2 text-left text-white">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {config ? (
                          renderNestedConfig(JSON.parse(config))
                        ) : (
                          <tr>
                            <td colSpan={2}>
                              No valid configuration data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeTab === 'prompts' && (
                  <div className="bg-zinc-800 p-4 rounded">
                    <h4 className="text-xl font-bold text-white pb-2">
                      Prompts
                    </h4>
                    <table className="min-w-full bg-zinc-800 border border-gray-600">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="px-4 py-2 text-left text-white">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-white">
                            Template
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(prompts).map(([name, prompt]) => (
                          <tr key={name} className="border-t border-gray-600">
                            <td className="px-4 py-2 text-white">{name}</td>
                            <td className="px-4 py-2 text-white">
                              <pre className="whitespace-pre-wrap">
                                {prompt.template}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Index;
