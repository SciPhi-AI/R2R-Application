import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/context/UserContext';

import { SignupSplitLayout } from './signup-layout';
const PRODUCTION_URL = 'https://api.cloud.sciphi.ai';
const DEVELOPMENT_URL = 'http://0.0.0.0:7272';

// Use environment variable to determine the deployment URL
const DEFAULT_DEPLOYMENT_URL =
  process.env.NEXT_PUBLIC_ENV === 'development'
    ? DEVELOPMENT_URL
    : PRODUCTION_URL;

const RegistrationPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register } = useUserContext();
  const router = useRouter();

  const [deploymentUrl, setDeploymentUrl] = useState('');

  useEffect(() => {
    // const url = process.env.R2R_DEPLOYMENT_URL || 'https://api.cloud.sciphi.ai';
    // const url = 'http://0.0.0.0:7272'; // For local development

    setDeploymentUrl(DEFAULT_DEPLOYMENT_URL);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPasswordsMatch()) {
      setPasswordsMatch(false);
      return;
    }

    try {
      await register(email, password, deploymentUrl);
      console.log('Registration successful');
      // Instead of logging the user in, show a success banner and disable further submission.
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration failed:', error);
      alert(
        'Registration failed. Ensure that your R2R server is running at the specified URL or check your credentials and try again.'
      );
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const checkPasswordsMatch = () => {
    return password === confirmedPassword;
  };

  const handlePasswordBlur = () => {
    setPasswordsMatch(checkPasswordsMatch());
  };

  const handleGoToLogin = () => {
    console.log('handling go to login...');
    router.push('/auth/login');
  };

  return (
    <SignupSplitLayout>
      <div className="container">
        <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-zinc-900">
          {registrationSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 max-w-md w-full text-sm">
              <strong className="font-bold">Success!</strong> Your account has
              been created. We have sent a verification email to{' '}
              <strong>{email}</strong>. Please check your inbox (and spam
              folder) to verify your email before logging in.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
          >
            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                disabled={registrationSuccess}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {!registrationSuccess && (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <label
                      className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 flex-grow"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    {!passwordsMatch && (
                      <span className="text-red-400 text-sm font-bold mb-2">
                        Passwords do not match
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={handlePasswordBlur}
                      className={`pr-10 ${passwordsMatch ? '' : 'border-red-400'}`}
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

                <div className="mb-6">
                  <label
                    className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={confirmedPassword}
                      onChange={(e) => setConfirmedPassword(e.target.value)}
                      onBlur={handlePasswordBlur}
                      className={`pr-10 ${passwordsMatch ? '' : 'border-red-400'}`}
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
              </>
            )}

            <div className="flex items-center justify-between">
              {registrationSuccess ? (
                <Button
                  color="filled"
                  className="w-full"
                  onClick={handleGoToLogin}
                  type="button"
                >
                  Go to Login
                </Button>
              ) : (
                <Button color="filled" className="w-full">
                  Sign up with Email
                </Button>
              )}
            </div>
          </form>

          {!registrationSuccess && (
            <div className="text-gray-700 dark:text-gray-400 text-sm font-bold mb-2">
              <p>
                Already have an account?{' '}
                <span
                  onClick={() => router.push('/auth/login')}
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

export default RegistrationPage;
