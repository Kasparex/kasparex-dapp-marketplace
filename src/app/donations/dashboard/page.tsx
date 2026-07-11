'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** My Campaigns management lives in the unified Create Campaign dashboard. */
export default function DonationsDashboardRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/donations/studio?tab=my-campaigns');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Redirecting to My campaigns…</p>
    </div>
  );
}
