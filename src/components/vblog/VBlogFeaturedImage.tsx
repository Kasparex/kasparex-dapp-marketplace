'use client';

import { useState } from 'react';

type VBlogFeaturedImageVariant = 'card' | 'hero' | 'list';

function VBlogFeaturedImagePlaceholder({
  title,
  variant,
  className = '',
}: {
  title: string;
  variant: VBlogFeaturedImageVariant;
  className?: string;
}) {
  if (variant === 'list') {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0884a4]/15 via-zinc-100 to-zinc-200 dark:from-[#0884a4]/20 dark:via-zinc-900 dark:to-zinc-950 ${className}`.trim()}
      >
        <div className="text-center px-4">
          <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#0884a4]/80 dark:text-[#4db8d4]/90">
            vBlog
          </div>
          <svg className="mx-auto h-7 w-7 text-[#0884a4]/40 dark:text-[#4db8d4]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0884a4] via-teal-600 to-cyan-800 ${className}`.trim()}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="relative z-10 px-8 text-center">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">vBlog</div>
          <div className="text-xl font-black leading-tight text-white line-clamp-3 sm:text-2xl">{title}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0884a4]/15 via-zinc-100 to-zinc-200 transition-transform duration-700 group-hover:scale-105 dark:from-[#0884a4]/20 dark:via-zinc-900 dark:to-zinc-950 ${className}`.trim()}
    >
      <div className="px-6 text-center">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">vBlog</div>
        <div className="text-lg font-black leading-tight text-zinc-900 line-clamp-2 dark:text-zinc-100">{title}</div>
      </div>
    </div>
  );
}

/** Featured image with shared vBlog placeholder when missing or broken. */
export function VBlogFeaturedImage({
  src,
  title,
  variant = 'card',
  className = '',
  imgClassName = '',
}: {
  src?: string | null;
  title: string;
  variant?: VBlogFeaturedImageVariant;
  className?: string;
  imgClassName?: string;
}) {
  const [broken, setBroken] = useState(false);
  const trimmed = src?.trim();
  const showPlaceholder = !trimmed || broken;

  if (showPlaceholder) {
    return <VBlogFeaturedImagePlaceholder title={title} variant={variant} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={trimmed}
      alt={title}
      className={imgClassName || className}
      onError={() => setBroken(true)}
    />
  );
}
