import { Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { useUserContext } from '@/context/UserContext';

const DEFAULT_DEPLOYMENT_URL = 'http://localhost:7272';

const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const { verifyEmail } = useUserContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const { verification_code, email } = router.query as {
    verification_code?: string;
    email?: string;
  };

  useEffect(() => {
    const verify = async () => {
      if (!verification_code || !email) {
        setStatus('error');
        return;
      }

      try {
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
        console.error('Email verification failed:', err);

        // If the error indicates the user is already verified, we still redirect to login
        if (String(err).toLowerCase().includes('already verified')) {
          setStatus('success');
          router.push(
            `/auth/login?verified=true&email=${encodeURIComponent(email)}`
          );
          return;
        }

        setStatus('error');
      }
    };

    verify();
  }, [verification_code, email, router, verifyEmail]);

  return (
    <Layout includeFooter={false}>
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
    </Layout>
  );
};

export default VerifyEmailPage;
