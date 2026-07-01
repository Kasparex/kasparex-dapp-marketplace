'use client';

import Link from 'next/link';
import type { VBlogArticle } from '@/lib/vblog/types';
import { getMagazineIssueHref, getMagazineIssueLinkLabel } from '@/lib/magazines/routes';
import { formatAddress } from '@/lib/vblog/utils';
import { getVBlogArticleSource } from '@/lib/vblog/source';
import { Avatar } from '@/components/Avatar';
import { KxBadge } from '@/components/ui/KxBadge';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { VBlogArticleAside, type VBlogAsideSection } from '@/components/vblog/VBlogArticleAside';
import { vBlogSocialLinkUrl } from '@/lib/vblog/socialLinks';
import type { VBlogSocialLink } from '@/lib/vblog/types';
import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import type { KREXTier } from '@/lib/rewards/types';

function getSocialMeta(href: string) {
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
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
  };
}

function getArticleLinkEntries(article: VBlogArticle): Array<{ href: string; label: string }> {
  const entries: Array<{ href: string; label: string }> = [];
  if (article.primaryLink?.trim()) {
    entries.push({ href: article.primaryLink.trim(), label: 'Primary' });
  }
  for (const link of article.socialLinks ?? []) {
    const href = vBlogSocialLinkUrl(link as VBlogSocialLink | string);
    if (!href) continue;
    const customLabel = typeof link === 'string' ? '' : (link.label ?? '').trim();
    entries.push({ href, label: customLabel || getSocialMeta(href).label });
  }
  return entries;
}

function MetadataRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/50 px-4 py-3">
      <dt className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">{label}</dt>
      <dd className={`text-sm text-zinc-800 dark:text-zinc-200 break-all ${mono ? 'font-mono text-[12px] leading-relaxed' : 'font-semibold'}`}>
        {value}
      </dd>
    </div>
  );
}

function CopyableMonoValue({ value, copyLabel, href }: { value: string; copyLabel: string; href?: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-start gap-1.5 max-w-full">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[12px] leading-relaxed text-[#02abb8] hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <span className="font-mono text-[12px] leading-relaxed break-all">{value}</span>
      )}
      <KxCopyIconButton value={value} label={copyLabel} className="shrink-0 mt-0.5" />
    </span>
  );
}

export function VBlogAuthorCard({ article, compact = false }: { article: VBlogArticle; compact?: boolean }) {
  const authorDisplay = formatAddress(article.author);
  const authorAddress = article.author.replace(/^(evm:|kaspa:)/, '');
  const authorProfileUrl = `/u/${encodeURIComponent(article.author)}?tab=creator-content&type=articles`;
  const source = getVBlogArticleSource(article);
  const linkEntries = getArticleLinkEntries(article);

  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      <div className="flex items-start gap-4">
        <Avatar address={authorAddress} size={compact ? 48 : 56} className="ring-2 ring-cyan-500/20 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <KxBadge variant={source === 'kasparex' ? 'cyan' : 'zinc'}>{source === 'kasparex' ? 'Kasparex' : 'Community'}</KxBadge>
            <span className="text-xs font-medium text-zinc-500">{article.category}</span>
          </div>
          <Link href={authorProfileUrl} className="text-lg font-bold text-zinc-900 dark:text-white hover:text-[#02abb8] transition-colors">
            {authorDisplay}
          </Link>
          {!compact ? <p className="mt-2 kx-body leading-relaxed">{article.description}</p> : null}
          <Link href={authorProfileUrl} className="mt-3 inline-flex k-control-btn text-xs">
            View author profile
          </Link>
        </div>
      </div>

      {linkEntries.length > 0 ? (
        <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-3">Social & links</p>
          <div className="flex flex-wrap gap-2">
            {linkEntries.slice(0, 6).map((entry, index) => {
              const meta = getSocialMeta(entry.href);
              return (
                <a
                  key={`${entry.href}-${index}`}
                  href={entry.href}
                  target="_blank"
                  rel="noreferrer"
                  title={entry.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 hover:text-[#02abb8] hover:border-[#02abb8]/40 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {meta.icon}
                  </svg>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface ArticleSidebarProps {
  article: VBlogArticle;
  tipBoxEnabled?: boolean;
  tipPresets?: number[];
  customTipKas?: string;
  onCustomTipChange?: (value: string) => void;
  onTip?: (amount: number) => void;
  isProcessingAction?: boolean;
  isWalletConnected?: boolean;
  tipHubPointsBase?: number;
  tipHubPointsTier?: KREXTier;
}

export function ArticleSidebar({
  article,
  tipBoxEnabled = false,
  tipPresets = [10, 50, 100],
  customTipKas = '25',
  onCustomTipChange,
  onTip,
  isProcessingAction = false,
  isWalletConnected = false,
  tipHubPointsBase = 0,
  tipHubPointsTier = 'Tier0',
}: ArticleSidebarProps) {
  const source = getVBlogArticleSource(article);
  const authorAddress = article.author.replace(/^(evm:|kaspa:)/, '');
  const authorDisplay = formatAddress(article.author);
  const authorProfileUrl = `/u/${encodeURIComponent(article.author)}?tab=creator-content&type=articles`;
  const linkEntries = getArticleLinkEntries(article);
  const payloadBytes = article.pricingSnapshot?.payloadBytes;
  const chunkCount = article.pricingSnapshot?.chunkCount ?? article.chunkTxHashes?.length;
  const txExplorerUrl = article.txHash
    ? `https://explorer.kaspa.org/transactions/${article.txHash.replace(/^0x/, '')}`
    : undefined;

  const sections: VBlogAsideSection[] = [
    {
      title: 'Author',
      rawBody: true as const,
      body: (
        <>
          <div className="flex items-start gap-3">
            <Avatar address={authorAddress} size={44} className="ring-2 ring-cyan-500/20 shrink-0" />
            <div className="min-w-0">
              <Link href={authorProfileUrl} className="text-base font-bold text-zinc-900 dark:text-white hover:text-[#02abb8] transition-colors">
                {authorDisplay}
              </Link>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {source === 'kasparex' ? 'Kasparex author' : 'Community author'}
              </p>
              <Link href={authorProfileUrl} className="mt-2 inline-flex text-sm font-semibold text-[#02abb8] hover:underline">
                Open profile
              </Link>
            </div>
          </div>
          {linkEntries.length > 0 ? (
            <div className="pt-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">Social</p>
              <div className="flex flex-wrap gap-2">
                {linkEntries.slice(0, 5).map((entry, index) => {
                  const meta = getSocialMeta(entry.href);
                  return (
                    <a
                      key={`${entry.href}-${index}`}
                      href={entry.href}
                      target="_blank"
                      rel="noreferrer"
                      title={entry.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-[#02abb8] hover:border-[#02abb8]/40 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {meta.icon}
                      </svg>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
          {tipBoxEnabled ? (
            <div id="article-tip-box" className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#02abb8]">Support the author</p>
                {tipHubPointsBase > 0 ? (
                  <HubPointsEarnRow label="Earn:" basePoints={tipHubPointsBase} tier={tipHubPointsTier} />
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {tipPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={isProcessingAction || !isWalletConnected}
                    onClick={() => onTip?.(amount)}
                    className="k-control-btn text-xs"
                  >
                    Tip {amount} KAS
                  </button>
                ))}
                <input
                  value={customTipKas}
                  onChange={(e) => onCustomTipChange?.(e.target.value)}
                  className="k-input max-w-[120px] text-sm"
                  aria-label="Custom tip amount in KAS"
                />
                <button
                  type="button"
                  disabled={isProcessingAction || !isWalletConnected}
                  onClick={() => onTip?.(Number(customTipKas) || 1)}
                  className="k-control-btn text-xs"
                >
                  Custom tip
                </button>
              </div>
            </div>
          ) : null}
        </>
      ),
    },
    {
      title: 'On-chain metadata',
      rawBody: true as const,
      body: (
        <dl className="space-y-3">
          <MetadataRow
            label="Article CID (IPFS)"
            value={
              article.cid ? (
                <CopyableMonoValue value={article.cid} copyLabel="Copy IPFS CID" />
              ) : (
                'Not yet published'
              )
            }
            mono
          />
          {article.txHash ? (
            <MetadataRow
              label="Creation transaction"
              value={<CopyableMonoValue value={article.txHash} copyLabel="Copy transaction hash" href={txExplorerUrl} />}
              mono
            />
          ) : null}
          {article.articleId ? <MetadataRow label="Article ID" value={article.articleId} mono /> : null}
          {payloadBytes != null ? (
            <MetadataRow label="Payload used" value={`${payloadBytes.toLocaleString()} bytes`} />
          ) : null}
          {chunkCount != null && chunkCount > 0 ? (
            <MetadataRow label="Chunks used" value={String(chunkCount)} />
          ) : null}
          <MetadataRow label="Source" value={<KxBadge variant={source === 'kasparex' ? 'cyan' : 'zinc'}>{source}</KxBadge>} />
          <MetadataRow label="Network" value="Kaspa Mainnet" />
          <MetadataRow label="Status" value={article.status.replace(/_/g, ' ')} />
        </dl>
      ),
    },
  ];

  if (article.linkedMagazineId && article.linkedIssueNumber) {
    sections.unshift({
      title: 'Magazine link',
      links: [
        {
          href: getMagazineIssueHref(article.linkedMagazineId, article.linkedIssueNumber),
          label: getMagazineIssueLinkLabel(article.linkedMagazineId, article.linkedIssueNumber),
          sublabel: 'View magazine issue or catalog',
        },
      ],
    });
  }

  return <VBlogArticleAside sections={sections} />;
}
