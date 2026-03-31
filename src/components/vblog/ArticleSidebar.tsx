'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { AdSlider } from '@/components/ads/AdSlider';

interface ArticleSidebarProps {
    article: VBlogArticle;
}

export function ArticleSidebar({ article }: ArticleSidebarProps) {
    const { balance, tier } = useKREXBalance();
    const { nfts } = useNFTStatus();
    const holderDiscount = krexTierDiscountPercent(tier);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-[#02abb8]/10 rounded-lg flex items-center justify-center text-[#02abb8]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-[#02abb8]">KREX holder status</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {balance.toLocaleString()} <span className="text-xs text-[#02abb8] lowercase pr-1">krex</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Tier: <span className="font-bold text-zinc-900 dark:text-zinc-100">{tier}</span> ({holderDiscount}% discount)
                </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-zinc-200/60 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-[#02abb8]">NFT holdings</span>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Total NFTs</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{nfts.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Slots eligible</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{nfts.length > 0 ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    On-chain Metadata
                </h4>

                <div className="space-y-4">
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Article CID (IPFS)</span>
                        <code className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 break-all p-2 bg-white/70 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            {article.cid || 'Not yet published'}
                        </code>
                    </div>
                    {article.txHash && (
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Kaspa Transaction</span>
                            <code className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 break-all p-2 bg-white/70 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                {article.txHash}
                            </code>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Network</span>
                        <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">Kaspa Mainnet</span>
                    </div>
                </div>
            </div>

            <div
                id="ad-slot-vblog-article-aside-bottom"
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6"
            >
                <h4 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-3">Ad slots</h4>
                <div className="flex items-center justify-center min-h-[200px]">
                    <AdSlider slotId="VBLOG_ARTICLE_ASIDE_BOTTOM" />
                </div>
            </div>
        </div>
    );
}
