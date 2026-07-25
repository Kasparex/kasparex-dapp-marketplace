'use client';

import { useState } from 'react';
import { resolveHubMediaUrl } from '@/lib/hub/resolveMediaUrl';

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
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--hub-accent-muted)] via-zinc-100 to-zinc-200 dark:from-[color:var(--hub-accent-muted)] dark:via-zinc-900 dark:to-zinc-950 ${className}`.trim()}
      >
        <div className="text-center px-4">
          <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[color:var(--hub-accent)]/80 dark:text-[color:var(--hub-accent-light)]/90">
            vBlog
          </div>
          <svg className="mx-auto h-7 w-7 text-[color:var(--hub-accent)]/40 dark:text-[color:var(--hub-accent-light)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[color:var(--hub-accent)] via-teal-600 to-cyan-700 ${className}`.trim()}
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
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--hub-accent-muted)] via-zinc-100 to-zinc-200 dark:from-[color:var(--hub-accent-muted)] dark:via-zinc-900 dark:to-zinc-950 ${className}`.trim()}
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
  onImageClick,
}: {
  src?: string | null;
  title: string;
  variant?: VBlogFeaturedImageVariant;
  className?: string;
  imgClassName?: string;
  onImageClick?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const resolvedSrc = resolveHubMediaUrl(src);
  const showPlaceholder = !resolvedSrc || broken;

  if (showPlaceholder) {
    return <VBlogFeaturedImagePlaceholder title={title} variant={variant} className={className} />;
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={title}
      className={imgClassName || className}
      onError={() => setBroken(true)}
    />
  );

  if (!onImageClick) return image;

  return (
    <button
      type="button"
      onClick={onImageClick}
      className={`block h-full w-full cursor-zoom-in border-0 bg-transparent p-0 text-left ${className}`.trim()}
      aria-label={`View full size image for ${title}`}
    >
      {image}
    </button>
  );
}
