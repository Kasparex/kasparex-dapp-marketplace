'use client';

import { VBlogArticle } from '@/lib/vblog/types';

interface ArticleMetadataProps {
  article: VBlogArticle;
}

export function ArticleMetadata({ article }: ArticleMetadataProps) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mt-8">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        On-chain Metadata
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Article ID
          </label>
          <p className="text-sm text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
            {article.articleId || 'N/A'}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Content CID
          </label>
          <p className="text-sm text-zinc-900 dark:text-zinc-100 mt-1 font-mono break-all">
            {article.cid || 'N/A'}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Transaction Hash
          </label>
          <p className="text-sm text-zinc-900 dark:text-zinc-100 mt-1 font-mono break-all">
            {article.txHash || 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          <strong>Note:</strong> The article content is intended to be stored via a CID on decentralized storage (IPFS, etc.) and referenced on-chain. The CID ensures content verifiability and immutability while keeping on-chain storage costs low.
        </p>
      </div>
    </div>
  );
}

