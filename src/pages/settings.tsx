import { SquarePen } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toml from 'toml';

import EditPromptDialog from '@/components/ChatDemo/utils/editPromptDialog';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';

type Prompt = {
  name: string;
  template: string;
  input_types: Record<string, any>;
};

interface AppData {
  config: Record<string, any>;
  prompts: Record<string, Prompt>;
}

const renderNestedConfig = (
  config: Record<string, any>,
  depth = 0
): JSX.Element => {
  if (typeof config !== 'object' || config === null) {
    return (
      <span className="whitespace-pre-wrap">
        {typeof config === 'string' ? `"${config}"` : String(config)}
      </span>
    );
  }

  return (
    <>
      {Object.entries(config).map(([key, value], index) => (
        <React.Fragment key={key}>
          <tr className={index !== 0 ? 'border-t border-gray-600' : ''}>
            <td
              className={`w-1/3 px-6 py-2 text-white ${depth === 0 ? 'font-bold' : ''}`}
              style={{ paddingLeft: `${depth * 20 + 24}px` }}
            >
              {key}
            </td>
            <td className="w-2/3 px-4 py-2 text-white">
              {typeof value === 'object' && value !== null ? (
                Array.isArray(value) ? (
                  <span className="whitespace-pre-wrap">
                    {`[${value
                      .map((item) =>
                        typeof item === 'string'
                          ? `"${item}"`
                          : JSON.stringify(item)
                      )
                      .join(', ')}]`}
                  </span>
                ) : (
                  ''
                )
              ) : (
                renderNestedConfig(value)
              )}
            </td>
          </tr>
          {typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            renderNestedConfig(value, depth + 1)}
        </React.Fragment>
      ))}
    </>
  );
};

const Index: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const [selectedPromptName, setSelectedPromptName] = useState<string>('');
  const [selectedPromptTemplate, setSelectedPromptTemplate] =
    useState<string>('');
  const [isEditPromptDialogOpen, setIsEditPromptDialogOpen] = useState(false);
  const { pipeline, getClient } = useUserContext();

  const fetchAppData = useCallback(async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const response = await client.appSettings();
      console.log(response);
      if (response && response.results) {
        const { config, prompts } = response.results;
        setAppData({
          config: typeof config === 'string' ? toml.parse(config) : config,
          prompts: prompts || {},
        });
      } else {
        throw new Error('Unexpected response structure');
      }
    } catch (err) {
      console.error('Error fetching app data:', err);
    }
  }, [getClient]);

  useEffect(() => {
    if (pipeline?.deploymentUrl) {
      fetchAppData();
    }
  }, [pipeline?.deploymentUrl, fetchAppData]);

  const { config = {}, prompts = {} } = appData || {};

  const handleEditPrompt = (name: string, template: string) => {
    setSelectedPromptName(name);
    setSelectedPromptTemplate(template);
    setIsEditPromptDialogOpen(true);
  };

  const handleSaveSuccess = () => {
    if (pipeline?.deploymentUrl) {
      fetchAppData();
    }
  };

  return (
    <Layout pageTitle="Settings">
      <main className="w-full flex flex-col min-h-screen container bg-zinc-900 text-white p-4 mt-4">
        <div className="mx-auto w-full max-w-5xl mb-12 mt-4">
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex justify-center ml-auto">
                <Button
                  className={`px-4 py-2 rounded mr-2`}
                  color={activeTab === 'config' ? 'filled' : 'secondary'}
                  shape={activeTab === 'config' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('config')}
                >
                  Config
                </Button>
                <Button
                  className={`px-4 py-2 rounded`}
                  color={activeTab === 'prompts' ? 'filled' : 'secondary'}
                  shape={activeTab === 'prompts' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('prompts')}
                >
                  Prompts
                </Button>
              </div>
            </div>
            <div className="bg-zinc-800 p-4 rounded">
              {activeTab === 'config' && (
                <>
                  <h4 className="text-xl font-bold text-white pb-2">Config</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-zinc-800 border border-gray-600">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="w-1/3 px-4 py-2 text-left text-white">
                            Key
                          </th>
                          <th className="w-2/3 px-4 py-2 text-left text-white">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(config).length > 0 ? (
                          renderNestedConfig(config)
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-4 py-2 text-white text-center"
                            >
                              No valid configuration data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {activeTab === 'prompts' && (
                <>
                  <h4 className="text-xl font-bold text-white pb-2">Prompts</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-zinc-800 border border-gray-600">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="w-1/3 px-4 py-2 text-left text-white">
                            Name
                          </th>
                          <th className="w-2/3 px-4 py-2 text-left text-white">
                            Template
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(prompts).length > 0 ? (
                          Object.entries(prompts).map(([name, prompt]) => (
                            <tr key={name} className="border-t border-gray-600">
                              <td className="w-1/3 px-4 py-2 text-white">
                                {name}
                              </td>
                              <td className="w-2/3 px-4 py-2 text-white relative">
                                <div className="whitespace-pre-wrap font-sans pr-8 max-h-32 overflow-y-auto">
                                  {prompt.template}
                                </div>
                                <button
                                  onClick={() =>
                                    handleEditPrompt(name, prompt.template)
                                  }
                                  className="absolute top-2 right-2 text-gray-400 cursor-pointer hover:text-indigo-500"
                                >
                                  <SquarePen className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-4 py-2 text-white text-center"
                            >
                              No prompts available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <EditPromptDialog
        open={isEditPromptDialogOpen}
        onClose={() => setIsEditPromptDialogOpen(false)}
        promptName={selectedPromptName}
        promptTemplate={selectedPromptTemplate}
        onSaveSuccess={handleSaveSuccess}
      />
    </Layout>
  );
};

export default Index;
