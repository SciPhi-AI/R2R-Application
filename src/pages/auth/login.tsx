import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback } from 'react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useUserContext } from '@/context/UserContext';
// import { supabase } from '@/lib/supabase'; // If not using OAuth, can be removed

const DEFAULT_DEPLOYMENT_URL = 'http://localhost:7272';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, loginWithToken, authState } = useUserContext();
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
      alert(`Login failed. Please check your credentials.\n\nError: ${errorMessage}`);
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

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (!supabase) {
      setError('Supabase client is not configured. OAuth sign-in is unavailable.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
      });
      if (error) throw error;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        await loginWithToken(session.access_token, DEFAULT_DEPLOYMENT_URL);
        setLoginSuccess(true);
      } else {
        throw new Error('No access token found after OAuth sign-in');
      }
    } catch (error) {
      console.error('OAuth sign in failed:', error);
      setError('OAuth sign in failed. Please try again.');
    }
  };

  return (
    <Layout includeFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-16">
        <div className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md flex flex-col">

          {/* Success banner after verification */}
          {verificationMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline ml-2">{verificationMessage}</span>
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
            color="filled"
            className="w-full my-2 relative"
            disabled={true}
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

          {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;


// import { Eye, EyeOff } from 'lucide-react';
// import Image from 'next/image';
// import { useRouter } from 'next/router';
// import React, { useState, useEffect, useCallback } from 'react';

// import Layout from '@/components/Layout';
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/input';
// import { useUserContext } from '@/context/UserContext';
// import debounce from '@/lib/debounce';
// import { supabase } from '@/lib/supabase';

// const DEFAULT_DEPLOYMENT_URL = 'http://localhost:7272';

// const LoginPage: React.FC = () => {
//   const [email, setEmail] = useState('admin@example.com');
//   const [password, setPassword] = useState('change_me_immediately');
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [serverHealth, setServerHealth] = useState(true); // Default to true since we're not checking initially
//   const [loginSuccess, setLoginSuccess] = useState(false);
//   const { login, loginWithToken, authState } = useUserContext();
//   const router = useRouter();

//   const [rawDeploymentUrl, setRawDeploymentUrl] = useState('');
//   const [sanitizedDeploymentUrl, setSanitizedDeploymentUrl] = useState('');

//   // Retrieve deployment URL from runtime config or use default
//   const getDeploymentUrl = () => {
//     if (
//       typeof window !== 'undefined' &&
//       window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_R2R_DEPLOYMENT_URL &&
//       !window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL.includes(
//         '__NEXT_PUBLIC_R2R_DEPLOYMENT_URL__'
//       )
//     ) {
//       return window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL;
//     }
//     return DEFAULT_DEPLOYMENT_URL;
//   };

//   // Initialize deployment URL on component mount
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const url = getDeploymentUrl();
//       setRawDeploymentUrl(url);
//       setSanitizedDeploymentUrl(url);
//     }
//   }, []);

//   // Health check function - only called after failed login attempts
//   const checkDeploymentHealth = useCallback(async () => {
//     try {
//       const response = await fetch(`${sanitizedDeploymentUrl}/v3/health`);
//       const data = await response.json();
//       const isHealthy = data.results?.message?.trim().toLowerCase() === 'ok';
//       setServerHealth(isHealthy);
//       return isHealthy;
//     } catch (error) {
//       console.error('Health check failed:', error);
//       setServerHealth(false);
//       return false;
//     }
//   }, [sanitizedDeploymentUrl]);

//   // Handle login submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError(null);
//     try {
//       const result = await login(email, password, sanitizedDeploymentUrl);
//       setLoginSuccess(true);
//     } catch (error) {
//       console.error('Login failed:', error);

//       // Only check server health after a failed login attempt
//       const isServerHealthy = await checkDeploymentHealth();

//       let errorMessage = 'An unknown error occurred';
//       if (error instanceof Error) {
//         errorMessage = error.message;
//       } else if (typeof error === 'string') {
//         errorMessage = error;
//       }

//       // Provide appropriate error message based on server health
//       const serverStatusMessage = isServerHealthy
//         ? 'The server appears to be running correctly. Please check your credentials and try again.'
//         : 'Unable to communicate with the server. Please verify the R2R server is running at the specified URL.';

//       alert(`Login failed. ${serverStatusMessage}\n\nError: ${errorMessage}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle successful login redirect
//   useEffect(() => {
//     if (loginSuccess && authState.isAuthenticated) {
//       router.push('/');
//     }
//   }, [loginSuccess, authState.isAuthenticated, router]);

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   // OAuth sign-in handler
//   const handleOAuthSignIn = async (provider: 'google' | 'github') => {
//     if (!supabase) {
//       setError(
//         'Supabase client is not configured. OAuth sign-in is unavailable.'
//       );
//       return;
//     }

//     try {
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: provider,
//       });
//       if (error) throw error;

//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (session?.access_token) {
//         await loginWithToken(session.access_token, sanitizedDeploymentUrl);
//         setLoginSuccess(true);
//       } else {
//         throw new Error('No access token found after OAuth sign-in');
//       }
//     } catch (error) {
//       console.error('OAuth sign in failed:', error);
//       setError('OAuth sign in failed. Please try again.');
//     }
//   };

//   // URL sanitization function
//   const sanitizeUrl = (url: string): string => {
//     if (
//       typeof window !== 'undefined' &&
//       window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_R2R_DEPLOYMENT_URL
//     ) {
//       const configUrl =
//         window.__RUNTIME_CONFIG__.NEXT_PUBLIC_R2R_DEPLOYMENT_URL;
//       if (!url || url === 'http://' || url === 'https://') {
//         return configUrl;
//       }
//     }

//     if (!url || url === 'http://' || url === 'https://') {
//       return DEFAULT_DEPLOYMENT_URL;
//     }

//     let sanitized = url.trim();
//     sanitized = sanitized.replace(/\/+$/, '');
//     if (!/^https?:\/\//i.test(sanitized)) {
//       sanitized = 'http://' + sanitized;
//     }
//     sanitized = sanitized.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
//     return sanitized;
//   };

//   // Debounced URL sanitization
//   const debouncedSanitizeUrl = useCallback(
//     debounce((url: string) => {
//       setSanitizedDeploymentUrl(sanitizeUrl(url));
//     }, 500),
//     []
//   );

//   useEffect(() => {
//     debouncedSanitizeUrl(rawDeploymentUrl);
//   }, [rawDeploymentUrl, debouncedSanitizeUrl]);

//   return (
//     <Layout includeFooter={false}>
//       <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-16">
//         <div className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md flex flex-col">
//           <div className="flex-grow">
//             {/* <div className="mb-4">
//               <label
//                 className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
//                 htmlFor="sanitizedDeploymentUrl"
//               >
//                 R2R Deployment URL
//               </label>
//               {serverHealth === false && (
//                 <span className="text-red-400 text-sm font-bold mb-2 block">
//                   Unable to communicate to the specified deployment. Check its
//                   status or try again.
//                 </span>
//               )}
//               <Input
//                 id="deploymentUrl"
//                 name="deploymentUrl"
//                 type="text"
//                 placeholder="R2R Deployment URL"
//                 value={rawDeploymentUrl}
//                 onChange={(e) => setRawDeploymentUrl(e.target.value)}
//                 autoComplete="url"
//               />
//             </div> */}

//             <form onSubmit={handleSubmit} className="mt-4">
//               <div className="mb-4">
//                 <div className="flex items-center justify-between">
//                   <label
//                     className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
//                     htmlFor="email"
//                   >
//                     Email
//                   </label>
//                   <span
//                     onClick={() => router.push('/auth/signup')}
//                     className="text-sm font-semibold text-indigo-400 cursor-pointer hover:underline"
//                   >
//                     Sign up with Email
//                   </span>
//                 </div>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="Email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   autoComplete="email"
//                 />
//               </div>

//               <div className="mb-6">
//                 <label
//                   className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
//                   htmlFor="password"
//                 >
//                   Password
//                 </label>
//                 <div className="relative">
//                   <Input
//                     id="password"
//                     name="password"
//                     type={showPassword ? 'text' : 'password'}
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="pr-10"
//                     autoComplete="current-password"
//                   />
//                   <button
//                     type="button"
//                     onClick={togglePasswordVisibility}
//                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-5 w-5" aria-hidden="true" />
//                     ) : (
//                       <Eye className="h-5 w-5" aria-hidden="true" />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </form>

//             <div className="mb-4">
//               <Button
//                 onClick={handleSubmit}
//                 color="filled"
//                 className="w-full my-2"
//                 disabled={isLoading}
//               >
//                 {isLoading ? 'Signing in...' : 'Sign in with Email'}
//               </Button>

//               <Button
//                 onClick={() => handleOAuthSignIn('google')}
//                 color="filled"
//                 className="w-full my-2 relative"
//                 disabled={true}
//                 tooltip="OAuth sign-in requires using the Supabase auth provider."
//               >
//                 <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
//                   <Image
//                     src="/images/google-logo.svg"
//                     alt="Google logo"
//                     width={20}
//                     height={20}
//                   />
//                 </div>
//                 <span className="flex-grow text-center">
//                   Sign in with Google
//                 </span>
//               </Button>

//               <Button
//                 onClick={() => handleOAuthSignIn('github')}
//                 color="filled"
//                 className="w-full my-2 relative"
//                 disabled={true}
//                 tooltip="OAuth sign-in requires using the Supabase auth provider."
//               >
//                 <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
//                   <Image
//                     src="/images/github-mark.svg"
//                     alt="Github logo"
//                     width={20}
//                     height={20}
//                   />
//                 </div>
//                 <span className="flex-grow text-center">
//                   Sign in with GitHub
//                 </span>
//               </Button>
//             </div>
//           </div>
//           {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default LoginPage;
