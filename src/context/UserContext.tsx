import { useRouter } from 'next/router';
import { r2rClient } from 'r2r-js';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { AuthenticationError } from '@/lib/CustomErrors';
import { AuthState, Pipeline, UserContextProps } from '@/types';

const UserContext = createContext<UserContextProps>({
  pipeline: null,
  setPipeline: () => {},
  selectedModel: 'null',
  setSelectedModel: () => {},
  isAuthenticated: false,
  login: async () => ({ success: false, userRole: 'user' }),
  logout: async () => {},
  register: async () => {},
  authState: {
    isAuthenticated: false,
    email: null,
    userRole: null,
  },
  getClient: () => null,
  client: null,
  viewMode: 'admin',
  setViewMode: () => {},
  isSuperUser: () => false,
  checkAdminPrivileges: async () => {},
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [client, setClient] = useState<r2rClient | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');

  const [pipeline, setPipeline] = useState<Pipeline | null>(() => {
    if (typeof window !== 'undefined') {
      const storedPipeline = sessionStorage.getItem('pipeline');
      return storedPipeline ? JSON.parse(storedPipeline) : null;
    }
    return null;
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('selectedModel') || '';
    }
    return 'null';
  });

  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      const storedAuthState = sessionStorage.getItem('authState');
      if (storedAuthState) {
        return JSON.parse(storedAuthState);
      }
    }
    return {
      isAuthenticated: false,
      email: null,
      userRole: null,
    };
  });

  const isSuperUser = useCallback(() => {
    return authState.userRole === 'admin' && viewMode === 'admin';
  }, [authState.userRole, viewMode]);

  const [lastLoginTime, setLastLoginTime] = useState<number | null>(null);

  const login = async (
    email: string,
    password: string,
    instanceUrl: string
  ): Promise<{ success: boolean; userRole: 'admin' | 'user' }> => {
    console.log(`Attempting login for ${email} to ${instanceUrl}`);
    const newClient = new r2rClient(instanceUrl);
    try {
      const tokens = await newClient.login(email, password);

      sessionStorage.setItem('accessToken', tokens.access_token.token);
      sessionStorage.setItem('refreshToken', tokens.refresh_token.token);

      newClient.setTokens(
        tokens.access_token.token,
        tokens.refresh_token.token
      );

      setClient(newClient);

      let userRole: 'admin' | 'user' = 'user';
      try {
        await newClient.appSettings();
        userRole = 'admin';
      } catch (error) {
        if (
          error instanceof Error &&
          'status' in error &&
          error.status === 403
        ) {
          console.log('User does not have admin privileges');
        } else {
          console.error('Unexpected error when checking user role:', error);
        }
      }

      const newAuthState: AuthState = {
        isAuthenticated: true,
        email,
        userRole,
      };
      setAuthState(newAuthState);
      sessionStorage.setItem('authState', JSON.stringify(newAuthState));

      setLastLoginTime(Date.now());

      const newPipeline = { deploymentUrl: instanceUrl };
      setPipeline(newPipeline);
      sessionStorage.setItem('pipeline', JSON.stringify(newPipeline));

      return { success: true, userRole };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = useCallback(async () => {
    console.log('Logging out user');
    if (client && authState.isAuthenticated) {
      try {
        await client.logout();
      } catch (error) {
        console.error(`Logout failed:`, error);
      }
    }
    setAuthState({
      isAuthenticated: false,
      email: null,
      userRole: null,
    });
    sessionStorage.removeItem('pipeline');
    sessionStorage.removeItem('authState');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    setPipeline(null);
    setClient(null);
    console.log('User logged out successfully');
  }, [client, authState]);

  const register = async (
    email: string,
    password: string,
    instanceUrl: string
  ) => {
    console.log(`Attempting to register user: ${email}`);
    const newClient = new r2rClient(instanceUrl);
    if (newClient) {
      try {
        await newClient.register(email, password);
        console.log('User registered successfully');
      } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
      }
    } else {
      console.error('Client is not initialized');
      throw new Error('Client is not initialized');
    }
  };

  const checkAdminPrivileges = useCallback(async () => {
    if (client && authState.isAuthenticated) {
      try {
        await client.appSettings();
        setAuthState((prevState) => ({
          ...prevState,
          userRole: 'admin',
        }));
        sessionStorage.setItem(
          'authState',
          JSON.stringify({
            ...authState,
            userRole: 'admin',
          })
        );
      } catch (error) {
        if (
          error instanceof Error &&
          'status' in error &&
          error.status === 403
        ) {
          console.log('User does not have admin privileges');
        } else {
          console.error('Unexpected error when checking user role:', error);
        }
      }
    }
  }, [client, authState]);

  const refreshTokenPeriodically = useCallback(async () => {
    if (authState.isAuthenticated && client) {
      if (lastLoginTime && Date.now() - lastLoginTime < 5 * 60 * 1000) {
        return;
      }
      console.log('Attempting to refresh token');
      try {
        const newTokens = await client.refreshAccessToken();
        sessionStorage.setItem(
          'accessToken',
          newTokens.results.access_token.token
        );
        sessionStorage.setItem(
          'refreshToken',
          newTokens.results.refresh_token.token
        );
        client.setTokens(
          newTokens.results.access_token.token,
          newTokens.results.refresh_token.token
        );
        setLastLoginTime(Date.now());
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh token:', error);
        if (error instanceof AuthenticationError) {
          console.log('Authentication error, attempting to re-login');
          try {
            await login(
              authState.email!,
              sessionStorage.getItem('password')!,
              pipeline!.deploymentUrl
            );
          } catch (loginError) {
            console.error('Failed to re-authenticate:', loginError);
            await logout();
          }
        } else {
          await logout();
        }
      }
    }
  }, [authState, client, login, logout, lastLoginTime, pipeline]);

  const getClient = useCallback((): r2rClient | null => {
    return client;
  }, [client]);

  useEffect(() => {
    if (authState.isAuthenticated && pipeline && !client) {
      console.log('Initializing client after authentication');
      const newClient = new r2rClient(pipeline.deploymentUrl);
      const accessToken = sessionStorage.getItem('accessToken');
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (accessToken && refreshToken) {
        newClient.setTokens(accessToken, refreshToken);
      }
      setClient(newClient);
    }
  }, [authState.isAuthenticated, pipeline, client]);

  useEffect(() => {
    const handleRouteChange = () => {
      if (authState.isAuthenticated && !client && pipeline) {
        console.log('Initializing client after route change');
        const newClient = new r2rClient(pipeline.deploymentUrl);
        const accessToken = sessionStorage.getItem('accessToken');
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (accessToken && refreshToken) {
          newClient.setTokens(accessToken, refreshToken);
        }
        setClient(newClient);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    setIsReady(true);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, authState.isAuthenticated, client, pipeline]);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (authState.isAuthenticated) {
      console.log('Setting up token refresh interval');
      const initialDelay = setTimeout(
        () => {
          refreshTokenPeriodically();
          refreshInterval = setInterval(
            refreshTokenPeriodically,
            55 * 60 * 1000
          );
        },
        5 * 60 * 1000
      );

      return () => {
        clearTimeout(initialDelay);
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
      };
    }
  }, [authState.isAuthenticated, refreshTokenPeriodically]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

  if (!isReady) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        pipeline,
        setPipeline,
        selectedModel,
        setSelectedModel,
        isAuthenticated: authState.isAuthenticated,
        authState,
        login,
        logout,
        register,
        getClient,
        client,
        viewMode,
        setViewMode,
        isSuperUser,
        checkAdminPrivileges,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
