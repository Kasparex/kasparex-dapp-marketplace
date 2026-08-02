'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { getVBlogArticleSource } from '@/lib/vblog/source';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { KX_METADATA_STAT_VALUE_LINK } from '@/lib/hub/shellTokens';
import { getExplorerTxUrl } from '@/lib/store/utils';

interface ArticleMetadataProps {
  article: VBlogArticle;
  payloadBytes?: number | null;
  chunkCount?: number | null;
}

/** On-chain metadata for the vBlog Metadata tab (moved out of the right rail). */
export function ArticleMetadata({
  article,
  payloadBytes = null,
  chunkCount = null,
}: ArticleMetadataProps) {
  const source = getVBlogArticleSource(article);
  const txExplorerUrl = article.txHash ? getExplorerTxUrl(article.txHash) : '#';

  return (
    <section className="space-y-4">
      <GameOverviewTitleBlock
        as="h3"
        compact
        kicker="On-chain"
        title="On-chain metadata"
        subtitle="CID, transaction, and listing anchors for this article."
      />
      <HubMetadataStatGrid
        smartPack
        stats={[
          {
            label: 'Article CID (IPFS)',
            value: article.cid || 'Not yet published',
            copyable: Boolean(article.cid),
            accent: Boolean(article.cid),
            dense: Boolean(article.cid),
          },
          ...(article.txHash
            ? [
                {
                  label: 'Creation transaction',
                  value: article.txHash,
                  accent: true,
                  dense: true,
                  copyable: true,
                  valueNode: (
                    <a
                      href={txExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={KX_METADATA_STAT_VALUE_LINK.replace(/^mt-1\s+/, '')}
                    >
                      {`${article.txHash.slice(0, 14)}…${article.txHash.slice(-10)}`}
                    </a>
                  ),
                },
              ]
            : []),
          ...(article.articleId
            ? [{ label: 'Article ID', value: article.articleId, dense: true, copyable: true }]
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
    </section>
  );
}
