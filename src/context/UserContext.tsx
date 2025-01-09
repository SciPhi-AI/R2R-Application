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

// Add proper UserContext initialization
const UserContext = createContext<UserContextProps>({
  pipeline: null,
  setPipeline: () => {},
  selectedModel: 'null',
  setSelectedModel: () => {},
  isAuthenticated: false,
  login: async () => ({ success: false, userRole: 'user' }),
  logout: async () => {},
  unsetCredentials: async () => {},
  register: async () => {},
  verifyEmail: async () => {},
  authState: {
    isAuthenticated: false,
    email: null,
    userRole: null,
    userId: null,
  },
  requestPasswordReset: async (email: string, instanceUrl: string) => {},
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
      const storedPipeline = localStorage.getItem('pipeline');
      return storedPipeline ? JSON.parse(storedPipeline) : null;
    }
    return null;
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel') || '';
    }
    return 'null';
  });

  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      const storedAuthState = localStorage.getItem('authState');
      if (storedAuthState) {
        const parsed = JSON.parse(storedAuthState);
        if (isAuthState(parsed)) {
          return parsed;
        } else {
          console.warn(
            'Invalid authState found in localStorage. Resetting to default.'
          );
        }
      }
    }
    return {
      isAuthenticated: false,
      email: null,
      userRole: null,
      userId: null,
    };
  });

  useEffect(() => {
    setIsReady(true);
  }, []);

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
        const tokens = await newClient.users.login({
          email: email,
          password: password,
        });

        localStorage.setItem('accessToken', tokens.results.accessToken.token);
        localStorage.setItem('refreshToken', tokens.results.refreshToken.token);

        newClient.setTokens(
          tokens.results.accessToken.token,
          tokens.results.refreshToken.token
        );

        setClient(newClient);

        const userInfo = await newClient.users.me();

        let userRole: 'admin' | 'user' = 'user';
        try {
          // await newClient.system.settings();
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
          userId: userInfo.results.id,
          metadata: userInfo.results.metadata,
        };
        setAuthState(newAuthState);
        localStorage.setItem('authState', JSON.stringify(newAuthState));

        setLastLoginTime(Date.now());

        const newPipeline: Pipeline = { deploymentUrl: instanceUrl };
        setPipeline(newPipeline);
        localStorage.setItem('pipeline', JSON.stringify(newPipeline));

        return { success: true, userRole };
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (email: string, verificationCode: string, instanceUrl: string) => {
      const newClient = new r2rClient(instanceUrl);
      try {
        await newClient.users.verifyEmail({
          email: email,
          verification_code: verificationCode,
        } as any);
      } catch (error) {
        console.error('Email verification failed:', error);
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (client && authState.isAuthenticated) {
      try {
        await client.users.logout();
      } catch (error) {
        console.error(`Logout failed:`, error);
      }
    }
    setAuthState({
      isAuthenticated: false,
      email: null,
      userRole: null,
      userId: null,
    });
    localStorage.removeItem('pipeline');
    localStorage.removeItem('authState');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setPipeline(null);
    setClient(null);
  }, [client, authState.isAuthenticated]);

  const unsetCredentials = useCallback(async () => {
    setAuthState({
      isAuthenticated: false,
      email: null,
      userRole: null,
      userId: null,
    });
    localStorage.removeItem('pipeline');
    localStorage.removeItem('authState');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setPipeline(null);
    setClient(null);
  }, [client, authState.isAuthenticated]);

  const requestPasswordReset = useCallback(
    async (email: string, instanceUrl: string) => {
      const newClient = new r2rClient(instanceUrl);
      try {
        console.log('email = ', email);
        await newClient.users.requestPasswordReset(email);
      } catch (error) {
        console.error('Failed to request password reset:', error);
        throw error;
      }
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, instanceUrl: string) => {
      const newClient = new r2rClient(instanceUrl);
      if (newClient) {
        try {
          await newClient.users.create({
            email: email,
            password: password,
          });
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
    type ActualTokenResponse = {
      results: {
        accessToken: { token: string };
        refreshToken: { token: string };
      };
    };
    if (authState.isAuthenticated && client) {
      if (
        lastLoginTime &&
        Date.now() - lastLoginTime < 5 * 60 * 1000 // 5 minutes
      ) {
        return;
      }
      try {
        const newTokens =
          (await client.users.refreshAccessToken()) as unknown as ActualTokenResponse;

        localStorage.setItem(
          'accessToken',
          newTokens.results.accessToken.token
        );
        localStorage.setItem(
          'refreshToken',
          newTokens.results.refreshToken.token
        );
        client.setTokens(
          newTokens.results.accessToken.token,
          newTokens.results.refreshToken.token
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
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken && refreshToken) {
        newClient.setTokens(accessToken, refreshToken);
      }
      setClient(newClient);
    }
  }, [authState.isAuthenticated, pipeline, client]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authState') {
        const newAuthState = e.newValue ? JSON.parse(e.newValue) : null;
        if (newAuthState && isAuthState(newAuthState)) {
          setAuthState(newAuthState);
        }
      }
      if (e.key === 'pipeline') {
        const newPipeline = e.newValue ? JSON.parse(e.newValue) : null;
        setPipeline(newPipeline);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
      localStorage.setItem('selectedModel', selectedModel);
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
      logout,
      unsetCredentials,
      register,
      requestPasswordReset,
      verifyEmail,
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
      logout,
      unsetCredentials,
      register,
      requestPasswordReset,
      getClient,
      verifyEmail,
    ]
  );

  if (!isReady) {
    return null;
  }

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
