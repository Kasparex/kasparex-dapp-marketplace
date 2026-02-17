'use client';

import { useState } from 'react';

interface ReferralLinkBoxProps {
  referralLink: string;
  isActive: boolean;
  contentType?: 'dapp' | 'magazine' | 'vblog' | 'game' | 'store';
}

export function ReferralLinkBox({ referralLink, isActive, contentType = 'dapp' }: ReferralLinkBoxProps) {
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
      <div className="p-6 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="text-center">
          <div className="text-sm font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Referral link
          </div>
          <div className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase">
            INACTIVE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border-2 border-dashed border-green-500/50 dark:border-green-500/30 bg-green-500/5 dark:bg-green-500/10">
      <div className="mb-4">
        <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
          Your Referral Link
        </div>
        <div className="text-sm font-mono text-green-700 dark:text-green-300 break-all bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-green-500/20">
          {referralLink}
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="w-full py-3 bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white font-black text-sm uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </>
        )}
      </button>
    </div>
  );
}
