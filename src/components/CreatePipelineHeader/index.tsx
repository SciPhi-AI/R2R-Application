import { useRouter } from 'next/router';
import React from 'react';

import { Button } from '@/components/ui/Button';

export function CreatePipelineHeader() {
  const router = useRouter();

  const createPipeline = async () => {
    router.push('/watch');
  };

  return (
    <div className="flex justify-between w-full mt-2">
      <Button
        className="h-10 w-40 py-2.5"
        variant={'filled'}
        onClick={createPipeline}
      >
        Watch a New Pipeline
      </Button>
    </div>
  );
}
