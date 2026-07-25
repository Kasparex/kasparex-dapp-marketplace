'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate } from '@/lib/vblog/utils';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { Avatar } from '@/components/Avatar';
import { VBlogFeaturedImage } from '@/components/vblog/VBlogFeaturedImage';
import { VBlogPremiumSectionGate } from '@/components/vblog/VBlogPremiumSectionGate';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { computeVBlogReaderPaymentSplit } from '@/lib/vblog/readerPricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { VBlogArticleBadges } from '@/components/vblog/VBlogArticleBadges';

interface ArticlePublicPreviewProps {
  article: VBlogArticle;
}

export function ArticlePublicPreview({ article }: ArticlePublicPreviewProps) {
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const authorDisplay = formatAddress(article.author);
  const authorAddress = article.author.replace(/^(evm:|kaspa:)/, '');
  const authorProfileUrl = `/u/${encodeURIComponent(article.author)}?tab=creator-content&type=articles`;

  const premiumListKas = Number(article.modules?.premiumSectionPriceKas ?? 0);
  const premiumPricing = useMemo(
    () => computeVBlogReaderPaymentSplit(premiumListKas, krexTier, nftStatus),
    [premiumListKas, krexTier, nftStatus],
  );

  return (
    <article className="max-w-5xl mx-auto font-sans">
      <div id="article-header" className="relative mb-10 rounded-2xl overflow-hidden bg-zinc-50/80 dark:bg-zinc-900/45 border border-zinc-200 dark:border-zinc-800 select-text">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e30d1b]/5 via-transparent to-transparent" />

        <div className="relative flex flex-col lg:flex-row min-h-[320px]">
          <div className="flex-1 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight">
              {article.title}
            </h1>
            <p id="article-intro" className="kx-body max-w-2xl mb-8 select-text">
              {article.description}
            </p>

            <div className="grid w-full gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="flex min-w-0 flex-wrap items-center gap-8">
                <div className="flex items-center gap-3">
                  <Avatar address={authorAddress} size={44} className="ring-2 ring-[#e30d1b]/20" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">By</span>
                    <Link href={authorProfileUrl} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[#e30d1b] transition-colors">
                      {authorDisplay}
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Published</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(article.publishDate)}</span>
                </div>
              </div>

              <div className="flex w-full justify-end sm:w-auto sm:justify-self-end">
                <VBlogArticleBadges article={article} includeCategory className="justify-end" />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[40%] relative min-h-[220px] lg:min-h-full bg-zinc-100 dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-800">
            <VBlogFeaturedImage
              src={article.featuredImage}
              title={article.title}
              variant="hero"
              className="absolute inset-0 h-full w-full"
              imgClassName="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <KxRichTextContent
          id="article-main"
          html={article.content}
          className="cursor-text"
        />

        {article.modules?.premiumSectionEnabled ? (
          <VBlogPremiumSectionGate
            unlocked={false}
            previewHtml={article.modules.premiumSectionContent ?? ''}
            listPriceKas={premiumPricing.listKas}
            effectivePriceKas={premiumPricing.totalKas}
            discountPercent={premiumPricing.discountPercent}
            hubPointsBase={HUB_EARN_POINTS.vblogPremiumUnlock}
            tier={krexTier}
            isProcessing={false}
            isWalletConnected={false}
            onUnlock={() => undefined}
          />
        ) : null}
      </div>
    </article>
  );
}
