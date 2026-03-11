'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setCurrentReferrer } from '@/lib/revenue-tree/referral';

function TreeRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    if (ref) {
      setCurrentReferrer(ref);
    }
    // Redirect to the dashboard by default
    router.replace('/tree/dashboard');
  }, [ref, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#02abb8] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Entering Revenue Tree...
        </p>
      </div>
    </div>
  );
}

export default function TreePage() {
    return (
        <Suspense>
            <TreeRedirectContent />
        </Suspense>
    );
}
