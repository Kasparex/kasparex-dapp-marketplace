import { EditContent } from './EditContent';
import { placeholderDApps } from '@/lib/dapps';
import { generateDAppSlug } from '@/lib/utils';

// Generate static params for all dApp slugs (required for static export)
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return placeholderDApps.map((dapp) => ({
    slug: dapp.slug || generateDAppSlug(dapp.name),
  }));
}

export default function DAppEditPage() {
  return <EditContent />;
}
