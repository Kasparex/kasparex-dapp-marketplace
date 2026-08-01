'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { VBlogArticle } from '@/lib/vblog/types';
import { getMagazineIssueHref } from '@/lib/magazines/routes';
import { getMagazineById } from '@/lib/magazines/data';
import { formatAddress } from '@/lib/vblog/utils';
import { getVBlogArticleSource } from '@/lib/vblog/source';
import { Avatar } from '@/components/Avatar';
import { KxBadge } from '@/components/ui/KxBadge';
import { VBlogArticleAside, type VBlogAsideSection } from '@/components/vblog/VBlogArticleAside';
import { VBlogReaderBenefitsPanel } from '@/components/vblog/VBlogReaderBenefitsPanel';
import { VBlogArticleMetaBadges } from '@/components/vblog/VBlogArticleBadges';
import { VBlogPremiumBadge } from '@/components/vblog/VBlogPremiumBadge';
import { articleHasPremiumContent } from '@/lib/vblog/listing';
import { vBlogSocialLinkUrl } from '@/lib/vblog/socialLinks';
import type { VBlogSocialLink } from '@/lib/vblog/types';
import { getSocialLinkIconMeta } from '@/lib/socialLinkIcons';
import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';
import type { KREXTier } from '@/lib/rewards/types';
import type { PricingSnapshot } from '@/lib/pricing/types';
import {
  formatTokenAmount,
  resolveTokenAmountFromKas,
} from '@/lib/pricing/registry';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';
import { HubPaymentCurrencyCatalogTrigger } from '@/components/payments/HubPaymentCurrencyCatalogModal';
import { useHubPayWithCatalog, hubCatalogSelectionToStoreCurrency } from '@/hooks/useHubPayWithCatalog';
import { markCatalogByAcceptedCurrencies } from '@/lib/payments/markCatalogByAccepted';
import { KX_METADATA_STAT_GRID_STACK } from '@/lib/hub/shellTokens';

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

export function VBlogAuthorCard({ article, compact = false }: { article: VBlogArticle; compact?: boolean }) {
  const authorDisplay = formatAddress(article.author);
  const authorAddress = article.author.replace(/^(evm:|kaspa:)/, '');
  const authorProfileUrl = `/u/${encodeURIComponent(article.author)}?tab=creator-content&type=articles`;
  const source = getVBlogArticleSource(article);
  const linkEntries = getArticleLinkEntries(article);

  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      <div className="flex items-start gap-4">
        <Avatar address={authorAddress} size={compact ? 48 : 56} className="ring-2 ring-[color:var(--hub-accent-border)] shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <KxBadge variant={source === 'kasparex' ? 'cyan' : 'zinc'}>{source === 'kasparex' ? 'Kasparex' : 'Community'}</KxBadge>
            <span className="text-xs font-medium text-zinc-500">{article.category}</span>
          </div>
          <Link href={authorProfileUrl} className="text-lg font-bold text-zinc-900 dark:text-white hover:text-[color:var(--hub-accent)] transition-colors">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 hover:text-[color:var(--hub-accent)] hover:border-[color:var(--hub-accent-border)] transition-colors"
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
  tipCurrencies?: string[];
  customTipKas?: string;
  onCustomTipChange?: (value: string) => void;
  onTip?: (amount: number, currency: string) => void;
  isProcessingAction?: boolean;
  tipFlowComplete?: boolean;
  isWalletConnected?: boolean;
  tipHubPointsBase?: number;
  tipHubPointsTier?: KREXTier;
  pricingSnapshot?: PricingSnapshot | null;
}

export function ArticleSidebar({
  article,
  tipBoxEnabled = false,
  tipPresets = [10, 50, 100],
  tipCurrencies,
  customTipKas = '25',
  onCustomTipChange,
  onTip,
  isProcessingAction = false,
  tipFlowComplete = false,
  isWalletConnected = false,
  tipHubPointsBase = 0,
  tipHubPointsTier = 'Tier0',
  pricingSnapshot = null,
}: ArticleSidebarProps) {
  const acceptedCurrencies = tipCurrencies && tipCurrencies.length > 0 ? tipCurrencies : ['KAS'];
  const [tipCurrency, setTipCurrency] = useState(acceptedCurrencies[0] ?? 'KAS');
  const customTipKasNum = Number(customTipKas) || 0;
  const { catalogEntries } = useHubPayWithCatalog({
    amountKas: customTipKasNum > 0 ? customTipKasNum : tipPresets[0] ?? 10,
    pricingSnapshot,
  });
  const tipCatalog = useMemo(
    () => markCatalogByAcceptedCurrencies(catalogEntries, acceptedCurrencies),
    [catalogEntries, acceptedCurrencies],
  );
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
  const hasPremium = articleHasPremiumContent(article);

  const formatTipLabel = (kasAmount: number) => {
    if (tipCurrency === 'KAS') return `Tip ${kasAmount} KAS`;
    const tokenAmt = resolveTokenAmountFromKas(kasAmount, tipCurrency, pricingSnapshot);
    return `Tip ${formatTokenAmount(tokenAmt, tipCurrency)} (= ${kasAmount} KAS)`;
  };

  const payTip = (kasAmount: number) => {
    const payAmount = resolveTokenAmountFromKas(kasAmount, tipCurrency, pricingSnapshot);
    onTip?.(payAmount, tipCurrency);
  };

  const customTipTokenPreview =
    tipCurrency !== 'KAS' && customTipKasNum > 0
      ? resolveTokenAmountFromKas(customTipKasNum, tipCurrency, pricingSnapshot)
      : null;

  const sections: VBlogAsideSection[] = [
    {
      title: 'Author',
      rawBody: true as const,
      body: (
        <>
          <div className="flex items-start gap-3">
            <Avatar address={authorAddress} size={44} className="ring-2 ring-[color:var(--hub-accent-border)] shrink-0" />
            <div className="min-w-0">
              <Link href={authorProfileUrl} className="text-base font-bold text-zinc-900 dark:text-white hover:text-[color:var(--hub-accent)] transition-colors">
                {authorDisplay}
              </Link>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {source === 'kasparex' ? 'Kasparex author' : 'Community author'}
              </p>
              <Link href={authorProfileUrl} className="mt-2 inline-flex text-sm font-semibold text-[color:var(--hub-accent)] hover:underline">
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-[color:var(--hub-accent)] hover:border-[color:var(--hub-accent-border)] transition-colors"
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
                <p className="text-sm font-semibold text-[color:var(--hub-accent)] dark:text-[color:var(--hub-accent-light)]">Support the author</p>
                {tipHubPointsBase > 0 ? (
                  <HubPointsEarnRow label="Earn:" basePoints={tipHubPointsBase} tier={tipHubPointsTier} />
                ) : null}
              </div>

              {acceptedCurrencies.length > 0 ? (
                <div className="mb-3">
                  <HubPaymentCurrencyCatalogTrigger
                    entries={tipCatalog}
                    selectedId={tipCurrency}
                    onSelect={(opt) => setTipCurrency(hubCatalogSelectionToStoreCurrency(opt))}
                    alwaysShow
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {tipPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={isProcessingAction || !isWalletConnected}
                    onClick={() => payTip(amount)}
                    className="k-control-btn text-xs"
                  >
                    {formatTipLabel(amount)}
                  </button>
                ))}
                <input
                  value={customTipKas}
                  onChange={(e) => onCustomTipChange?.(e.target.value)}
                  className="k-input !h-10 !py-0 max-w-[120px] text-sm"
                  aria-label="Custom tip amount in KAS"
                />
                {customTipTokenPreview != null ? (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {customTipKasNum} KAS → {formatTokenAmount(customTipTokenPreview, tipCurrency)}
                  </span>
                ) : null}
                <button
                  type="button"
                  disabled={isProcessingAction || !isWalletConnected}
                  onClick={() => payTip(customTipKasNum || 1)}
                  className="k-control-btn text-xs"
                >
                  Custom tip
                </button>
              </div>
              <div className="mt-3">
                <HubFlowProgress
                  steps={getHubFlowPreset('hubPay')}
                  busy={isProcessingAction}
                  complete={tipFlowComplete}
                />
              </div>
            </div>
          ) : null}
        </>
      ),
    },
    {
      title: 'Badges',
      rawBody: true as const,
      body: (
        <div className="flex flex-wrap items-center gap-2">
          <VBlogArticleMetaBadges article={article} />
          {hasPremium ? <VBlogPremiumBadge /> : null}
        </div>
      ),
    },
    {
      title: 'On-chain metadata',
      rawBody: true as const,
      body: (
        <HubMetadataStatGrid
          gridClassName={KX_METADATA_STAT_GRID_STACK}
          stats={[
            {
              label: 'Article CID (IPFS)',
              value: article.cid || 'Not yet published',
              copyable: Boolean(article.cid),
              accent: Boolean(article.cid),
            },
            ...(article.txHash
              ? [
                  {
                    label: 'Creation transaction',
                    value: article.txHash,
                    accent: true,
                    copyable: true,
                    valueNode: (
                      <a
                        href={txExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium break-all text-[color:var(--hub-accent)] hover:underline"
                      >
                        {`${article.txHash.slice(0, 14)}…${article.txHash.slice(-10)}`}
                      </a>
                    ),
                  },
                ]
              : []),
            ...(article.articleId
              ? [{ label: 'Article ID', value: article.articleId, copyable: true }]
              : []),
            ...(payloadBytes != null
              ? [
                  {
                    label: 'Payload',
                    value: `${payloadBytes.toLocaleString()} B`,
                    copyable: false,
                    accent: true,
                  },
                ]
              : []),
            ...(chunkCount != null && chunkCount > 0
              ? [{ label: 'Chunks', value: String(chunkCount), copyable: false, accent: true }]
              : []),
            {
              label: 'Source',
              value: source === 'kasparex' ? 'Kasparex' : 'Community',
              copyable: false,
            },
            { label: 'Network', value: 'Kaspa Mainnet', copyable: false },
            {
              label: 'Status',
              value: article.status.replace(/_/g, ' '),
              copyable: false,
            },
          ]}
        />
      ),
    },
  ];

  if (article.linkedMagazineId && article.linkedIssueNumber) {
    const magazine = getMagazineById(article.linkedMagazineId);
    const issueHref = getMagazineIssueHref(article.linkedMagazineId, article.linkedIssueNumber);
    const authorIndex = sections.findIndex((s) => s.title === 'Author');
    const insertAt = authorIndex >= 0 ? authorIndex + 1 : sections.length;
    sections.splice(insertAt, 0, {
      title: 'Syndicated content',
      rawBody: true as const,
      body: (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
              {magazine?.name ?? 'Kasparex Magazine'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Issue #{article.linkedIssueNumber}</p>
          </div>
          <Link
            href={issueHref}
            target="_blank"
            rel="noopener noreferrer"
            className="k-control-btn text-xs shrink-0"
          >
            View
          </Link>
        </div>
      ),
    });
  }

  return <VBlogArticleAside topContent={<VBlogReaderBenefitsPanel />} sections={sections} />;
}
