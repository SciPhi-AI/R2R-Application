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

function isAuthState(obj: any): obj is AuthState {
  const validRoles = ['admin', 'user', null];
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.isAuthenticated === 'boolean' &&
    (typeof obj.email === 'string' || obj.email === null) &&
    (validRoles.includes(obj.userRole) || obj.userRole === null)
  );
}

const UserContext = createContext<UserContextProps>({
  pipeline: null,
  setPipeline: () => {},
  selectedModel: 'null',
  setSelectedModel: () => {},
  isAuthenticated: false,
  login: async () => ({ success: false, userRole: 'user' }),
  loginWithToken: async () => ({ success: false, userRole: 'user' }),
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
        const parsed = JSON.parse(storedAuthState);
        if (isAuthState(parsed)) {
          return parsed;
        } else {
          console.warn(
            'Invalid authState found in sessionStorage. Resetting to default.'
          );
        }
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

  const login = useCallback(
    async (
      email: string,
      password: string,
      instanceUrl: string
    ): Promise<{ success: boolean; userRole: 'admin' | 'user' }> => {
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

        const newPipeline: Pipeline = { deploymentUrl: instanceUrl };
        setPipeline(newPipeline);
        sessionStorage.setItem('pipeline', JSON.stringify(newPipeline));

        return { success: true, userRole };
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    []
  );

  const loginWithToken = useCallback(
    async (
      token: string,
      instanceUrl: string
    ): Promise<{ success: boolean; userRole: 'admin' | 'user' }> => {
      const newClient = new r2rClient(instanceUrl);
      try {
        const result = await newClient.loginWithToken(token);

        sessionStorage.setItem('accessToken', result.access_token.token);

        newClient.setTokens(result.access_token.token, '');
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
          } else {
            console.error('Unexpected error when checking user role:', error);
          }
        }

        const newAuthState: AuthState = {
          isAuthenticated: true,
          email: '',
          userRole,
        };
        setAuthState(newAuthState);
        sessionStorage.setItem('authState', JSON.stringify(newAuthState));

        setLastLoginTime(Date.now());

        const newPipeline: Pipeline = { deploymentUrl: instanceUrl };
        setPipeline(newPipeline);
        sessionStorage.setItem('pipeline', JSON.stringify(newPipeline));

        return { success: true, userRole };
      } catch (error) {
        console.error('Login with token failed:', error);
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
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
  }, [client, authState.isAuthenticated]);

  const register = useCallback(
    async (email: string, password: string, instanceUrl: string) => {
      const newClient = new r2rClient(instanceUrl);
      if (newClient) {
        try {
          await newClient.register(email, password);
        } catch (error) {
          console.error('Failed to create user:', error);
          throw error;
        }
      } else {
        console.error('Client is not initialized');
        throw new Error('Client is not initialized');
      }
    },
    []
  );

  const refreshTokenPeriodically = useCallback(async () => {
    if (authState.isAuthenticated && client) {
      if (
        lastLoginTime &&
        Date.now() - lastLoginTime < 5 * 60 * 1000 // 5 minutes
      ) {
        return;
      }
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
      } catch (error) {
        console.error('Failed to refresh token:', error);
        if (error instanceof AuthenticationError) {
          try {
            throw new Error('Silent re-authentication not implemented');
          } catch (loginError) {
            console.error('Failed to re-authenticate:', loginError);
            await logout();
          }
        } else {
          await logout();
        }
      }
    }
  }, [authState.isAuthenticated, client, lastLoginTime, logout]);

  const getClient = useCallback((): r2rClient | null => {
    return client;
  }, [client]);

  useEffect(() => {
    if (authState.isAuthenticated && pipeline && !client) {
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
      const initialDelay = setTimeout(
        () => {
          refreshTokenPeriodically();
          refreshInterval = setInterval(
            refreshTokenPeriodically,
            55 * 60 * 1000 // 55 minutes
          );
        },
        5 * 60 * 1000
      ); // 5 minutes

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

  const contextValue = React.useMemo(
    () => ({
      pipeline,
      setPipeline,
      selectedModel,
      setSelectedModel,
      isAuthenticated: authState.isAuthenticated,
      authState,
      login,
      loginWithToken,
      logout,
      register,
      getClient,
      client,
      viewMode,
      setViewMode,
      isSuperUser,
    }),
    [
      pipeline,
      selectedModel,
      authState,
      client,
      viewMode,
      isSuperUser,
      login,
      loginWithToken,
      logout,
      register,
      getClient,
    ]
  );

  if (!isReady) {
    return null;
  }

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
