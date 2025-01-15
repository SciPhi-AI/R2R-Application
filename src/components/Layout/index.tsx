import Head from 'next/head';
import { useRouter } from 'next/router';
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

import { BeaconComponent } from '@/components/BeaconComponent';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/NavBar';
import { Toaster } from '@/components/ui/toaster';
// components/Layout.tsx

import { useJoyrideContext } from '@/context/JoyrideContext';

type Props = {
  children: ReactNode;
  pageTitle?: string;
  includeFooter?: boolean;
};

const Layout: React.FC<Props> = ({
  children,
  pageTitle,
  includeFooter = true,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const {
    skipAllJoyrides,
    setSkipAllJoyrides,
    completedTours,
    markTourAsCompleted,
  } = useJoyrideContext();

  const router = useRouter();

  // A small dictionary of route => steps
  const routeSteps: Record<string, Step[]> = useMemo(
    () => ({
      '/': [
        {
          target: '.documents-index',
          content: 'Start by uploading your first document here!',
          placement: 'left',
        },
        {
          target: '.collections-index',
          content: 'Manage your documents with collections',
          placement: 'left',
        },
        {
          target: '.graphs-index',
          content: 'Build knowledge graphs from input documents',
          placement: 'left',
        },
        {
          target: '.chat-index',
          content: 'Get RAG powered Q&A and agentic responses',
          placement: 'left',
        },
        {
          target: '.monthly-requests',
          content: 'Monitor your monthly usage here',
          placement: 'top',
        },
        {
          target: '.storage-usage',
          content: 'Track total storage here',
          placement: 'top',
        },
        {
          target: '.create-new-key-button',
          content: 'Developers start here - create an API key!',
          placement: 'top',
        },
        {
          target: '.upgrade-account-button',
          content: 'Click here to upgrade your account when ready.',
          placement: 'top',
        },
      ],
      // '/documents': [
      //   {
      //     target: '.documents-ingest-button',
      //     content: 'Upload your first document here!',
      //   },
      // ],
      // Add more routes => steps as needed
    }),
    []
  );

  // If the user has already completed or skipped a route, or if skipAll is on, we skip
  const stepsForRoute = routeSteps[router.pathname] || [];
  const shouldRunTour =
    !skipAllJoyrides &&
    !completedTours.includes(router.pathname) &&
    stepsForRoute.length > 0;

  // Local state for the Joyride "run" prop
  const [runJoyride, setRunJoyride] = useState(true);

  const [shouldStartTour, setShouldStartTour] = useState(false);

  useEffect(() => {
    // Delay Joyride for 2 seconds (2000ms)
    const timer = setTimeout(() => {
      setShouldStartTour(true);
    }, 5);

    // Cleanup in case user navigates away quickly
    return () => clearTimeout(timer);
  }, []);

  // React-Joyride callback
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;
      const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

      // @ts-ignore
      if (finishedStatuses?.includes(status)) {
        // Mark the entire route as completed
        markTourAsCompleted(router.pathname);
        setRunJoyride(false);
      }
    },
    [router.pathname, markTourAsCompleted]
  );

  useEffect(() => {
    // Let React know we've mounted
    setHasMounted(true);

    function handleResize() {
      if (window.innerWidth <= 500) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }

    // Run on mount
    handleResize();
    // Add listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Optionally: If you want to avoid SSR flicker, you can return null
  // until we've definitely mounted on the client.
  if (!hasMounted) {
    return null;
  }

  // If the viewport is <= 500px, we just return a “not available” screen
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-900 text-white">
        <Head>
          <title>Mobile Mode Not Available</title>
        </Head>
        <h1 className="text-xl">Mobile mode not available</h1>
      </div>
    );
  }

  // Otherwise, render the normal layout
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <Joyride
        steps={stepsForRoute}
        run={shouldStartTour && shouldRunTour && runJoyride}
        continuous
        showSkipButton
        // beaconComponent={BeaconComponent}
        callback={handleJoyrideCallback}
        tooltipComponent={(props) => {
          const {
            backProps,
            closeProps,
            primaryProps,
            skipProps,
            step,
            tooltipProps,
          } = props;
          return (
            <div
              {...tooltipProps}
              className="bg-black text-white p-4 rounded-md shadow-lg w-96"
            >
              {step.title && (
                <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
              )}
              <div>{step.content}</div>
              <div
                style={{
                  marginTop: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <button {...skipProps}>Skip Tour</button>
                <button onClick={() => setSkipAllJoyrides(true)}>
                  Disable All Tours
                </button>
                <div>
                  {/* <button {...backProps}>Back</button> */}
                  <button
                    {...primaryProps}
                    className="border border-white text-white px-4 py-1 rounded hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          );
        }}
        styles={{
          options: { zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0)' },
          beaconOuter: {
            marginLeft: '-2px',
            // borderColor: "#007948",
          },
          beaconInner: {
            backgroundColor: '#007948',
          },
          //  beaconInner:{
          //   backgroundColor: "#818cf8",
          //  },
          // //  beaconOuter:{
          // //   backgroundColor: "#818cf8",
          // //  },
          // // beacon:{
          // //   backgroundColor: "#818cf8",
          // // },
          tooltip: {
            width: '400px',
            backgroundColor: '#000',
            opacity: 1,
          },
        }}
      />

      <Head>
        <title>
          {pageTitle ? `${pageTitle} | SciPhi Cloud` : 'SciPhi Cloud'}
        </title>
      </Head>
      <Navbar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      <Toaster />
      {includeFooter && <Footer />}
    </div>
  );
};

export default Layout;
