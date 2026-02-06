'use client';

import Link from 'next/link';
import Image from 'next/image';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate, getArticleExcerpt } from '@/lib/vblog/utils';

interface VBlogCardProps {
  article: VBlogArticle;
}

export function VBlogCard({ article }: VBlogCardProps) {
  const excerpt = getArticleExcerpt(article, 100);
  const authorDisplay = formatAddress(article.author);

  return (
    <Link
      href={`/vblog/${article.slug}`}
      className="group"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
        <div className="relative aspect-[3/4] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />

          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
              {article.category}
            </span>
            {article.status === 'on-chain-ready' && (
              <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                On-Chain
              </span>
            )}
          </div>

          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 z-20">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
              <span>{authorDisplay}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
              <span>{formatDate(article.publishDate)}</span>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3 leading-relaxed">
            {excerpt}
          </p>

          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <div className="flex gap-2">
              {article.tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="text-zinc-400 dark:text-zinc-500">#{tag}</span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 transition-all group-hover:translate-x-1">
              Read More
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

