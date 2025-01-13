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

// Initialize the UserContext with default values.
const UserContext = createContext<UserContextProps>({
  pipeline: null,
  setPipeline: () => {},
  selectedModel: 'null',
  setSelectedModel: () => {},
  isAuthenticated: false,
  login: async () => ({ success: false, userRole: 'user' }),
  loginWithTokens: async () => ({ success: false, userRole: 'user' }),
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
  setAuthState: () => {},
  completeOAuthLogin: () => {},
  requestPasswordReset: async () => {},
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

  // Basic readiness state for the provider
  const [isReady, setIsReady] = useState(false);

  // This will hold our r2rClient instance
  const [client, setClient] = useState<r2rClient | null>(null);

  // Example of user switching between "admin" or "user" modes in the UI
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');

  console.log('[UserContext] Rendering UserProvider...');

  /**
   * Pipeline state (deploymentUrl, etc.), persisted in localStorage
   */
  const [pipeline, setPipeline] = useState<Pipeline | null>(() => {
    if (typeof window !== 'undefined') {
      const storedPipeline = localStorage.getItem('pipeline');
      if (storedPipeline) {
        console.log(
          '[UserContext] Found pipeline in localStorage:',
          storedPipeline
        );
        return JSON.parse(storedPipeline);
      }
    }
    return null;
  });

  /**
   * Selected Model state, also persisted in localStorage
   */
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedModel = localStorage.getItem('selectedModel') || '';
      console.log(
        '[UserContext] Found selectedModel in localStorage:',
        storedModel
      );
      return storedModel;
    }
    return 'null';
  });

  /**
   * Main Auth State (isAuthenticated, userRole, etc.), persisted in localStorage
   */
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      const storedAuthState = localStorage.getItem('authState');
      if (storedAuthState) {
        try {
          const parsed = JSON.parse(storedAuthState);
          if (isAuthState(parsed)) {
            console.log(
              '[UserContext] Found authState in localStorage:',
              parsed
            );
            return parsed;
          } else {
            console.warn(
              '[UserContext] Invalid authState in localStorage. Resetting to default.'
            );
          }
        } catch (parseError) {
          console.error(
            '[UserContext] Error parsing authState from localStorage:',
            parseError
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

  // Track the time of last successful login or token refresh
  const [lastLoginTime, setLastLoginTime] = useState<number | null>(null);

  // Once we mount, set isReady to true
  useEffect(() => {
    console.log('[UserContext] Setting isReady = true');
    setIsReady(true);
  }, []);

  /**
   * Simple "isSuperUser" example
   */
  const isSuperUser = useCallback(() => {
    console.log('[UserContext] Checking if user is superuser...');
    // Put real logic here if needed
    return false;
  }, []);

  /**
   * logout => calls backend .users.logout() if authenticated, then clears local storage
   */
  const logout = useCallback(async () => {
    console.log(
      '[UserContext] logout called, isAuthenticated =',
      authState.isAuthenticated
    );

    if (client && authState.isAuthenticated) {
      try {
        console.log('[UserContext] Attempting to call backend users.logout()');
        await client.users.logout();
      } catch (error) {
        console.error('[UserContext] Logout failed:', error);
      }
    }

    console.log('[UserContext] Clearing auth state & localStorage');
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

  /**
   * createAutoRefreshClient => instantiates a new r2rClient with relevant callbacks
   */
  const createAutoRefreshClient = useCallback(
    (baseUrl: string): r2rClient => {
      console.log(
        '[UserContext] Creating new r2rClient with baseUrl =',
        baseUrl
      );
      const newClient = new r2rClient(baseUrl, true, {
        enableAutoRefresh: true,
        getTokensCallback: () => {
          const accessToken = localStorage.getItem('accessToken');
          const refreshToken = localStorage.getItem('refreshToken');
          console.log(
            '[UserContext] getTokensCallback => accessToken:',
            accessToken,
            'refreshToken:',
            refreshToken
          );
          return {
            accessToken,
            refreshToken,
          };
        },
        setTokensCallback: (accessToken, refreshToken) => {
          console.log(
            '[UserContext] setTokensCallback => updating tokens in localStorage...'
          );
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
          } else {
            localStorage.removeItem('accessToken');
          }
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          } else {
            localStorage.removeItem('refreshToken');
          }
        },
        onRefreshFailedCallback: () => {
          console.warn(
            '[UserContext] onRefreshFailedCallback => calling logout()'
          );
          logout();
        },
      });

      return newClient;
    },
    [logout]
  );

  /**
   * loginWithTokens => used for pre-existing tokens (e.g. OAuth callback)
   */
  const loginWithTokens = useCallback(
    async (
      accessToken: string,
      refreshToken: string,
      instanceUrl: string
    ): Promise<{ success: boolean; userRole: 'admin' | 'user' }> => {
      console.log('[UserContext] loginWithTokens => instanceUrl:', instanceUrl);
      const newClient = createAutoRefreshClient(instanceUrl);

      try {
        console.log('[UserContext] Storing tokens in localStorage');
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        console.log('[UserContext] Setting tokens on new client');
        newClient.setTokens(accessToken, refreshToken);

        setClient(newClient);

        console.log('[UserContext] Fetching user info => newClient.users.me()');
        const userInfo = await newClient.users.me();
        console.log('[UserContext] userInfo =>', userInfo);

        let userRole: 'admin' | 'user' = 'user';
        // If you have a separate admin check, put it here
        userRole = 'admin';

        const newAuthState: AuthState = {
          isAuthenticated: true,
          email: userInfo.results.email,
          userRole,
          userId: userInfo.results.id,
          metadata: userInfo.results.metadata,
        };
        console.log('[UserContext] Setting authState =>', newAuthState);
        setAuthState(newAuthState);
        localStorage.setItem('authState', JSON.stringify(newAuthState));

        setLastLoginTime(Date.now());

        // Also store pipeline
        const newPipeline: Pipeline = { deploymentUrl: instanceUrl };
        console.log('[UserContext] Setting pipeline =>', newPipeline);
        setPipeline(newPipeline);
        localStorage.setItem('pipeline', JSON.stringify(newPipeline));

        return { success: true, userRole };
      } catch (error) {
        console.error('[UserContext] loginWithTokens failed:', error);
        throw error;
      }
    },
    [createAutoRefreshClient]
  );

  /**
   * login => calls standard login endpoint with email/password => store tokens => create client => load user
   */
  const login = useCallback(
    async (
      email: string,
      password: string,
      instanceUrl: string
    ): Promise<{ success: boolean; userRole: 'admin' | 'user' }> => {
      console.log(
        '[UserContext] login => email:',
        email,
        ' instanceUrl:',
        instanceUrl
      );
      const newClient = createAutoRefreshClient(instanceUrl);

      try {
        console.log('[UserContext] Attempting newClient.users.login(...)');
        const tokens = await newClient.users.login({
          email,
          password,
        });
        console.log('[UserContext] login => got tokens:', tokens);

        localStorage.setItem('accessToken', tokens.results.accessToken.token);
        localStorage.setItem('refreshToken', tokens.results.refreshToken.token);

        newClient.setTokens(
          tokens.results.accessToken.token,
          tokens.results.refreshToken.token
        );

        setClient(newClient);

        console.log('[UserContext] Attempting newClient.users.me()');
        const userInfo = await newClient.users.me();
        console.log('[UserContext] userInfo =>', userInfo);

        let userRole: 'admin' | 'user' = 'user';
        // If you have an admin-check endpoint, do it here
        userRole = 'admin';

        const newAuthState: AuthState = {
          isAuthenticated: true,
          email,
          userRole,
          userId: userInfo.results.id,
          metadata: userInfo.results.metadata,
        };
        console.log('[UserContext] Setting authState =>', newAuthState);
        setAuthState(newAuthState);
        localStorage.setItem('authState', JSON.stringify(newAuthState));

        setLastLoginTime(Date.now());

        const newPipeline: Pipeline = { deploymentUrl: instanceUrl };
        console.log('[UserContext] Setting pipeline =>', newPipeline);
        setPipeline(newPipeline);
        localStorage.setItem('pipeline', JSON.stringify(newPipeline));

        return { success: true, userRole };
      } catch (error) {
        console.error('[UserContext] login => failed:', error);
        throw error;
      }
    },
    [createAutoRefreshClient]
  );

  /**
   * Example: verifyEmail
   */
  const verifyEmail = useCallback(
    async (email: string, verificationCode: string, instanceUrl: string) => {
      console.log('[UserContext] verifyEmail => instanceUrl:', instanceUrl);
      const newClient = new r2rClient(instanceUrl); // If you want autoRefresh here, you could do so
      try {
        await newClient.users.verifyEmail({
          email,
          verification_code: verificationCode,
        } as any);
      } catch (error) {
        console.error('[UserContext] verifyEmail => failed:', error);
        throw error;
      }
    },
    []
  );

  /**
   * unsetCredentials => clear local state but do NOT call backend logout
   */
  const unsetCredentials = useCallback(async () => {
    console.log(
      '[UserContext] unsetCredentials => clearing local user state (no backend logout)'
    );
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
  }, []);

  /**
   * requestPasswordReset
   */
  const requestPasswordReset = useCallback(
    async (email: string, instanceUrl: string) => {
      console.log(
        '[UserContext] requestPasswordReset => email:',
        email,
        ' instanceUrl:',
        instanceUrl
      );
      const newClient = new r2rClient(instanceUrl);
      try {
        await newClient.users.requestPasswordReset(email);
      } catch (error) {
        console.error('[UserContext] requestPasswordReset => failed:', error);
        throw error;
      }
    },
    []
  );

  /**
   * register => create new user
   */
  const register = useCallback(
    async (email: string, password: string, instanceUrl: string) => {
      console.log(
        '[UserContext] register => email:',
        email,
        ' instanceUrl:',
        instanceUrl
      );
      const newClient = new r2rClient(instanceUrl);
      try {
        await newClient.users.create({ email, password });
      } catch (error) {
        console.error('[UserContext] register => failed:', error);
        throw error;
      }
    },
    []
  );

  /**
   * completeOAuthLogin => finalize an OAuth flow by setting tokens & user
   */
  const completeOAuthLogin = useCallback(
    (instanceUrl: string, accessToken: string, refreshToken: string) => {
      console.log(
        '[UserContext] completeOAuthLogin => instanceUrl:',
        instanceUrl
      );
      const newClient = createAutoRefreshClient(instanceUrl);

      newClient.setTokens(accessToken, refreshToken);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setClient(newClient);

      // For a real flow, fetch user info. Here we just set a mock user
      setAuthState({
        isAuthenticated: true,
        email: 'test@gmail.com',
        userRole: 'user',
        userId: 'XXX',
      });

      const newPipeline: Pipeline = { deploymentUrl: instanceUrl };
      console.log('[UserContext] Setting pipeline =>', newPipeline);
      setPipeline(newPipeline);
      localStorage.setItem('pipeline', JSON.stringify(newPipeline));
    },
    [createAutoRefreshClient]
  );

  /**
   * Optional: Periodic token refresh
   */
  const refreshTokenPeriodically = useCallback(async () => {
    console.log(
      '[UserContext] refreshTokenPeriodically => checking if we should refresh'
    );
    type ActualTokenResponse = {
      results: {
        accessToken: { token: string };
        refreshToken: { token: string };
      };
    };

    if (authState.isAuthenticated && client) {
      console.log('[UserContext] user is authenticated & client exists');
      if (lastLoginTime && Date.now() - lastLoginTime < 5 * 60 * 1000) {
        console.log(
          '[UserContext] lastLoginTime is less than 5 min ago => skipping refresh'
        );
        return;
      }
      try {
        console.log(
          '[UserContext] calling client.users.refreshAccessToken()...'
        );
        const newTokens =
          (await client.users.refreshAccessToken()) as unknown as ActualTokenResponse;

        console.log(
          '[UserContext] refreshAccessToken => success, newTokens:',
          newTokens
        );

        // Store in localStorage
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
        console.error(
          '[UserContext] refreshTokenPeriodically => failed:',
          error
        );
        if (error instanceof AuthenticationError) {
          console.warn(
            '[UserContext] got AuthenticationError => silent re-auth not implemented => logging out'
          );
          try {
            throw new Error('Silent re-authentication not implemented');
          } catch (loginError) {
            console.error(
              '[UserContext] silent re-auth also failed => logging out:',
              loginError
            );
            await logout();
          }
        } else {
          console.error('[UserContext] refresh error => calling logout...');
          await logout();
        }
      }
    } else {
      console.log(
        '[UserContext] Either not authenticated or no client => skipping refresh'
      );
    }
  }, [authState.isAuthenticated, client, lastLoginTime, logout]);

  /**
   * Provide a getter for the current client
   */
  const getClient = useCallback((): r2rClient | null => {
    console.log('[UserContext] getClient => returning client');
    return client;
  }, [client]);

  /**
   * If user is authenticated but we have no client, create one
   */
  useEffect(() => {
    console.log(
      '[UserContext] useEffect => checking if we need to create a new r2rClient...'
    );
    if (authState.isAuthenticated && pipeline && !client) {
      console.log(
        '[UserContext] isAuthenticated = true, pipeline exists, but client is null => creating newClient'
      );
      const newClient = createAutoRefreshClient(pipeline.deploymentUrl);

      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      console.log(
        '[UserContext] found tokens => accessToken:',
        accessToken,
        ' refreshToken:',
        refreshToken
      );

      if (accessToken && refreshToken) {
        newClient.setTokens(accessToken, refreshToken);
      }
      setClient(newClient);
    }
  }, [authState.isAuthenticated, pipeline, client, createAutoRefreshClient]);

  /**
   * Listen to localStorage changes (authState, pipeline) in case they're updated in another tab
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log(
        '[UserContext] handleStorageChange => key:',
        e.key,
        ' newValue:',
        e.newValue
      );
      if (e.key === 'authState') {
        const newAuthState = e.newValue ? JSON.parse(e.newValue) : null;
        if (newAuthState && isAuthState(newAuthState)) {
          console.log(
            '[UserContext] Updating authState from storage event =>',
            newAuthState
          );
          setAuthState(newAuthState);
        }
      }
      if (e.key === 'pipeline') {
        const newPipeline = e.newValue ? JSON.parse(e.newValue) : null;
        console.log(
          '[UserContext] Updating pipeline from storage event =>',
          newPipeline
        );
        setPipeline(newPipeline);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Optional: set up periodic refresh => first after 5 minutes, then every 55 minutes
   */
  useEffect(() => {
    if (authState.isAuthenticated) {
      console.log(
        '[UserContext] Setting up periodic refresh => 5 min initial delay, then 55 min intervals'
      );
      let refreshInterval: NodeJS.Timeout;
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
        if (refreshInterval) clearInterval(refreshInterval);
      };
    }
  }, [authState.isAuthenticated, refreshTokenPeriodically]);

  /**
   * Keep 'selectedModel' in localStorage
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(
        '[UserContext] Updating localStorage.selectedModel =>',
        selectedModel
      );
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

  /**
   * Final context value (all methods, states, etc.)
   */
  const contextValue = React.useMemo(
    () => ({
      pipeline,
      setPipeline,
      selectedModel,
      setSelectedModel,
      isAuthenticated: authState.isAuthenticated,
      setAuthState,
      authState,
      login,
      loginWithTokens,
      logout,
      unsetCredentials,
      register,
      requestPasswordReset,
      completeOAuthLogin,
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
      loginWithTokens,
      logout,
      unsetCredentials,
      register,
      requestPasswordReset,
      completeOAuthLogin,
      verifyEmail,
      getClient,
    ]
  );

  // If not ready yet, render nothing or a loading spinner
  if (!isReady) {
    console.log('[UserContext] Not ready => returning null or a spinner');
    return null;
  }

  // Otherwise, render children with the context provided
  console.log('[UserContext] Ready => rendering Provider');
  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
