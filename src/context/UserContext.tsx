import { r2rClient } from 'r2r-js';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Pipeline {
  deploymentUrl: string;
}

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  password: string | null;
}

interface UserContextProps {
  pipeline: Pipeline | null;
  setPipeline: (pipeline: Pipeline) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    instanceUrl: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  getClient: () => Promise<r2rClient | null>;
}

const UserContext = createContext<UserContextProps>({
  pipeline: null,
  setPipeline: () => {},
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
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel') || 'gpt-4o';
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

      setPipeline({ deploymentUrl: instanceUrl });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (
      pipeline &&
      authState.isAuthenticated &&
      authState.email &&
      authState.password
    ) {
      const client = new r2rClient(pipeline.deploymentUrl);
      try {
        await client.login(authState.email, authState.password);
        await client.logout();
      } catch (error) {
        console.error(`Logout failed:`, error);
      }
    }
    setAuthState({
      isAuthenticated: false,
      email: null,
      password: null,
    });
    setPipeline(null);
    localStorage.removeItem('authState');
  };

  const getClient = async (): Promise<r2rClient | null> => {
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
        await logout();
        return null;
      }
    }
    return null;
  };

  return (
    <UserContext.Provider
      value={{
        pipeline,
        setPipeline,
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
