'use client';

import Link from 'next/link';
import Image from 'next/image';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate, getArticleExcerpt } from '@/lib/vblog/utils';

interface VBlogCardProps {
  article: VBlogArticle;
}

export function VBlogCard({ article }: VBlogCardProps) {
  const excerpt = getArticleExcerpt(article, 90);
  const authorDisplay = formatAddress(article.author);
  const isLinked = article.linkedMagazineId && article.linkedIssueNumber;

  return (
    <Link
      href={`/vblog/${article.slug}`}
      className="group"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1.5 flex flex-col h-full shadow-sm">
        <div className="relative aspect-video overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
              {article.category}
            </span>
            {isLinked && (
              <span className="px-2.5 py-1 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {article.linkedIssueNumber}
              </span>
            )}
            {/* Status Badge */}
            <span className={`px-2.5 py-1 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg ${article.status === 'published' || article.status === 'on-chain-ready'
              ? 'bg-emerald-500'
              : article.status === 'pending'
                ? 'bg-amber-500'
                : 'bg-zinc-500'
              }`}>
              {article.status === 'on-chain-ready' ? 'Published' : article.status}
            </span>
          </div>

          {article.featuredImage ? (
            <img
              src={article.featuredImage}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 transition-transform duration-700 group-hover:scale-105">
              <svg className="w-16 h-16 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 z-20">
            <h3 className="text-lg font-black text-white leading-tight group-hover:text-orange-400 transition-colors line-clamp-1">
              {article.title}
            </h3>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6 line-clamp-2 leading-relaxed flex-1">
            {excerpt}
          </p>

          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-5">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 dark:text-zinc-500">Author</span>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">{authorDisplay}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 dark:text-zinc-500">Published</span>
              <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-200">{formatDate(article.publishDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

