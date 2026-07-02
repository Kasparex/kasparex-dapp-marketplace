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
import { VBlogReaderBenefitsPanel } from '@/components/vblog/VBlogReaderBenefitsPanel';
import { vBlogSocialLinkUrl } from '@/lib/vblog/socialLinks';
import type { VBlogSocialLink } from '@/lib/vblog/types';
import { getSocialLinkIconMeta } from '@/lib/socialLinkIcons';
import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import type { KREXTier } from '@/lib/rewards/types';

function getArticleLinkEntries(article: VBlogArticle): Array<{ href: string; label: string }> {
  const entries: Array<{ href: string; label: string }> = [];
  if (article.primaryLink?.trim()) {
    entries.push({ href: article.primaryLink.trim(), label: 'Primary' });
  }
  for (const link of article.socialLinks ?? []) {
    const href = vBlogSocialLinkUrl(link as VBlogSocialLink | string);
    if (!href) continue;
    const customLabel = typeof link === 'string' ? '' : (link.label ?? '').trim();
    entries.push({ href, label: customLabel || getSocialLinkIconMeta(href, customLabel).label });
  }
  return entries;
}

function MetadataRow({
  label,
  value,
  mono = false,
  inline = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 px-3 py-2">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</dt>
        <dd className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 text-right">{value}</dd>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 px-3 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</dt>
      <dd className={`break-all ${mono ? 'font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300' : 'text-sm font-semibold text-zinc-800 dark:text-zinc-100'}`}>
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
              const meta = getSocialLinkIconMeta(entry.href, entry.label);
              return (
                <a
                  key={`${entry.href}-${index}`}
                  href={entry.href}
                  target="_blank"
                  rel="noreferrer"
                  title={entry.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 hover:text-[#02abb8] hover:border-[#02abb8]/40 transition-colors"
                >
                  {meta.icon}
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
                  const meta = getSocialLinkIconMeta(entry.href, entry.label);
                  return (
                    <a
                      key={`${entry.href}-${index}`}
                      href={entry.href}
                      target="_blank"
                      rel="noreferrer"
                      title={entry.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-[#02abb8] hover:border-[#02abb8]/40 transition-colors"
                    >
                      {meta.icon}
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
          <div className="grid grid-cols-2 gap-2">
            {payloadBytes != null ? (
              <MetadataRow label="Payload" value={`${payloadBytes.toLocaleString()} B`} inline />
            ) : null}
            {chunkCount != null && chunkCount > 0 ? (
              <MetadataRow label="Chunks" value={String(chunkCount)} inline />
            ) : null}
          </div>
          <MetadataRow label="Source" value={<KxBadge variant={source === 'kasparex' ? 'cyan' : 'zinc'}>{source}</KxBadge>} inline />
          <MetadataRow label="Network" value="Kaspa Mainnet" inline />
          <MetadataRow label="Status" value={<span className="capitalize">{article.status.replace(/_/g, ' ')}</span>} inline />
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
          openInNewTab: true,
        },
      ],
    });
  }

  return <VBlogArticleAside topContent={<VBlogReaderBenefitsPanel />} sections={sections} />;
}
