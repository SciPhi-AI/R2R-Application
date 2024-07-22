import { r2rClient } from 'r2r-js';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Pipeline {
  pipelineName: string;
  deploymentUrl: string;
  pipelineId: string;
}

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  password: string | null;
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
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    instanceUrl: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  getClient: (pipelineId: string) => Promise<r2rClient | null>;
}

const UserContext = createContext<UserContextProps>({
  watchedPipelines: {},
  addWatchedPipeline: () => {},
  removeWatchedPipeline: () => {},
  isPipelineUnique: () => ({ nameUnique: true, urlUnique: true }),
  selectedModel: 'null',
  setSelectedModel: () => {},
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  getClient: async () => null,
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [watchedPipelines, setWatchedPipelines] = useState<
    Record<string, Pipeline>
  >({});
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel') || 'null';
    }
    return 'null';
  });
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      const storedAuthState = localStorage.getItem('authState');
      if (storedAuthState) {
        return JSON.parse(storedAuthState);
      }
    }
    return {
      isAuthenticated: false,
      email: null,
      password: null,
    };
  });

  // Load data from local storage on initial render
  useEffect(() => {
    const storedPipelines = localStorage.getItem('watchedPipelines');
    if (storedPipelines) {
      setWatchedPipelines(JSON.parse(storedPipelines));
    }
  }, []);

  // Save data to local storage whenever watchedPipelines or authState change
  useEffect(() => {
    localStorage.setItem('watchedPipelines', JSON.stringify(watchedPipelines));
    localStorage.setItem('authState', JSON.stringify(authState));
  }, [watchedPipelines, authState]);

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

  const findPipelineByUrl = (url: string): Pipeline | undefined => {
    return Object.values(watchedPipelines).find((p) => p.deploymentUrl === url);
  };

  const login = async (
    email: string,
    password: string,
    instanceUrl: string
  ) => {
    const client = new r2rClient(instanceUrl);
    try {
      await client.login(email, password);
      const newAuthState: AuthState = {
        isAuthenticated: true,
        email,
        password,
      };
      setAuthState(newAuthState);
      localStorage.setItem('authState', JSON.stringify(newAuthState));

      const existingPipeline = findPipelineByUrl(instanceUrl);
      if (!existingPipeline) {
        const pipelineId = uuidv4();
        addWatchedPipeline(pipelineId, {
          pipelineName: `R2R Pipeline`,
          deploymentUrl: instanceUrl,
          pipelineId,
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Logout from all pipelines
    for (const pipeline of Object.values(watchedPipelines)) {
      const client = new r2rClient(pipeline.deploymentUrl);
      if (authState.isAuthenticated && authState.email && authState.password) {
        try {
          await client.login(authState.email, authState.password);
          await client.logout();
        } catch (error) {
          console.error(
            `Logout failed for pipeline ${pipeline.pipelineName}:`,
            error
          );
        }
      }
    }
    setAuthState({
      isAuthenticated: false,
      email: null,
      password: null,
    });
    localStorage.removeItem('authState');
  };

  const getClient = async (pipelineId: string): Promise<r2rClient | null> => {
    const pipeline = watchedPipelines[pipelineId];
    if (
      pipeline &&
      authState.isAuthenticated &&
      authState.email &&
      authState.password
    ) {
      const client = new r2rClient(pipeline.deploymentUrl);
      try {
        await client.login(authState.email, authState.password);
        return client;
      } catch (error) {
        console.error('Failed to authenticate client:', error);
        // If authentication fails, clear the auth state
        await logout();
        return null;
      }
    }
    return null;
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
        isAuthenticated: authState.isAuthenticated,
        login,
        logout,
        getClient,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
