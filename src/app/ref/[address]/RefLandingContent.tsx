'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { setCurrentReferrer } from '@/lib/revenue-tree/referral';

interface RefLandingContentProps {
  referrerAddress: string;
}

export function RefLandingContent({ referrerAddress }: RefLandingContentProps) {
  useEffect(() => {
    setCurrentReferrer(referrerAddress);
  }, [referrerAddress]);

  const short = `${referrerAddress.slice(0, 10)}…${referrerAddress.slice(-8)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
          You were referred
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Referrer: <span className="font-mono text-sm text-zinc-800 dark:text-zinc-200">{short}</span>
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          When you connect your wallet and use dApps, we’ll set this referrer once so you join their Revenue Tree.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#02abb8] hover:bg-[#0299a6] text-white font-bold rounded-lg transition-colors"
          >
            Browse dApps
          </Link>
          <Link
            href="/revenue-tree/dashboard"
            className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg transition-colors"
          >
            Revenue Tree
          </Link>
        </div>
      </div>
    </div>
  );
}
