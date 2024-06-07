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
}

const UserContext = createContext<UserContextProps>({
  watchedPipelines: {},
  addWatchedPipeline: () => {},
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [watchedPipelines, setWatchedPipelines] = useState<
    Record<string, Pipeline>
  >({});

  // Load data from local storage on initial render
  useEffect(() => {
    const storedPipelines = localStorage.getItem('watchedPipelines');
    if (storedPipelines) {
      setWatchedPipelines(JSON.parse(storedPipelines));
    }
  }, []);

  // Save data to local storage whenever watchedPipelines changes
  useEffect(() => {
    localStorage.setItem('watchedPipelines', JSON.stringify(watchedPipelines));
  }, [watchedPipelines]);

  const addWatchedPipeline = (pipelineId: string, pipeline: Pipeline) => {
    setWatchedPipelines((prevPipelines) => ({
      ...prevPipelines,
      [pipelineId]: pipeline,
    }));
  };

  return (
    <UserContext.Provider value={{ watchedPipelines, addWatchedPipeline }}>
      {children}
    </UserContext.Provider>
  );
};
