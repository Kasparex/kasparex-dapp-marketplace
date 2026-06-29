import type { Metadata } from 'next';

/** Default fallback OG image. Replace with a custom asset when available. */
export const HUB_OG_DEFAULT_IMAGE_PATH = '/img/og/kasparex-default.svg';

export function getHubSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://www.kasparex.com';
}

export function resolveHubOgImageUrl(image?: string | null): string {
  const siteUrl = getHubSiteUrl();
  const raw = image?.trim();
  if (!raw) return `${siteUrl}${HUB_OG_DEFAULT_IMAGE_PATH}`;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `${siteUrl}${raw}`;
  return raw;
}

export type HubSocialPreviewInput = {
  title: string;
  description?: string;
  image?: string | null;
  path?: string;
  type?: 'website' | 'article';
};

export function buildHubOpenGraphMetadata(input: HubSocialPreviewInput): Metadata {
  const siteUrl = getHubSiteUrl();
  const url = input.path ? `${siteUrl}${input.path.startsWith('/') ? input.path : `/${input.path}`}` : siteUrl;
  const description =
    input.description?.trim() ||
    'Kasparex Hub: dApps, vBlog, Chronicles, tokens, and on-chain tools for the Kaspa ecosystem.';
  const imageUrl = resolveHubOgImageUrl(input.image);

  return {
    title: input.title,
    description,
    openGraph: {
      title: input.title,
      description,
      url,
      siteName: 'Kasparex',
      type: input.type ?? 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description,
      images: [imageUrl],
    },
  };
}
