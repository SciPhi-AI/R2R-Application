import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { r2rClient } from 'r2r-js';
import React, { useState, useEffect, useCallback } from 'react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/context/UserContext';

import { SignupSplitLayout } from './signup-layout';

// Default URLs as fallbacks
const DEFAULT_PRODUCTION_URL = 'https://api.cloud.sciphi.ai';
const DEFAULT_DEVELOPMENT_URL = 'http://0.0.0.0:7272';

// Get URLs from environment variables with fallbacks
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_API_URL || DEFAULT_PRODUCTION_URL;
const DEVELOPMENT_URL = process.env.NEXT_PUBLIC_DEVELOPMENT_API_URL || DEFAULT_DEVELOPMENT_URL;

// Use environment variable to determine the deployment URL
const DEFAULT_DEPLOYMENT_URL =
  process.env.NEXT_PUBLIC_ENV === 'development'
    ? DEVELOPMENT_URL
    : PRODUCTION_URL;
    
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, authState } = useUserContext();
  const router = useRouter();

  // Remove the dynamic URL logic and always use DEFAULT_DEPLOYMENT_URL
  // const [rawDeploymentUrl, setRawDeploymentUrl] = useState('');
  // const [sanitizedDeploymentUrl, setSanitizedDeploymentUrl] = useState('');

  // No longer needed since we are removing URL customization
  // useEffect(() => {
  //   setRawDeploymentUrl(DEFAULT_DEPLOYMENT_URL);
  //   setSanitizedDeploymentUrl(DEFAULT_DEPLOYMENT_URL);
  // }, []);

  // Check if user came from a verification link
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const { verified, email: verifiedEmail } = router.query;
    if (verified === 'true' && typeof verifiedEmail === 'string') {
      setVerificationMessage(
        `Your email (${verifiedEmail}) has been successfully verified! Please log in.`
      );
      setEmail(verifiedEmail);
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Always use the default deployment URL for now
      const result = await login(email, password, DEFAULT_DEPLOYMENT_URL);
      setLoginSuccess(true);
    } catch (error) {
      console.error('Login failed:', error);

      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Simply show the error to the user
      alert(
        `Login failed. Please check your credentials.\n\nError: ${errorMessage}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful login redirect
  useEffect(() => {
    if (loginSuccess && authState.isAuthenticated) {
      router.push('/');
    }
  }, [loginSuccess, authState.isAuthenticated, router]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 1) Remove disabled = true
  // 2) Perform client.users.oauthGoogleAuthorize()
  // 3) redirect user
  const handleOAuthSignIn = useCallback(
    async (provider: 'google' | 'github') => {
      setIsLoading(true);
      setError(null);

      try {
        const client = new r2rClient(DEFAULT_DEPLOYMENT_URL);

        let redirectResult;
        if (provider === 'google') {
          // This calls your JS SDK’s users.oauthGoogleAuthorize() -> GET /users/oauth/google/authorize
          redirectResult = await client.users.oauthGoogleAuthorize();
          console.log('redirectResult = ', redirectResult);
        } else {
          redirectResult = await client.users.oauthGithubAuthorize();
        }
        // The returned shape: { redirect_url: 'https://accounts.google.com/...' }
        // @ts-ignore
        if (redirectResult?.redirectUrl) {
          // @ts-ignore
          window.location.href = redirectResult.redirectUrl;
        } else {
          // Fallback
          throw new Error('No redirect URL returned by server');
        }
      } catch (err) {
        setError(String(err));
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <SignupSplitLayout>
      <div className="container">
        <div className="flex flex-col items-center justify-center min-h-screen p-8 ">
          <div className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md flex flex-col">
            {/* Success banner after verification */}
            {verificationMessage && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <strong className="font-bold">Success!</strong>
                <span className="block sm:inline ml-2">
                  {verificationMessage}
                </span>
              </div>
            )}

            {/* Commenting out R2R Deployment URL Field */}
            {/* <div className="mb-4">
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
              value={rawDeploymentUrl}
              onChange={(e) => setRawDeploymentUrl(e.target.value)}
              autoComplete="url"
            />
          </div> */}

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
                    className="text-sm font-semibold text-accent-base cursor-pointer hover:underline"
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

              <Button
                type="submit"
                color="filled"
                className="w-full my-2"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in with Email'}
              </Button>
            </form>

            {/* OAuth buttons disabled for now */}
            <Button
              onClick={() => handleOAuthSignIn('google')}
              color="light"
              className="w-full my-2 relative"
              // disabled={true}
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
              color="light"
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

            {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
          </div>
          <div className="text-center">
            <span
              onClick={() => router.push('/auth/reset-password')}
              className="text-sm text-accent-base cursor-pointer hover:underline italic"
            >
              Forgot Password
            </span>
          </div>
        </div>
      </div>
    </SignupSplitLayout>
  );
};

export default LoginPage;
