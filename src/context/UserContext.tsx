import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the initial context value and its types
interface Pipeline {
  pipelineName: string;
  deploymentUrl: string;
  pipelineId: string;
}

interface UserContextProps {
  watchedPipelines: Record<string, Pipeline>;
  addWatchedPipeline: (pipelineId: string, pipeline: Pipeline) => void;
  removeWatchedPipeline: (pipelineId: string) => void;
  isPipelineUnique: (
    name: string,
    url: string
  ) => { nameUnique: boolean; urlUnique: boolean };
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const UserContext = createContext<UserContextProps>({
  watchedPipelines: {},
  addWatchedPipeline: () => {},
  removeWatchedPipeline: () => {},
  isPipelineUnique: () => ({ nameUnique: true, urlUnique: true }),
  selectedModel: 'gpt-4o',
  setSelectedModel: () => {},
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [watchedPipelines, setWatchedPipelines] = useState<
    Record<string, Pipeline>
  >({
    '1': {
      pipelineName: 'Local Pipeline',
      deploymentUrl: 'http://0.0.0.0:8000',
      pipelineId: 'e67897b9-5f80-4f6a-8f2f-0c80ad106865',
    },
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel') || 'gpt-4-turbo';
    }
    return 'gpt-4-turbo';
  });

  // Load data from local storage on initial render
  useEffect(() => {
    const storedPipelines = localStorage.getItem('watchedPipelines');
    if (storedPipelines) {
      setWatchedPipelines({
        '1': {
          pipelineName: 'Local Pipeline',
          deploymentUrl: 'http://0.0.0.0:8000',
          pipelineId: 'e67897b9-5f80-4f6a-8f2f-0c80ad106865',
        },
        ...JSON.parse(storedPipelines),
      });
    }
  }, []);

  // Save data to local storage whenever watchedPipelines changes
  useEffect(() => {
    localStorage.setItem('watchedPipelines', JSON.stringify(watchedPipelines));
  }, [watchedPipelines]);

  // Save selectedModel to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);

  const addWatchedPipeline = (pipelineId: string, pipeline: Pipeline) => {
    setWatchedPipelines((prevPipelines) => ({
      ...prevPipelines,
      [pipelineId]: pipeline,
    }));
  };

  const removeWatchedPipeline = (pipelineId: string) => {
    setWatchedPipelines((prevPipelines) => {
      const newPipelines = { ...prevPipelines };
      delete newPipelines[pipelineId];
      return newPipelines;
    });
  };

  const isPipelineUnique = (name: string, url: string) => {
    const nameUnique = !Object.values(watchedPipelines).some(
      (p) => p.pipelineName === name
    );
    const urlUnique = !Object.values(watchedPipelines).some(
      (p) => p.deploymentUrl === url
    );
    return { nameUnique, urlUnique };
  };

  return (
    <UserContext.Provider
      value={{
        watchedPipelines,
        addWatchedPipeline,
        removeWatchedPipeline,
        isPipelineUnique,
        selectedModel,
        setSelectedModel,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
