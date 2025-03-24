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
  // Update getFontSize function to handle both key and value lengths
  const getFontSize = (content: string, isKey: boolean = false): string => {
    const length = content.length;
    if (isKey) {
      if (length > 30) return 'text-xs';
      if (length > 20) return 'text-sm';
      return 'text-base';
    }
    // existing value length logic
    if (length > 100) return 'text-xs';
    if (length > 50) return 'text-sm';
    return 'text-base';
  };

  if (typeof config !== 'object' || config === null) {
    const valueStr =
      typeof config === 'string' ? `"${config}"` : String(config);
    return (
      <div className="bg-zinc-700 rounded p-3 ml-6 text-gray-300">
        <span className="text-accent-base font-normal">Value: </span>
        <span
          className={`whitespace-pre-wrap font-normal ${getFontSize(valueStr)}`}
        >
          {valueStr}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
      {Object.entries(config)
        .sort(([keyA], [keyB]) => {
          // Always put extraFields last
          if (keyA === 'extraFields') return 1;
          if (keyB === 'extraFields') return -1;

          // Sort other keys normally
          const groupOrder: Record<string, number> = {
            extraParsers: 0,
            parserOverrides: 1,
          };
          if (keyA in groupOrder && keyB in groupOrder)
            return groupOrder[keyA] - groupOrder[keyB];
          if (keyA in groupOrder) return -1;
          if (keyB in groupOrder) return 1;
          return keyA.localeCompare(keyB);
        })
        .map(([key, value]) => {
          const contentLength = JSON.stringify(value).length;
          const isComplexObject =
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value);

          // Special handling for grouped and compact keys
          const isGroupedKey = [
            'extraFields',
            'extraParsers',
            'parserOverrides',
          ].includes(key);
          const isSpecialKey = ['routeLimits', 'userLimits'].includes(key);
          const needsCompactLayout = key === 'parserOverrides' || isSpecialKey;

          // Modify spanning logic
          const shouldSpanTwo =
            !isSpecialKey &&
            !isGroupedKey &&
            contentLength > 100 &&
            !isComplexObject;
          const shouldSpanThree =
            !isSpecialKey &&
            !isGroupedKey &&
            (isComplexObject || contentLength > 300);

          const spanClass = shouldSpanThree
            ? 'md:col-span-2 lg:col-span-3'
            : shouldSpanTwo
              ? 'md:col-span-2'
              : needsCompactLayout
                ? 'col-span-1 max-w-[300px]' // Add max-width for compact containers
                : isGroupedKey
                  ? 'col-span-1'
                  : '';

          // Use compact container for special cases
          const containerClass = needsCompactLayout
            ? 'bg-zinc-700 rounded p-3 h-fit'
            : isGroupedKey
              ? 'bg-zinc-700 rounded p-3'
              : 'bg-zinc-700 rounded p-4';

          // For extraFields, format without curly brackets
          const valueStr =
            key === 'extraFields' && typeof value === 'object'
              ? JSON.stringify(value, null, 2)
                  .replace(/^{/, '') // Remove opening curly brace
                  .replace(/}$/, '') // Remove closing curly brace
                  .trim()
              : typeof value === 'string'
                ? `"${value}"`
                : Array.isArray(value)
                  ? `[${value.map((item) => (typeof item === 'string' ? `"${item}"` : JSON.stringify(item))).join(', ')}]`
                  : String(value);

          return (
            <div key={key} className={`${containerClass} ${spanClass}`}>
              <div
                className="text-white"
                style={{ paddingLeft: `${depth * 16}px` }}
              >
                <span className="text-accent-base font-normal">Key: </span>
                <span className={`font-normal ${getFontSize(key, true)}`}>
                  {key}
                </span>
                <br />
                {typeof value === 'object' &&
                value !== null &&
                key !== 'extraFields' ? (
                  Array.isArray(value) ? (
                    <span
                      className={`whitespace-pre-wrap font-normal ${getFontSize(valueStr)}`}
                    >
                      <span className="text-accent-base">Value: </span>
                      {valueStr}
                    </span>
                  ) : (
                    <div className="mt-2">
                      {renderNestedConfig(value, depth + 1)}
                    </div>
                  )
                ) : (
                  <span className="font-normal">
                    {key === 'extraFields' ? (
                      <span
                        className={`whitespace-pre-wrap ${getFontSize(valueStr)}`}
                      >
                        {valueStr}
                      </span>
                    ) : (
                      <>
                        <span className="text-accent-base">Value: </span>
                        <span
                          className={`whitespace-pre-wrap ${getFontSize(valueStr)}`}
                        >
                          {valueStr}
                        </span>
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
    </div>
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
    <div className="bg-zinc-700 rounded p-4 mb-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="text-accent-base font-medium">{name}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-accent-base"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <button
              onClick={() => onEdit(name, template)}
              className="text-gray-400 hover:text-accent-base"
            >
              <SquarePen size={20} />
            </button>
          </div>
        </div>
        <div
          className={`text-white mt-1 text-sm ${isExpanded ? 'whitespace-pre-wrap' : 'truncate'}`}
        >
          {template}
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

  // Function to generate the alphabet list
  const generateAlphabetList = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return alphabet.map((letter) => (
      <button
        key={letter}
        className="px-2 py-1 text-white hover:text-accent-base"
        style={{ letterSpacing: '0.8em' }} // Adjust the spacing as needed
        onClick={() =>
          document
            .getElementById(letter)
            ?.scrollIntoView({ behavior: 'smooth' })
        }
      >
        {letter}
      </button>
    ));
  };

  // Function to render sections alphabetically
  const renderAlphabeticalConfigSections = () => {
    const groupedSections: Record<string, JSX.Element[]> = {};

    // First, sort the config keys alphabetically
    const sortedKeys = Object.keys(config).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    sortedKeys.forEach((key) => {
      const sectionKey = key.charAt(0).toUpperCase();
      if (!groupedSections[sectionKey]) {
        groupedSections[sectionKey] = [];
      }

      groupedSections[sectionKey].push(
        <div key={key} className="mb-4">
          <h3 className="text-2xl font-bold mb-2 text-white">
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </h3>
          {renderNestedConfig(config[key])}
        </div>
      );
    });

    // Sort the section keys alphabetically
    return Object.keys(groupedSections)
      .sort((a, b) => a.localeCompare(b))
      .map((letter) => (
        <div key={letter} id={letter} className="mb-6">
          <h4 className="text-xl font-bold text-accent-base pb-2">{letter}</h4>
          <div>{groupedSections[letter]}</div>
        </div>
      ));
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
                  <div className="flex mb-4">{generateAlphabetList()}</div>
                  <div className="overflow-x-auto max-w-full">
                    <div className="w-full bg-zinc-800">
                      {Object.keys(config).length > 0 ? (
                        renderAlphabeticalConfigSections()
                      ) : (
                        <div className="px-4 py-2 text-white text-center">
                          No valid configuration data available
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'prompts' && (
                <>
                  <h4 className="text-xl font-bold text-white pb-2">Prompts</h4>
                  <div className="overflow-x-auto max-w-full">
                    <div className="w-full bg-zinc-800">
                      {prompts && prompts.length > 0 ? (
                        <div className="flex flex-col">
                          {prompts.map((prompt) => (
                            <PromptRow
                              key={prompt.name}
                              name={prompt.name}
                              template={prompt.template}
                              onEdit={handleEditPrompt}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-2 text-white text-center">
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
