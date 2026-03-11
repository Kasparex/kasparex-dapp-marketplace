'use client';

import { useState } from 'react';
import type { RevenueTreeContentType } from '@/lib/revenue-tree/types';

interface ReferralLinkBoxProps {
  referralLink: string;
  isActive: boolean;
  contentType?: RevenueTreeContentType;
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
      <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shadow-[0_0_4px_rgba(0,0,0,0.1)]"></div>
                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">Inactive</span>
            </div>
            <div className="text-sm font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                Spend 100 KAS to Unlock Link
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#02abb8]/5 to-purple-500/5 border border-[#02abb8]/20 dark:border-[#02abb8]/10 shadow-lg shadow-[#02abb8]/5">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active System Link</span>
            </div>
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Refer & Earn</span>
        </div>
        <div className="relative group">
            <div className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 break-all bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 group-hover:border-[#02abb8]/30 transition-all shadow-inner">
                {referralLink}
            </div>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="w-full py-3.5 bg-gradient-to-r from-[#02abb8] to-purple-500 hover:from-[#0299a6] hover:to-purple-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#02abb8]/20 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        {copied ? (
          <>
            <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Link Saved!
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Invitation Link
          </>
        )}
      </button>
    </div>
  );
}
