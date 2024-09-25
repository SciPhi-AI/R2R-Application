import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback } from 'react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('change_me_immediately');
  const [deploymentUrl, setDeploymentUrl] = useState('http://localhost:7272');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, authState } = useUserContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await login(email, password, deploymentUrl);
      console.log(`Login successful. User role: ${result.userRole}`);
      setLoginSuccess(true);
    } catch (error) {
      console.error('Login failed:', error);
      setError(
        'Login failed. Ensure that your R2R server is running at the specified URL or check your credentials and try again.'
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
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
      });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('OAuth sign in failed:', error);
      alert('OAuth sign in failed. Please try again.');
    }
  };

  return (
    <Layout includeFooter={false}>
      <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-zinc-900">
        <div className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
              htmlFor="deploymentUrl"
            >
              R2R Deployment URL
            </label>
            <Input
              id="deploymentUrl"
              name="deploymentUrl"
              type="text"
              placeholder="R2R Deployment URL"
              value={deploymentUrl}
              onChange={(e) => setDeploymentUrl(e.target.value)}
              autoComplete="url"
            />
          </div>

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
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in with Email'}
            </Button>

            <Button
              onClick={() => handleOAuthSignIn('google')}
              color="filled"
              className="w-full my-2 relative"
            >
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <Image
                  src="/images/google-logo.svg"
                  alt="Google logo"
                  width={20}
                  height={20}
                />
              </div>
              <span className="flex-grow text-center">Sign in with Google</span>
            </Button>
            <Button
              onClick={() => handleOAuthSignIn('github')}
              color="filled"
              className="w-full my-2 relative"
            >
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <Image
                  src="/images/github-mark.svg"
                  alt="Github logo"
                  width={20}
                  height={20}
                />
              </div>
              <span className="flex-grow text-center">Sign in with GitHub</span>
            </Button>
          </div>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
