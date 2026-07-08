'use client';

import Link from 'next/link';

interface RefLandingContentProps {
  referrerAddress: string;
}

export function RefLandingContent({ referrerAddress }: RefLandingContentProps) {
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
          Explore Kasparex dApps and hub projects to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dapps" className="k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8]">
            Browse dApps
          </Link>
          <Link href="/hub" className="k-control-btn">
            Open Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
