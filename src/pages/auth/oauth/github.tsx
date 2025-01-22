import { useRouter } from 'next/router';
import { r2rClient } from 'r2r-js';
import React, { useEffect } from 'react';
import { ClipLoader } from 'react-spinners';

import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext'; // Adjust your import path as necessary

// Default URLs as fallbacks
const DEFAULT_PRODUCTION_URL = 'https://api.cloud.sciphi.ai';
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

const GoogleOAuthCallback: React.FC = () => {
  const router = useRouter();
  const { loginWithTokens } = useUserContext();

  useEffect(() => {
    // Extract `code` and `state` from query params
    if (!router.isReady) {
      console.log('returning....');
      return;
    }

    const { code, state } = router.query;
    console.log('code = ', code);
    console.log('state = ', state);
    // // If `code` or `state` is missing, handle the error
    if (!code || !state) {
      console.error('Missing code or state in query params.');
      // Optionally redirect the user or show an error
      // router.push('/auth/error'); // Adjust the error page route if necessary
      return;
    }

    // // Convert them to string if they're an array
    const authorizationCode = Array.isArray(code) ? code[0] : code;
    const oauthState = Array.isArray(state) ? state[0] : state;
    const client = new r2rClient(DEFAULT_DEPLOYMENT_URL);

    const handleOAuth = async () => {
      try {
        // Send the `code` to your backend for token exchange
        // const response = await fetch(`${DEFAULT_DEPLOYMENT_URL}/users/oauth/google/callback`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({ code: authorizationCode, state: oauthState }),
        // });

        // if (!response.ok) {
        //   const error = await response.json();
        //   console.error('Failed to complete OAuth login:', error);
        // //   router.push('/auth/error'); // Adjust the error page route if necessary
        //   return;
        // }
        const response = await client.users.oauthGithubCallback({
          code: authorizationCode,
          state: oauthState,
        });
        console.log('response = ', response);

        const { accessToken, refreshToken } = response;

        loginWithTokens(
          accessToken.token,
          refreshToken.token,
          DEFAULT_DEPLOYMENT_URL
        );

        // // Store tokens and user information in context/localStorage
        // setAuthState({
        //   isAuthenticated: true,
        //   accessToken: access_token,
        //   refreshToken: refresh_token,
        // //   email: user.email,
        // //   userId: user.id,
        // });

        // Redirect to home or dashboard
        await new Promise((resolve) => setTimeout(resolve, 1500));
        router.push('/');
      } catch (err) {
        console.error('Error during OAuth handling:', err);
        // router.push('/auth/error'); // Adjust the error page route if necessary
      }
    };

    handleOAuth();
  }, [router]);

  return (
    <Layout includeFooter={false}>
      <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-zinc-900">
        <ClipLoader color="#888" size={60} />
        <p className="text-gray-700 dark:text-gray-300 mt-4">
          Authenticating...
        </p>
      </div>
    </Layout>
  );
};

export default GoogleOAuthCallback;
