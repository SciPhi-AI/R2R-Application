import { Eye, EyeOff, Settings } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback } from 'react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/context/UserContext';
import debounce from '@/lib/debounce';
import { supabase } from '@/lib/supabase';

const DEFAULT_DEPLOYMENT_URL = 'http://localhost:7272';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('change_me_immediately');
  const [showPassword, setShowPassword] = useState(false);
  const [showDeploymentUrl, setShowDeploymentUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverHealth, setServerHealth] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, loginWithToken, authState } = useUserContext();
  const router = useRouter();

  const [rawDeploymentUrl, setRawDeploymentUrl] = useState('');
  const [sanitizedDeploymentUrl, setSanitizedDeploymentUrl] = useState('');

  const getDeploymentUrl = () => {
    if (
      typeof window !== 'undefined' &&
      window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_R2R_DEPLOYMENT_URL &&
      !window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL.includes(
        '__NEXT_PUBLIC_R2R_DEPLOYMENT_URL__'
      )
    ) {
      return window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL;
    }
    return DEFAULT_DEPLOYMENT_URL;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = getDeploymentUrl();
      setRawDeploymentUrl(url);
      setSanitizedDeploymentUrl(url);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await login(email, password, sanitizedDeploymentUrl);
      console.log(`Login successful. User role: ${result.userRole}`);
      setLoginSuccess(true);
    } catch (error) {
      console.error('Login failed:', error);

      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      alert(
        `Login failed. Ensure that your R2R server is running at the specified URL or check your credentials and try again. \n\nError: ${errorMessage}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loginSuccess && authState.isAuthenticated) {
      router.push('/');
    }
  }, [loginSuccess, authState.isAuthenticated, router]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const redirectAfterLogin = useCallback(() => {
    if (loginSuccess && authState.isAuthenticated) {
      console.log('Redirecting to home page');
      router.push('/');
    }
  }, [loginSuccess, authState.isAuthenticated, router]);

  useEffect(() => {
    redirectAfterLogin();
  }, [redirectAfterLogin]);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (!supabase) {
      setError(
        'Supabase client is not configured. OAuth sign-in is unavailable.'
      );
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
      });
      if (error) {
        throw error;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && session.access_token) {
        await loginWithToken(session.access_token, sanitizedDeploymentUrl);
        setLoginSuccess(true);
      } else {
        throw new Error('No access token found after OAuth sign-in');
      }
    } catch (error) {
      console.error('OAuth sign in failed:', error);
      setError('OAuth sign in failed. Please try again.');
    }
  };

  const toggleDeploymentUrlVisibility = (forceShow?: boolean) => {
    setShowDeploymentUrl(
      forceShow !== undefined ? forceShow : !showDeploymentUrl
    );
  };

  const handleToggleDeploymentUrl = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    toggleDeploymentUrlVisibility();
  };

  const sanitizeUrl = (url: string): string => {
    if (
      typeof window !== 'undefined' &&
      window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_R2R_DEPLOYMENT_URL
    ) {
      const configUrl =
        window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL;

      // If the URL is empty or just a protocol, return the config URL
      if (!url || url === 'http://' || url === 'https://') {
        return configUrl;
      }
    }

    // If no config URL is available, use the default
    if (!url || url === 'http://' || url === 'https://') {
      return DEFAULT_DEPLOYMENT_URL;
    }

    let sanitized = url.trim();
    sanitized = sanitized.replace(/\/+$/, '');

    if (!/^https?:\/\//i.test(sanitized)) {
      sanitized = 'http://' + sanitized;
    }

    sanitized = sanitized.replace(/(https?:\/\/)|(\/)+/g, '$1$2');

    return sanitized;
  };

  const debouncedSanitizeUrl = useCallback(
    debounce((url: string) => {
      setSanitizedDeploymentUrl(sanitizeUrl(url));
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSanitizeUrl(rawDeploymentUrl);
  }, [rawDeploymentUrl, debouncedSanitizeUrl]);

  const checkDeploymentHealth = useCallback(async () => {
    try {
      const response = await fetch(`${sanitizedDeploymentUrl}/v3/health`);
      console.log('Health check response:', response);
      const data = await response.json();
      console.log('Health check data:', data);

      const isHealthy = data.results?.message?.trim().toLowerCase() === 'ok';

      setServerHealth(isHealthy);
      if (!isHealthy) {
        setShowDeploymentUrl(true);
      }

      return isHealthy;
    } catch (error) {
      console.error('Health check failed:', error);
      setServerHealth(false);
      setShowDeploymentUrl(true);
      return false;
    }
  }, [sanitizedDeploymentUrl]);

  useEffect(() => {
    checkDeploymentHealth();
  }, [checkDeploymentHealth, sanitizedDeploymentUrl]);

  return (
    <Layout includeFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-16">
        <div className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md flex flex-col">
          <div className="flex-grow">
            {showDeploymentUrl && (
              <div className="mb-4">
                <label
                  className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                  htmlFor="sanitizedDeploymentUrl"
                >
                  R2R Deployment URL
                </label>
                {serverHealth === false && (
                  <span className="text-red-400 text-sm font-bold mb-2 block">
                    Unable to connect to the deployment. Check its status or
                    enter a custom URL.
                  </span>
                )}
                {serverHealth === true && (
                  <span className="text-green-500 text-sm font-bold mb-2 block">
                    Successfully connected to the deployment. Only change this
                    if you&apos;re using a different deployment.
                  </span>
                )}

                <Input
                  id="deploymentUrl"
                  name="deploymentUrl"
                  type="text"
                  placeholder="R2R Deployment URL"
                  value={rawDeploymentUrl}
                  onChange={(e) => setRawDeploymentUrl(e.target.value)}
                  autoComplete="url"
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <label
                    className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <span
                    onClick={() => router.push('/auth/signup')}
                    className="text-sm font-semibold text-indigo-400 cursor-pointer hover:underline"
                  >
                    Sign up with Email
                  </span>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="mb-4">
              <Button
                onClick={handleSubmit}
                color="filled"
                className="w-full my-2"
                disabled={isLoading || !serverHealth}
              >
                {isLoading ? 'Signing in...' : 'Sign in with Email'}
              </Button>

              <Button
                onClick={() => handleOAuthSignIn('google')}
                color="filled"
                className="w-full my-2 relative"
                disabled={true}
                tooltip="OAuth sign-in requires using the Supabase auth provider."
              >
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <Image
                    src="/images/google-logo.svg"
                    alt="Google logo"
                    width={20}
                    height={20}
                  />
                </div>
                <span className="flex-grow text-center">
                  Sign in with Google
                </span>
              </Button>

              <Button
                onClick={() => handleOAuthSignIn('github')}
                color="filled"
                className="w-full my-2 relative"
                disabled={true}
                tooltip="OAuth sign-in requires using the Supabase auth provider."
              >
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <Image
                    src="/images/github-mark.svg"
                    alt="Github logo"
                    width={20}
                    height={20}
                  />
                </div>
                <span className="flex-grow text-center">
                  Sign in with GitHub
                </span>
              </Button>
            </div>

            <div className="mt-auto -mb-6 -ml-5">
              <Button
                onClick={handleToggleDeploymentUrl}
                color="transparent"
                className=""
                shape="slim"
                tooltip="Deployment Settings"
              >
                <Settings className="h-6 w-6" />
              </Button>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
