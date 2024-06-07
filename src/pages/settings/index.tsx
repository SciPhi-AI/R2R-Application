import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Account() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/profile');
  }, [router]);
}
