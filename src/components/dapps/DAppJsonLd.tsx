import type { DApp } from '@/lib/dapps';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

export function DAppJsonLd({ dapp, listing }: { dapp: DApp; listing?: DirectoryListing }) {
  const description =
    listing?.shortDescription ||
    dapp.description ||
    dapp.utility ||
    '';
  const image = dapp.featuredImage || dapp.image || dapp.logoImage;
  const url = dapp.slug ? `https://kasparex.com/dapps/${dapp.slug}` : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: dapp.name,
    description,
    applicationCategory: dapp.category,
    operatingSystem: dapp.network || 'Kaspa',
    ...(image ? { image } : {}),
    ...(url ? { url } : {}),
    author: {
      '@type': 'Organization',
      name: dapp.developer || 'Kasparex Community',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
