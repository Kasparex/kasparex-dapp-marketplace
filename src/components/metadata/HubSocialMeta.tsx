'use client';

import { useEffect } from 'react';
import { HUB_OG_DEFAULT_IMAGE_PATH, resolveHubOgImageUrl } from '@/lib/metadata/hubSocialPreview';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export interface HubSocialMetaProps {
  title: string;
  description?: string;
  image?: string | null;
  path?: string;
}

/** Client-side social preview tags for pages loaded after hydration (e.g. vBlog articles from local storage). */
export function HubSocialMeta({ title, description, image, path }: HubSocialMetaProps) {
  useEffect(() => {
    const desc =
      description?.trim() ||
      'Kasparex Hub: dApps, vBlog, Chronicles, tokens, and on-chain tools for the Kaspa ecosystem.';
    const imageUrl = resolveHubOgImageUrl(image ?? HUB_OG_DEFAULT_IMAGE_PATH);
    const url =
      typeof window !== 'undefined'
        ? path
          ? `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
          : window.location.href
        : '';

    document.title = title;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'og:type', 'article');
    if (url) upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', imageUrl);
  }, [title, description, image, path]);

  return null;
}
