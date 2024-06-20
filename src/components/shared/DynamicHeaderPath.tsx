import { useRouter } from 'next/router';
import React from 'react';

import { Logo } from '@/components/shared/Logo';
import { Code } from '@/components/ui/Code';

import { capitalizeFirstLetter } from '@/lib/utils';

const DynamicHeaderPath = () => {
  const router = useRouter();

  const isPipelineRoute = router.pathname.includes('/pipeline/');
  const pathSegments = isPipelineRoute
    ? router.asPath.split('/').filter(Boolean)
    : [];
  const pipelineId = pathSegments.length > 1 ? pathSegments[1] : null;
  const afterPipelineSegment = pathSegments.length > 2 ? pathSegments[2] : null;

  const redirectToHome = () => {
    router.push('/');
  };

  return (
    <div>
      <ul role="list" className="flex items-center gap-3 pt-2">
        <Logo width={38} height={38} />
        <Code onClick={redirectToHome} style={{ cursor: 'pointer' }}>
          <span className="text-zinc-800 dark:text-zinc-400 ">
            R2R Dashboard{' '}
          </span>{' '}
        </Code>
        {isPipelineRoute && (
          <>
            <Code>{`>>`}</Code>
            <Code>
              <span className="text-indigo-500">
                {afterPipelineSegment
                  ? `${capitalizeFirstLetter(afterPipelineSegment)}:`
                  : 'Pipeline:'}
              </span>
            </Code>
            <Code>
              <span className="text-zinc-400">{pipelineId}</span>
            </Code>
          </>
        )}
      </ul>
    </div>
  );
};

export default DynamicHeaderPath;
