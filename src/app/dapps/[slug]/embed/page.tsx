import { EmbedContent } from './EmbedContent';
import { placeholderDApps } from '@/lib/dapps';
import { generateDAppSlug } from '@/lib/utils';

// Generate static params for all dApp slugs (required for static export)
export async function generateStaticParams() {
  return placeholderDApps.map((dapp) => ({
    slug: dapp.slug || generateDAppSlug(dapp.name),
  }));
}

export default function EmbedPage() {
  return <EmbedContent />;
}
