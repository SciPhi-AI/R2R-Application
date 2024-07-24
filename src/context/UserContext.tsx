import { r2rClient } from 'r2r-js';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { NetworkError, AuthenticationError } from '@/lib/CustomErrors';
import { AuthState, Pipeline, UserContextProps } from '@/types';

const UserContext = createContext<UserContextProps>({
  pipeline: null,
  setPipeline: () => {},
  selectedModel: 'null',
  setSelectedModel: () => {},
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  getClient: async () => null,
  refreshAuth: async () => {},
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

  const logout = useCallback(async () => {
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
  }, [pipeline, authState]);

  const refreshTokenPeriodically = useCallback(async () => {
    if (authState.isAuthenticated && pipeline) {
      try {
        const client = new r2rClient(pipeline.deploymentUrl);
        await client.login(authState.email!, authState.password!);
        await client.refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        await logout();
      }
    }
  }, [authState, pipeline]);

  const refreshAuth = useCallback(async () => {
    if (
      authState.isAuthenticated &&
      pipeline &&
      authState.email &&
      authState.password
    ) {
      try {
        const client = new r2rClient(pipeline.deploymentUrl);
        await client.login(authState.email, authState.password);
        await client.refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh authentication:', error);
        await logout();
      }
    }
  }, [authState, pipeline, logout]);

  const getClient = useCallback(async (): Promise<r2rClient | null> => {
    if (
      pipeline &&
      authState.isAuthenticated &&
      authState.email &&
      authState.password
    ) {
      const client = new r2rClient(pipeline.deploymentUrl);
      const MAX_RETRIES = 3;
      let retries = 0;

      while (retries < MAX_RETRIES) {
        try {
          await client.login(authState.email, authState.password);
          return client;
        } catch (error) {
          console.error(`Authentication attempt ${retries + 1} failed:`, error);

          if (error instanceof NetworkError) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else if (error instanceof AuthenticationError) {
            try {
              await refreshAuth();
              retries++;
              continue;
            } catch (refreshError) {
              console.error('Failed to refresh authentication:', refreshError);
              break;
            }
          } else {
            break;
          }
        }
      }

      console.error('Failed to authenticate client after multiple attempts');
      return null;
    }
    return null;
  }, [authState, pipeline, refreshAuth, logout]);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (authState.isAuthenticated) {
      refreshTokenPeriodically();
      refreshInterval = setInterval(refreshTokenPeriodically, 10 * 60 * 1000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [authState.isAuthenticated, refreshTokenPeriodically]);

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
        refreshAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
