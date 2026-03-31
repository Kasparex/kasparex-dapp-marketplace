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
    const links = [article.primaryLink, ...(article.socialLinks ?? [])].filter(Boolean) as string[];

    const getSocialMeta = (href: string) => {
        const normalized = href.toLowerCase();
        if (normalized.includes('x.com') || normalized.includes('twitter.com')) {
            return {
                label: 'X',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l7.2 9.4M20 4l-8.4 9.6M4.4 20h4.2l11-16h-4.2L4.4 20z" />,
            };
        }
        if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) {
            return {
                label: 'YouTube',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.5a2.6 2.6 0 00-1.8-1.8C17.7 6.3 12 6.3 12 6.3s-5.7 0-7.2.4A2.6 2.6 0 003 8.5 27 27 0 002.7 12c0 1.2.1 2.3.3 3.5a2.6 2.6 0 001.8 1.8c1.5.4 7.2.4 7.2.4s5.7 0 7.2-.4a2.6 2.6 0 001.8-1.8c.2-1.2.3-2.3.3-3.5s-.1-2.3-.3-3.5zM10 9.8l5 2.2-5 2.2V9.8z" />,
            };
        }
        if (normalized.includes('instagram.com')) {
            return {
                label: 'Instagram',
                icon: <><rect x="5" y="5" width="14" height="14" rx="4" /><circle cx="12" cy="12" r="3.2" /><circle cx="16.5" cy="7.5" r="0.5" /></>,
            };
        }
        if (normalized.includes('github.com')) {
            return {
                label: 'GitHub',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a9 9 0 00-2.85 17.54c.45.08.62-.2.62-.45v-1.58c-2.52.55-3.05-1.08-3.05-1.08a2.4 2.4 0 00-1-1.33c-.82-.56.06-.55.06-.55a1.9 1.9 0 011.38.94 1.92 1.92 0 002.62.75 1.92 1.92 0 01.57-1.2c-2.01-.23-4.13-1-4.13-4.48a3.5 3.5 0 01.93-2.43 3.25 3.25 0 01.09-2.4s.76-.25 2.5.92a8.6 8.6 0 014.56 0c1.73-1.17 2.5-.92 2.5-.92.35.76.38 1.63.09 2.4a3.5 3.5 0 01.93 2.43c0 3.49-2.12 4.25-4.14 4.47a2.15 2.15 0 01.62 1.67v2.47c0 .25.16.54.63.45A9 9 0 0012 3z" />,
            };
        }
        return {
            label: 'Link',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.8 10.2l-3.6 3.6m-3.5 1a3.5 3.5 0 010-5l2-2a3.5 3.5 0 015 5l-.6.6m1.5-4.2a3.5 3.5 0 015 0 3.5 3.5 0 010 5l-2 2a3.5 3.5 0 01-5-5l.6-.6" />,
        };
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50/95 to-white dark:from-zinc-900/70 dark:to-zinc-900/45 p-5 sm:p-6">
                <h4 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-4">Author links</h4>
                {links.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {links.slice(0, 4).map((link, index) => {
                                const meta = getSocialMeta(link);
                                return (
                                    <a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer" title={meta.label} className="h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 inline-flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-[#02abb8] hover:border-[#02abb8]/40 transition-colors">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{meta.icon}</svg>
                                    </a>
                                );
                            })}
                        </div>
                        <a href={links[0]} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 break-all hover:text-[#02abb8]">
                            {links[0]}
                        </a>
                    </div>
                ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No author links provided.</p>
                )}
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
                <h4 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-4">KREX holder status</h4>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {balance.toLocaleString()} <span className="text-xs text-[#02abb8] lowercase pr-1">krex</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Tier: <span className="font-bold text-zinc-900 dark:text-zinc-100">{tier}</span> ({holderDiscount}% discount)
                </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
                <h4 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-4">NFT holdings</h4>

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
                <h4 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-4">On-chain metadata</h4>

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
                <h4 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-3">Ad slots</h4>
                <div className="flex items-center justify-center min-h-[200px]">
                    <AdSlider slotId="VBLOG_ARTICLE_ASIDE_BOTTOM" />
                </div>
            </div>
        </div>
    );
}
