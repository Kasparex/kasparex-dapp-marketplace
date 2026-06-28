'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { ChronicleArticleAside, type AsideSection } from '@/components/chronicles/ChronicleArticleAside';
import { AdSlider } from '@/components/ads/AdSlider';
import { AdSlotColumn } from '@/components/ads/AdSlotColumn';
import { getVBlogArticleSource } from '@/lib/vblog/source';

interface ArticleSidebarProps {
  article: VBlogArticle;
}

function getSocialMeta(href: string) {
  const normalized = href.toLowerCase();
  if (normalized.includes('x.com') || normalized.includes('twitter.com')) return 'X';
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'YouTube';
  if (normalized.includes('instagram.com')) return 'Instagram';
  if (normalized.includes('github.com')) return 'GitHub';
  return 'Link';
}

export function ArticleSidebar({ article }: ArticleSidebarProps) {
  const { balance, tier } = useKREXBalance();
  const { nfts } = useNFTStatus();
  const holderDiscount = krexTierDiscountPercent(tier);
  const links = [article.primaryLink, ...(article.socialLinks ?? [])].filter(Boolean) as string[];
  const source = getVBlogArticleSource(article);

  const sections: AsideSection[] = [
    {
      title: 'Author links',
      body:
        links.length > 0 ? (
          <ul className="space-y-2.5">
            {links.slice(0, 6).map((href, index) => (
              <li key={`${href}-${index}`}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[#02abb8] transition-colors leading-relaxed"
                >
                  {getSocialMeta(href)}
                </a>
                <span className="block kx-body mt-0.5 leading-relaxed break-all">{href}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No author links provided.</p>
        ),
    },
    {
      title: 'KREX holder status',
      body: (
        <>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {balance.toLocaleString()} <span className="text-xs text-[#02abb8] lowercase">krex</span>
          </p>
          <p className="mt-2">
            Tier: <span className="font-bold text-zinc-900 dark:text-zinc-100">{tier}</span> ({holderDiscount}% discount)
          </p>
        </>
      ),
    },
    {
      title: 'NFT holdings',
      body: (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Total NFTs</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{nfts.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Slots eligible</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{nfts.length > 0 ? 'Yes' : 'No'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'On-chain metadata',
      body: (
        <div className="space-y-4">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Article CID (IPFS)</span>
            <code className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 break-all p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {article.cid || 'Not yet published'}
            </code>
          </div>
          {article.txHash ? (
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Kaspa Transaction</span>
              <code className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 break-all p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {article.txHash}
              </code>
            </div>
          ) : null}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Source</span>
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">{source}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Network</span>
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">Kaspa Mainnet</span>
          </div>
        </div>
      ),
    },
  ];

  if (article.linkedMagazineId && article.linkedIssueNumber) {
    sections.unshift({
      title: 'Magazine link',
      links: [
        {
          href: `/magazines/issue/${article.linkedMagazineId}/${article.linkedIssueNumber}`,
          label: `Issue #${article.linkedIssueNumber}`,
          sublabel: 'View syndicated magazine issue',
        },
      ],
    });
  }

  return (
    <ChronicleArticleAside
      sections={sections}
      topContent={
        <div
          id="ad-slot-vblog-article-aside-top"
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
        >
          <AdSlotColumn className="rounded-lg min-h-[120px]">
            <AdSlider slotId="VBLOG_ARTICLE_ASIDE_BOTTOM" />
          </AdSlotColumn>
        </div>
      }
    />
  );
}
