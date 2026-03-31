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
                <h4 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-4">KREX holder status</h4>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {balance.toLocaleString()} <span className="text-xs text-[#02abb8] lowercase pr-1">krex</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Tier: <span className="font-bold text-zinc-900 dark:text-zinc-100">{tier}</span> ({holderDiscount}% discount)
                </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-4">NFT holdings</h4>

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
                <h4 className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-4">On-chain metadata</h4>

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
