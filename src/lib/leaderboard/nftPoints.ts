import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { KREXPRIME_DIAMOND_IDS, RAREST_NFT_IDS } from '@/lib/game/diamond-veins-config';

export type NftRarity = 'diamond' | 'rare' | 'standard';

export const NFT_POINTS = {
  premiumCollections: ['KREXPRIME', 'PIXELKREX'] as const,
  partnerCollections: {
    KASGOTHS: { base: 10 },
    KASZOMBIES: { base: 10 },
  } as Record<string, { base: number }>,
  premium: { base: 15, diamond: 25, rare: 50 },
  partner: { base: 10 },
  standard: { base: 5 },
} as const;

export function normalizeCollectionName(name: string): string {
  return String(name ?? '').trim().toUpperCase();
}

export function classifyCollectionType(collection: string): 'premium' | 'partner' | 'standard' {
  const c = normalizeCollectionName(collection);
  if ((NFT_POINTS.premiumCollections as readonly string[]).includes(c)) return 'premium';
  if (NFT_POINTS.partnerCollections[c]) return 'partner';
  return 'standard';
}

export const PIXELKREX_DIAMOND_IDS = [
  4, 9, 13, 24, 31, 33, 92, 122, 129, 130, 135, 144, 149, 162, 165, 171, 173, 188, 193, 196, 199, 200, 203, 207, 209, 219, 225,
  234, 272, 275, 281, 288, 305, 311, 332, 335, 337, 366, 372, 385, 387, 394, 395, 425, 431, 440, 442, 449, 472, 480, 482, 485,
  487, 491, 509, 514, 515, 523, 530, 531, 539, 542, 543, 551, 566, 572, 574, 582, 592, 598, 606, 623, 645, 658, 668, 674, 675,
  691, 694, 709, 728, 734, 737, 739, 750, 751, 763, 785, 787, 790, 797, 818, 825, 849, 855, 888, 895, 927, 928, 936, 938, 946,
  962, 963, 973, 977, 989,
] as const;

export function getPremiumRarityByTokenId(collectionId: string, tokenId: number): NftRarity {
  const c = normalizeCollectionName(collectionId);
  const rarest = RAREST_NFT_IDS[c];
  if (rarest && rarest.includes(tokenId)) return 'rare';
  if (c === 'KREXPRIME' && KREXPRIME_DIAMOND_IDS.includes(tokenId)) return 'diamond';
  if (c === 'PIXELKREX' && (PIXELKREX_DIAMOND_IDS as readonly number[]).includes(tokenId)) return 'diamond';
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
  tokenId?: number;
  rarity?: NftRarity;
}): { points: number; type: 'premium' | 'partner' | 'standard'; rarity: NftRarity } {
  const type = classifyCollectionType(input.collection);
  const rarity = input.rarity ?? (type === 'premium' && typeof input.tokenId === 'number' ? getPremiumRarityByTokenId(input.collection, input.tokenId) : 'standard');

  if (type === 'premium') {
    if (rarity === 'diamond') return { points: NFT_POINTS.premium.diamond, type, rarity };
    if (rarity === 'rare') return { points: NFT_POINTS.premium.rare, type, rarity };
    return { points: NFT_POINTS.premium.base, type, rarity };
  }

  if (type === 'partner') {
    const c = normalizeCollectionName(input.collection);
    const base = NFT_POINTS.partnerCollections[c]?.base ?? NFT_POINTS.partner.base;
    return { points: base, type, rarity };
  }

  return { points: NFT_POINTS.standard.base, type, rarity };
}

