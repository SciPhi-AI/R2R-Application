import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React from 'react';

import { Button } from '@/components/ui/Button';

export function CreatePipelineHeader() {
  const router = useRouter();

  const createPipeline = async () => {
    posthog.capture('Dashboard: WatchPipelineClicked');
    router.push('/watch');
  };

  return (
    <div className="flex justify-between w-full mt-2">
      <Button
        className="h-10 w-40 py-2.5"
        variant={'filled'}
        onClick={createPipeline}
      >
        Connect to R2R
      </Button>
    </div>
  );
}
