'use client';

import { useVBlogPricing } from '@/hooks/useVBlogPricing';

export function AuthorPricing() {
    const { createFee, editFee, deleteFee } = useVBlogPricing();

    return (
        <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Publishing Fee</span>
                    <span className="text-base font-black text-[#0884a4]">{createFee} KAS</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Edit Fee</span>
                    <span className="text-base font-black text-[#0884a4]">{editFee} KAS</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Delete Fee</span>
                    <span className="text-base font-black text-[#0884a4]">{deleteFee} KAS</span>
                </div>
            </div>
        </div>
    );
}
