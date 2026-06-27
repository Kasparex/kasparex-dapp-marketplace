'use client';

import { useState } from 'react';
import type { RevenueTreeContentType } from '@/lib/revenue-tree/types';

interface ReferralLinkBoxProps {
  referralLink: string;
  isActive: boolean;
  contentType?: RevenueTreeContentType;
}

export function ReferralLinkBox({ referralLink, isActive }: ReferralLinkBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isActive) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Inactive</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Spend 100 KAS to unlock your referral link.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          Active link
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Refer and earn</span>
      </div>
      <div className="k-input font-mono text-xs break-all py-3">{referralLink}</div>
      <button type="button" onClick={handleCopy} className="k-cta-primary w-full !justify-center !text-xs">
        {copied ? 'Copied!' : 'Copy invitation link'}
      </button>
    </div>
  );
}
