import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Loader } from 'lucide-react';
import { useUserContext } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';

const DEFAULT_DEPLOYMENT_URL = 'http://localhost:7272';

const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const { verifyEmail } = useUserContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { verification_code, email } = router.query as { verification_code?: string; email?: string };

  useEffect(() => {
    const verify = async () => {
      if (!verification_code || !email) {
        setStatus('error');
        return;
      }

      try {
        console.log('Attempting to verify...', email, verification_code);
        const response = await verifyEmail(email, verification_code, DEFAULT_DEPLOYMENT_URL);
        console.log('Verification response:', response);

        // If successful, redirect to login page with verification params
        setStatus('success');
        router.push(`/auth/login?verified=true&email=${encodeURIComponent(email)}`);
      } catch (err) {
        console.error('Email verification failed:', err);
        
        // If the error indicates the user is already verified, we still redirect to login
        if (String(err).toLowerCase().includes('already verified')) {
          setStatus('success');
          router.push(`/auth/login?verified=true&email=${encodeURIComponent(email)}`);
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
            <p className="text-red-500">Failed to verify email. Please try again or contact support.</p>
            <Button onClick={() => router.push('/auth/login')}>Go to Login</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerifyEmailPage;



// // pages/auth/verify-email.tsx
// import { useRouter } from 'next/router';
// import { useEffect, useState } from 'react';
// import Layout from '@/components/Layout';
// import { Loader } from 'lucide-react';
// import { useUserContext } from '@/context/UserContext';
// import { Button } from '@/components/ui/Button';

// // const DEFAULT_DEPLOYMENT_URL = 'https://cloud.sciphi.ai';
// const DEFAULT_DEPLOYMENT_URL = 'http://localhost:7272'; // # .sciphi.ai';


// const VerifyEmailPage: React.FC = () => {
//   const router = useRouter();
//   const { verifyEmail } = useUserContext();
//   const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
//   const { verification_code, email } = router.query as { verification_code?: string; email?: string };
//   console.log(" on verify email....")
//   useEffect(() => {
//     const verify = async () => {
//       if (!verification_code || !email) {
//         setStatus('error');
//         return;
//       }

//       try {
//         // const client = await getClient();
//         // if (!client) {
//         //   throw new Error('No authenticated client available');
//         // }

//         // Assuming verifyEmail is now done via `client.users.verifyEmail`
//         console.log('attempting to verify...')
//         const response = await verifyEmail(email, verification_code, DEFAULT_DEPLOYMENT_URL)
//         console.log('response = ', response)

//         // If successful
//         setStatus('success');
//         // Redirect after a short delay or immediately
//         router.push('/auth/login');
//       } catch (err) {
//         if (String(err).includes('already verified')) {
//             setStatus('success');
//             // Redirect after a short delay or immediately
//             router.push('/auth/login');
//         }

//         console.error('Email verification failed:', err);
//         setStatus('error');
//       }
//     };

//     verify();
//   }, [verification_code, email, router]);

//   return (
//     <Layout includeFooter={false}>
//       <div className="flex flex-col items-center justify-center h-screen p-8">
//         {status === 'loading' && (
//           <div className="flex flex-col items-center space-y-4">
//             <Loader className="animate-spin w-12 h-12 text-white" />
//             <p className="text-white text-xl">Verifying email...</p>
//           </div>
//         )}

//         {status === 'error' && (
//           <div className="flex flex-col items-center space-y-4 text-white">
//             <p className="text-red-500">Failed to verify email. Please try again or contact support.</p>
//             <Button onClick={() => router.push('/auth/login')}>Go to Login</Button>
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default VerifyEmailPage;
