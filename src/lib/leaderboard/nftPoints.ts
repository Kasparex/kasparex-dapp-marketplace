import type { ParsedNFTMetadata } from '@/lib/nft/metadata';

export type NftRarity = 'diamond' | 'rare' | 'standard';

export const NFT_POINTS = {
  ourCollections: ['KREXPRIME', 'PIXELKREX'] as const,
  partnerCollections: {
    KASGOTHS: { base: 10 },
  } as Record<string, { base: number }>,
  our: { base: 15, diamond: 25, rare: 50 },
  partner: { base: 10 },
  standard: { base: 5 },
} as const;

export function normalizeCollectionName(name: string): string {
  return String(name ?? '').trim().toUpperCase();
}

export function classifyCollectionType(collection: string): 'our' | 'partner' | 'standard' {
  const c = normalizeCollectionName(collection);
  if ((NFT_POINTS.ourCollections as readonly string[]).includes(c)) return 'our';
  if (NFT_POINTS.partnerCollections[c]) return 'partner';
  return 'standard';
}

export function getNftRarityFromMetadata(meta: ParsedNFTMetadata | null): NftRarity {
  if (!meta) return 'standard';
  const attrs = (meta as unknown as { attributes?: unknown }).attributes;
  const arr = Array.isArray(attrs) ? (attrs as Array<{ trait_type?: unknown; value?: unknown }>) : [];

  const pairs: Array<[string, string]> = [];
  for (const a of arr) {
    const t = typeof a.trait_type === 'string' ? a.trait_type : '';
    const v = typeof a.value === 'string' || typeof a.value === 'number' ? String(a.value) : '';
    if (t || v) pairs.push([t.toLowerCase(), v.toLowerCase()]);
  }

  const hay = [
    ...pairs.map(([t, v]) => `${t}:${v}`),
    typeof meta.name === 'string' ? meta.name.toLowerCase() : '',
  ].join(' | ');

  if (hay.includes('diamond')) return 'diamond';
  if (hay.includes('rare')) return 'rare';
  return 'standard';
}

export function pointsForNftInSlot(input: {
  collection: string;
  rarity?: NftRarity;
}): { points: number; type: 'our' | 'partner' | 'standard'; rarity: NftRarity } {
  const type = classifyCollectionType(input.collection);
  const rarity = input.rarity ?? 'standard';

  if (type === 'our') {
    if (rarity === 'diamond') return { points: NFT_POINTS.our.diamond, type, rarity };
    if (rarity === 'rare') return { points: NFT_POINTS.our.rare, type, rarity };
    return { points: NFT_POINTS.our.base, type, rarity };
  }

  if (type === 'partner') {
    const c = normalizeCollectionName(input.collection);
    const base = NFT_POINTS.partnerCollections[c]?.base ?? NFT_POINTS.partner.base;
    return { points: base, type, rarity };
  }

  return { points: NFT_POINTS.standard.base, type, rarity };
}

