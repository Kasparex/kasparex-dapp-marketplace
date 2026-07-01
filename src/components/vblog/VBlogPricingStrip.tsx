'use client';

import { VBLOG_ACCENT } from '@/lib/vblog/theme';

interface VBlogPricingStripProps {
  createFee: number;
  editFee: number;
}

export function VBlogPricingStrip({ createFee, editFee }: VBlogPricingStripProps) {
  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Publishing Fee</span>
        <span className="text-base font-black" style={{ color: VBLOG_ACCENT }}>
          {createFee} KAS
        </span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Edit / Update</span>
          <span className="text-base font-black" style={{ color: VBLOG_ACCENT }}>
            {editFee} KAS
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">From 1 KAS base + modules or growth</span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">On-Chain Publication</span>
        <span className="text-base font-black text-emerald-500">Enabled</span>
      </div>
    </div>
  );
}
