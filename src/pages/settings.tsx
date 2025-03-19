import { SquarePen, ChevronDown, ChevronUp } from 'lucide-react';
import { WrappedSettingsResponse } from 'r2r-js';
import React, { useState, useEffect, useCallback } from 'react';

import EditPromptDialog from '@/components/ChatDemo/utils/editPromptDialog';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';

interface Prompt {
  name: string;
  template: string;
}

interface AppData {
  config: Record<string, any>;
  prompts: Prompt[];
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
              className={`w-1/3 px-6 py-2 text-primary ${depth === 0 ? 'font-bold' : ''}`}
              style={{ paddingLeft: `${depth * 20 + 24}px` }}
            >
              {key}
            </td>
            <td className="w-2/3 px-4 py-2 text-primary">
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

interface PromptRowProps {
  name: string;
  template: string;
  onEdit: (name: string, template: string) => void;
}

const PromptRow: React.FC<PromptRowProps> = ({ name, template, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col border-t border-gray-600">
      <div className="flex items-center">
        <div className="w-1/4 px-4 py-2 text-primary truncate">{name}</div>
        <div className="w-3/4 px-4 py-2 text-primary relative flex items-center">
          <div className="flex-grow mr-16 overflow-hidden">
            <div className={`${isExpanded ? '' : 'truncate'}`}>{template}</div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute right-12 text-gray-400 hover:text-accent-base"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button
            onClick={() => onEdit(name, template)}
            className="absolute right-2 text-gray-400 hover:text-accent-base"
          >
            <SquarePen size={20} />
          </button>
        </div>
      </div>
    </div>
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

      const response: WrappedSettingsResponse = await client.system.settings();

      if (response && response.results) {
        setAppData({
          config: response.results.config,
          prompts: response.results.prompts.results,
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

  const { config = {}, prompts = [] } = appData || {};

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
      <main className="w-full flex flex-col min-h-screen container bg-zinc-900 text-primary p-4 mt-4">
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
                  <h4 className="text-xl font-bold text-primary pb-2">
                    Config
                  </h4>
                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full bg-zinc-800 border border-gray-600">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="w-1/3 px-4 py-2 text-left text-primary">
                            Key
                          </th>
                          <th className="w-2/3 px-4 py-2 text-left text-primary">
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
                              className="px-4 py-2 text-primary text-center"
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
                  <h4 className="text-xl font-bold text-primary pb-2">
                    Prompts
                  </h4>
                  <div className="overflow-x-auto max-w-full">
                    <div className="w-full bg-zinc-800 border border-gray-600">
                      <div className="flex border-b border-gray-600 font-bold">
                        <div className="w-1/4 px-4 py-2 text-primary">Name</div>
                        <div className="w-3/4 px-4 py-2 text-primary">
                          Template
                        </div>
                      </div>
                      {appData?.prompts && appData.prompts.length > 0 ? (
                        appData.prompts.map((prompt) => (
                          <PromptRow
                            key={prompt.name}
                            name={prompt.name}
                            template={prompt.template}
                            onEdit={handleEditPrompt}
                          />
                        ))
                      ) : (
                        <div className="px-4 py-2 text-primary text-center">
                          No prompts available
                        </div>
                      )}
                    </div>
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
