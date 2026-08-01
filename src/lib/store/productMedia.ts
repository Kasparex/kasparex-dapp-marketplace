import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

/** Resolve product thumbnail for cards / detail (HTTPS URL or IPFS CID). */
export function resolveStoreProductImageUrl(product: {
  thumbnailUrl?: string | null;
  thumbnailCid?: string | null;
}): string | undefined {
  const url = product.thumbnailUrl?.trim();
  if (url && /^https?:\/\//i.test(url)) return url;

  const cidOrUrl = product.thumbnailCid?.trim();
  if (!cidOrUrl) return undefined;
  if (/^https?:\/\//i.test(cidOrUrl)) return cidOrUrl;
  return getBestGatewayUrl(cidOrUrl);
}

export function isHttpImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
