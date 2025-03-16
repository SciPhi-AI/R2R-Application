import { useRouter } from 'next/router';
import { r2rClient } from 'r2r-js';
import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/context/UserContext';

import { SignupSplitLayout } from './signup-layout';

// Default URLs as fallbacks
const DEFAULT_PRODUCTION_URL = 'https://api.sciphi.ai';
const DEFAULT_DEVELOPMENT_URL = 'http://0.0.0.0:7272';

// Get URLs from environment variables with fallbacks
const PRODUCTION_URL =
  process.env.NEXT_PUBLIC_PRODUCTION_API_URL || DEFAULT_PRODUCTION_URL;
const DEVELOPMENT_URL =
  process.env.NEXT_PUBLIC_DEVELOPMENT_API_URL || DEFAULT_DEVELOPMENT_URL;

// Use environment variable to determine the deployment URL
const DEFAULT_DEPLOYMENT_URL =
  process.env.NEXT_PUBLIC_ENV === 'development'
    ? DEVELOPMENT_URL
    : PRODUCTION_URL;

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();

  // If there's a `token` in the URL, we want to show the "new password" form.
  const { token } = router.query;

  const { requestPasswordReset, getClient } = useUserContext();

  // For "forgot password" (request email) flow
  const [email, setEmail] = useState('');
  const [requestSuccessBanner, setRequestSuccessBanner] = useState(false);

  // For actual "reset password" flow
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetInProgress, setResetInProgress] = useState(false);
  const [resetSuccessBanner, setResetSuccessBanner] = useState(false);

  // For loading animation if token is present
  const [loadingToken, setLoadingToken] = useState(false);

  // If there's a token, let's show a spinner for a moment
  // (optionally you can also do a quick "validate token" call if your API supports it).
  useEffect(() => {
    if (token) {
      // Simulate checking token validity
      setLoadingToken(true);
      const timer = setTimeout(() => {
        setLoadingToken(false);
      }, 1200); // 1.2 sec spinner

      return () => clearTimeout(timer);
    }
  }, [token]);

  /**********************************************/
  /* 1) "Forgot Password" Flow - Request Email  */
  /**********************************************/
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await requestPasswordReset(email, DEFAULT_DEPLOYMENT_URL);
      setRequestSuccessBanner(true);
    } catch (error: any) {
      console.error('Password reset request failed:', error);
      alert(
        'Failed to send the password reset email. Check your connection or try again.'
      );
    }
  };

  /**************************************/
  /* 2) "Reset Password" Flow - Submit  */
  /**************************************/
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic check
    if (!token || typeof token !== 'string') {
      alert('Invalid or missing token.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match!');
      return;
    }
    // const client = await getClient();
    // console.log('client = ', client)

    try {
      const client = new r2rClient(DEFAULT_DEPLOYMENT_URL);
      setResetInProgress(true);
      // The `resetPassword` method is from your `UsersClient` in the SDK
      // which calls POST /users/reset-password with { reset_token, new_password }
      const result = await client?.users.resetPassword({
        reset_token: token,
        new_password: newPassword,
      });
      console.log('result = ', result);
      setResetSuccessBanner(true);
      // Optionally redirect after a delay, or let the user click a button
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password. The token may be invalid or expired.');
    } finally {
      setResetInProgress(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/auth/login');
  };

  // If token is present and we’re "loading/validating" it
  if (token && loadingToken) {
    return (
      <Layout includeFooter={false}>
        <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-zinc-900">
          <ClipLoader color="#888" size={60} />
          <p className="text-gray-700 dark:text-gray-300 mt-4">
            Checking token...
          </p>
        </div>
      </Layout>
    );
  }

  // If a token is found, show the "Enter new password" form
  if (token) {
    return (
      <Layout includeFooter={false}>
        <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-zinc-900">
          {resetSuccessBanner && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 max-w-md w-full text-sm">
              <strong className="font-bold">Success!</strong> Your password has
              been reset. You can now log in.
            </div>
          )}

          {!resetSuccessBanner && (
            <form
              onSubmit={handleResetSubmit}
              className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200">
                Reset Your Password
              </h2>

              <div className="mb-6">
                <label
                  className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                  htmlFor="new-password"
                >
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  disabled={resetInProgress || resetSuccessBanner}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                  htmlFor="confirm-new-password"
                >
                  Confirm New Password
                </label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirm your new password"
                  disabled={resetInProgress || resetSuccessBanner}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  color="filled"
                  className="w-full"
                  type="submit"
                  disabled={resetInProgress}
                >
                  {resetInProgress ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          )}

          <div>
            <Button
              color="secondary"
              className="w-full mt-4"
              onClick={handleGoToLogin}
              type="button"
              shape="outline_widest"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Otherwise, if no token is found in the URL, show the "Forgot Password" (request) form
  return (
    <SignupSplitLayout>
      <div className="container">
        <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-zinc-900">
          {requestSuccessBanner && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 max-w-md w-full text-sm">
              <strong className="font-bold">Success!</strong> If an account with
              that email exists, a password reset link has been sent. Please
              check your inbox (and spam folder).
            </div>
          )}

          <form
            onSubmit={handleRequestSubmit}
            className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200">
              Forgot Password
            </h2>
            <div className="mb-6">
              <label
                className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                disabled={requestSuccessBanner}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="flex items-center justify-between">
              {requestSuccessBanner ? (
                <Button
                  color="filled"
                  className="w-full"
                  onClick={handleGoToLogin}
                  type="button"
                >
                  Go to Login
                </Button>
              ) : (
                <Button color="filled" className="w-full" type="submit">
                  Send Reset Link
                </Button>
              )}
            </div>
          </form>

          {!requestSuccessBanner && (
            <div className="text-gray-700 dark:text-gray-400 text-sm font-bold">
              <p>
                Remember your password?{' '}
                <span
                  onClick={handleGoToLogin}
                  className="text-indigo-400 cursor-pointer hover:underline"
                >
                  Log in
                </span>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </SignupSplitLayout>
  );
};

export default ResetPasswordPage;
