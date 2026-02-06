'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { formatDate } from '@/lib/vblog/utils';

interface ArticleSidebarProps {
    article: VBlogArticle;
}

export function ArticleSidebar({ article }: ArticleSidebarProps) {
    // Mock data for KREX and NFT holdings - in a real app, these would come from hooks
    const krexHoldings = 12500;
    const nftHoldings = 3;

    const benefits = [
        { label: 'Fee Discount', value: '25%', active: true },
        { label: 'Priority Publishing', value: 'Active', active: true },
        { label: 'Premium Tags', value: 'Unlocked', active: true },
    ];

    return (
        <div className="space-y-6">
            {/* KREX Holdings Box */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">KREX Holdings</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{krexHoldings.toLocaleString()} <span className="text-xs text-orange-500 lowercase pr-1">krex</span></div>
            </div>

            {/* NFT Holdings & Benefits Box */}
            <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Holder Benefits</span>
                </div>

                <div className="mb-4">
                    <div className="text-xl font-black text-white">{nftHoldings} <span className="text-xs text-zinc-500 uppercase">NFTs Owned</span></div>
                </div>

                <div className="space-y-2">
                    {benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-zinc-500">{benefit.label}</span>
                            <span className="text-orange-500">{benefit.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Relocated On-chain Metadata Box */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    On-chain Metadata
                </h4>

                <div className="space-y-4">
                    <div>
                        <span className="block text-[8px] font-black uppercase tracking-tighter text-zinc-400 mb-1">Article CID (IPFS)</span>
                        <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 break-all p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            {article.cid || 'Not yet published'}
                        </code>
                    </div>
                    {article.txHash && (
                        <div>
                            <span className="block text-[8px] font-black uppercase tracking-tighter text-zinc-400 mb-1">Kaspa Transaction</span>
                            <code className="block text-[10px] font-mono text-zinc-600 dark:text-zinc-400 break-all p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                {article.txHash}
                            </code>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400">Network</span>
                        <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">Kaspa Mainnet</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
