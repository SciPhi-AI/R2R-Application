import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { useUserContext } from '@/context/UserContext';

// Define a more specific type for the wrapped component props
type WrappedComponentProps = { [key: string]: any };

const ProtectedRoute = <P extends WrappedComponentProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithProtection: React.FC<P> = (props) => {
    const { isAuthenticated } = useUserContext();
    const router = useRouter();

    useEffect(() => {
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
      return null; // or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  // Copy display name and other statics from WrappedComponent
  WithProtection.displayName = `WithProtection(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithProtection;
};

export default ProtectedRoute;
