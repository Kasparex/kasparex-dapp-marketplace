'use client';

import Link from 'next/link';
import { useState } from 'react';
import { KxFormSelect } from '@/components/ui/KxFormSelect';
import type { VBlogArticle } from '@/lib/vblog/types';
import { getMagazineIssueHref } from '@/lib/magazines/routes';
import { getMagazineById } from '@/lib/magazines/data';
import { formatAddress } from '@/lib/vblog/utils';
import { getVBlogArticleSource } from '@/lib/vblog/source';
import { Avatar } from '@/components/Avatar';
import { KxBadge } from '@/components/ui/KxBadge';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
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
        <dt className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</dt>
        <dd className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 text-right">{value}</dd>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 px-3 py-2.5">
      <dt className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</dt>
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
          className="font-mono text-[12px] leading-relaxed text-[color:var(--hub-accent)] hover:underline break-all"
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

  const customTipKasNum = Number(customTipKas) || 0;
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

              {acceptedCurrencies.length > 1 ? (
                <div className="mb-3 max-w-[160px]">
                  <KxFormSelect
                    value={tipCurrency}
                    onChange={(e) => setTipCurrency(e.target.value)}
                    ariaLabel="Tip currency"
                    options={acceptedCurrencies.map((currency) => ({
                      value: currency,
                      label: currency,
                    }))}
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
