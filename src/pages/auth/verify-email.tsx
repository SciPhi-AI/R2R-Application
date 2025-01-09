import { Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';

import { SignupSplitLayout } from './signup-layout';

const DEFAULT_DEPLOYMENT_URL = 'https://api.cloud.sciphi.ai';
// const DEFAULT_DEPLOYMENT_URL = 'http://0.0.0.0:7272'; // For local development

const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const { verifyEmail } = useUserContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const { verification_code, email } = router.query as {
    verification_code: string;
    email: string;
  };

  useEffect(() => {
    const verify = async () => {
      try {
        if (!verification_code || !email) {
          console.log('verification_code = ', verification_code);
          console.log('email = ', email);
          setStatus('error');
          // return;
        }

        console.log('Attempting to verify...', email, verification_code);
        const response = await verifyEmail(
          email,
          verification_code,
          DEFAULT_DEPLOYMENT_URL
        );
        console.log('Verification response:', response);

        // If successful, redirect to login page with verification params
        setStatus('success');
        router.push(
          `/auth/login?verified=true&email=${encodeURIComponent(email)}`
        );
      } catch (err) {
        console.log('Email verification failed:', err);
        console.error('Email verification failed:', err);

        // If the error indicates the user is already verified, we still redirect to login
        if (String(err).toLowerCase().includes('already verified')) {
          setStatus('success');
          router.push(
            `/auth/login?verified=true&email=${encodeURIComponent(email)}`
          );
          return;
        } else {
          setStatus('error');
        }
      }
    };

    verify();
  }, [verification_code, email, router, verifyEmail]);

  return (
    <SignupSplitLayout>
      <div className="container">
        <div className="flex flex-col items-center justify-center h-screen p-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader className="animate-spin w-12 h-12 text-white" />
              <p className="text-white text-xl">Verifying email...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 text-white">
              <p className="text-red-500">
                Failed to verify email. Please try again or contact support.
              </p>
              <Button onClick={() => router.push('/auth/login')}>
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </SignupSplitLayout>
  );
};

export default VerifyEmailPage;
