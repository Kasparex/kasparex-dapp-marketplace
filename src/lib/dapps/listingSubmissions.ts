import type { Category } from '@/lib/categories';
import {
  krexTierDiscountPercent,
  vaultEffectivePriceKas,
} from '@/lib/chronicles/vault/pricing';
import type { KREXTier, NFTStatus } from '@/lib/rewards/types';
import { kasToKrexAmount, type StorePaymentCurrency } from '@/lib/store/currencies';
import { generateDAppSlug } from '@/lib/utils';
import type { DApp, DeveloperLink } from '@/lib/dapps';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

export const DAPP_LISTING_FEE_KAS = 50;
export const DAPP_LISTING_ACTION_FEE_KAS = 1;

export type NetworkLayer = 'L1' | 'L2' | 'multichain';

export type DirectoryLink = {
  label: string;
  url: string;
};

export type DirectoryListing = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: Category;
  tags: string[];
  utility: string;
  process: string;
  benefits: string;
  feesOverview: string;
  feesPricing: string;
  feesCosts: string;
  supportedChains: string[];
  networkLayer: NetworkLayer;
  websiteUrl: string;
  socialLinks: DirectoryLink[];
  documentationLinks: DirectoryLink[];
  actionButtons: DirectoryLink[];
  /** Small square logo for cards and icon slots (optional). */
  logoCid?: string;
  /** Direct HTTPS logo URL (optional alternative to logoCid). */
  logoUrl?: string;
  featureImageCid?: string;
  /** Direct HTTPS featured image URL (optional alternative to featureImageCid). */
  featureImageUrl?: string;
  galleryCids: string[];
  galleryFileNames: string[];
  /** Direct HTTPS gallery image URLs (optional alternative to galleryCids). */
  galleryUrls: string[];
  optionalFileCids: string[];
  optionalFileNames: string[];
  /** Optional file download links (URL only for new submissions). */
  optionalFileUrls: DirectoryLink[];
  /** Legacy email field; new listings use contactX. */
  contactEmail?: string;
  /** X (Twitter) handle, with or without leading @. */
  contactX?: string;
  contactTelegram?: string;
  contactDiscord?: string;
  additionalNotes?: string;
  paymentCurrency: StorePaymentCurrency;
  feeAmountKAS: number;
  feeTxHash: string;
  submitterAddress: string;
  status: 'active' | 'archived';
  submittedAt: string;
  updatedAt: string;
};

/** @deprecated Use DirectoryListing */
export type DAppListingSubmission = DirectoryListing;

const STORAGE_KEY = 'kasparex_dapp_listing_submissions';

type LegacyListing = {
  id: string;
  name: string;
  category: Category;
  description: string;
  websiteUrl: string;
  contactEmail: string;
  paymentCurrency: StorePaymentCurrency;
  feeAmountKAS: number;
  feeTxHash: string;
  submitterAddress: string;
  status?: 'pending' | 'informational' | 'active' | 'archived';
  submittedAt: string;
  slug?: string;
};

function migrateLegacyListing(raw: LegacyListing): DirectoryListing {
  const now = raw.submittedAt || new Date().toISOString();
  return {
    id: raw.id,
    slug: raw.slug || generateDAppSlug(raw.name),
    name: raw.name,
    shortDescription: raw.description,
    fullDescription: raw.description,
    category: raw.category,
    tags: [],
    utility: raw.description,
    process: '',
    benefits: '',
    feesOverview: '',
    feesPricing: '',
    feesCosts: '',
    supportedChains: [],
    networkLayer: 'L1',
    websiteUrl: raw.websiteUrl || '',
    socialLinks: [],
    documentationLinks: [],
    actionButtons: [],
    galleryCids: [],
    galleryFileNames: [],
    galleryUrls: [],
    optionalFileCids: [],
    optionalFileNames: [],
    optionalFileUrls: [],
    contactEmail: raw.contactEmail || '',
    paymentCurrency: raw.paymentCurrency,
    feeAmountKAS: raw.feeAmountKAS,
    feeTxHash: raw.feeTxHash,
    submitterAddress: raw.submitterAddress,
    status: raw.status === 'archived' ? 'archived' : 'active',
    submittedAt: now,
    updatedAt: now,
  };
}

function normalizeListing(raw: unknown): DirectoryListing | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<DirectoryListing> & LegacyListing;
  if (!item.id || !item.name || !item.submitterAddress) return null;

  if ('shortDescription' in item && item.shortDescription) {
    return {
      ...item,
      slug: item.slug || generateDAppSlug(item.name),
      tags: item.tags ?? [],
      process: item.process ?? '',
      benefits: item.benefits ?? '',
      feesOverview: item.feesOverview ?? '',
      feesPricing: item.feesPricing ?? '',
      feesCosts: item.feesCosts ?? '',
      supportedChains: item.supportedChains ?? [],
      socialLinks: item.socialLinks ?? [],
      documentationLinks: item.documentationLinks ?? [],
      actionButtons: item.actionButtons ?? [],
      galleryCids: item.galleryCids ?? [],
      galleryFileNames: item.galleryFileNames ?? [],
      galleryUrls: item.galleryUrls ?? [],
      optionalFileCids: item.optionalFileCids ?? [],
      optionalFileNames: item.optionalFileNames ?? [],
      optionalFileUrls: item.optionalFileUrls ?? [],
      contactX: item.contactX,
      status: item.status === 'archived' ? 'archived' : 'active',
      submittedAt: item.submittedAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.submittedAt || new Date().toISOString(),
    } as DirectoryListing;
  }

  if ('description' in item && item.description) {
    return migrateLegacyListing(item as LegacyListing);
  }

  return null;
}

function readAllListings(): DirectoryListing[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown[] = JSON.parse(raw);
    return parsed
      .map(normalizeListing)
      .filter((item): item is DirectoryListing => item !== null)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch {
    return [];
  }
}

function writeAllListings(listings: DirectoryListing[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  window.dispatchEvent(new CustomEvent('dapp-listing-submissions-updated'));
}

function generateUniqueSlug(name: string, excludeId?: string): string {
  const base = generateDAppSlug(name);
  const all = readAllListings();
  let slug = base;
  let suffix = 2;
  while (all.some((l) => l.slug === slug && l.id !== excludeId)) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

export function getDirectoryListings(submitterAddress?: string): DirectoryListing[] {
  const all = readAllListings();
  if (!submitterAddress) return all;
  return all.filter((s) => s.submitterAddress.toLowerCase() === submitterAddress.toLowerCase());
}

/** @deprecated Use getDirectoryListings */
export function getDAppListingSubmissions(submitterAddress?: string): DirectoryListing[] {
  return getDirectoryListings(submitterAddress);
}

export function getDirectoryListingBySlug(slug: string): DirectoryListing | undefined {
  return readAllListings().find((l) => l.slug === slug && l.status === 'active');
}

export function getDirectoryListingById(id: string): DirectoryListing | undefined {
  return readAllListings().find((l) => l.id === id);
}

export function getDirectoryListingsByCategory(
  category: Category | 'all',
  submitterAddress?: string,
): DirectoryListing[] {
  const list = getDirectoryListings(submitterAddress).filter((l) => l.status === 'active');
  if (category === 'all') return list;
  return list.filter((s) => s.category === category);
}

/** @deprecated Use getDirectoryListingsByCategory */
export function getDAppListingSubmissionsByCategory(
  category: Category | 'all',
  submitterAddress?: string,
): DirectoryListing[] {
  return getDirectoryListingsByCategory(category, submitterAddress);
}

export type DirectoryListingInput = Omit<
  DirectoryListing,
  'id' | 'slug' | 'status' | 'submittedAt' | 'updatedAt' | 'feeAmountKAS' | 'feeTxHash'
>;

export function saveDirectoryListing(
  data: DirectoryListingInput & { feeTxHash: string; feeAmountKAS?: number },
): DirectoryListing {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save listing submission on server');
  }

  const slug = generateUniqueSlug(data.name);
  const now = new Date().toISOString();
  const entry: DirectoryListing = {
    ...data,
    id: `dapp-listing-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    slug,
    feeAmountKAS: data.feeAmountKAS ?? DAPP_LISTING_FEE_KAS,
    status: 'active',
    submittedAt: now,
    updatedAt: now,
  };

  const existing = readAllListings();
  existing.unshift(entry);
  writeAllListings(existing);
  return entry;
}

/** @deprecated Use saveDirectoryListing */
export function saveDAppListingSubmission(
  data: Omit<DirectoryListing, 'id' | 'slug' | 'status' | 'submittedAt' | 'updatedAt'> & {
    description?: string;
  },
): DirectoryListing {
  return saveDirectoryListing({
    name: data.name,
    shortDescription: data.shortDescription || (data as { description?: string }).description || '',
    fullDescription: data.fullDescription || (data as { description?: string }).description || '',
    category: data.category,
    tags: data.tags ?? [],
    utility: data.utility ?? data.shortDescription ?? '',
    process: data.process ?? '',
    benefits: data.benefits ?? '',
    feesOverview: data.feesOverview ?? '',
    feesPricing: data.feesPricing ?? '',
    feesCosts: data.feesCosts ?? '',
    supportedChains: data.supportedChains ?? [],
    networkLayer: data.networkLayer ?? 'L1',
    websiteUrl: data.websiteUrl ?? '',
    socialLinks: data.socialLinks ?? [],
    documentationLinks: data.documentationLinks ?? [],
    actionButtons: data.actionButtons ?? [],
    featureImageCid: data.featureImageCid,
    logoCid: data.logoCid,
    logoUrl: data.logoUrl,
    galleryCids: data.galleryCids ?? [],
    galleryFileNames: data.galleryFileNames ?? [],
    galleryUrls: data.galleryUrls ?? [],
    optionalFileCids: data.optionalFileCids ?? [],
    optionalFileNames: data.optionalFileNames ?? [],
    optionalFileUrls: data.optionalFileUrls ?? [],
    contactEmail: data.contactEmail,
    contactX: data.contactX,
    contactTelegram: data.contactTelegram,
    contactDiscord: data.contactDiscord,
    additionalNotes: data.additionalNotes,
    paymentCurrency: data.paymentCurrency,
    feeTxHash: data.feeTxHash,
    feeAmountKAS: data.feeAmountKAS,
    submitterAddress: data.submitterAddress,
  });
}

export function updateDirectoryListing(
  id: string,
  submitterAddress: string,
  patch: Partial<Omit<DirectoryListing, 'id' | 'slug' | 'submitterAddress' | 'submittedAt'>>,
): DirectoryListing | null {
  if (typeof window === 'undefined') return null;
  const all = readAllListings();
  const index = all.findIndex(
    (l) => l.id === id && l.submitterAddress.toLowerCase() === submitterAddress.toLowerCase(),
  );
  if (index === -1) return null;

  const current = all[index];
  const name = patch.name?.trim() || current.name;
  const slug =
    name !== current.name ? generateUniqueSlug(name, id) : current.slug;

  const updated: DirectoryListing = {
    ...current,
    ...patch,
    name,
    slug,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  writeAllListings(all);
  return updated;
}

export function archiveDirectoryListing(id: string, submitterAddress: string): boolean {
  if (typeof window === 'undefined') return false;
  const all = readAllListings();
  const index = all.findIndex(
    (l) => l.id === id && l.submitterAddress.toLowerCase() === submitterAddress.toLowerCase(),
  );
  if (index === -1) return false;
  all[index] = {
    ...all[index],
    status: 'archived',
    updatedAt: new Date().toISOString(),
  };
  writeAllListings(all);
  return true;
}

export function contactXProfileUrl(handle?: string): string | undefined {
  if (!handle?.trim()) return undefined;
  const normalized = handle.trim().replace(/^@/, '');
  return normalized ? `https://x.com/${encodeURIComponent(normalized)}` : undefined;
}

export function contactXDisplayLabel(handle?: string): string | undefined {
  if (!handle?.trim()) return undefined;
  const normalized = handle.trim().replace(/^@/, '');
  return normalized ? `@${normalized}` : undefined;
}

export function directoryListingToDApp(listing: DirectoryListing): DApp {
  const logoUrl =
    listing.logoUrl?.trim() ||
    (listing.logoCid ? getBestGatewayUrl(listing.logoCid) : undefined);
  const featureUrl =
    listing.featureImageUrl?.trim() ||
    (listing.featureImageCid ? getBestGatewayUrl(listing.featureImageCid) : undefined);

  const developerLinks: DeveloperLink[] = [];
  if (listing.websiteUrl) {
    developerLinks.push({ label: 'Website', url: listing.websiteUrl });
  }
  for (const link of listing.socialLinks) {
    if (developerLinks.length >= 3) break;
    developerLinks.push(link);
  }

  const network =
    listing.supportedChains.length > 0
      ? listing.supportedChains.join(', ')
      : listing.networkLayer === 'L1'
        ? 'Kaspa L1'
        : listing.networkLayer === 'L2'
          ? 'EVM L2'
          : 'Multichain';

  const networkType: DApp['networkType'] =
    listing.networkLayer === 'multichain' ? undefined : listing.networkLayer;

  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    image: logoUrl,
    logoImage: logoUrl,
    featuredImage: featureUrl,
    createdAt: listing.submittedAt,
    category: listing.category,
    utility: listing.utility || listing.shortDescription,
    process: listing.process || listing.shortDescription,
    benefits: listing.benefits || (listing.tags.length > 0 ? listing.tags.join(' · ') : listing.utility),
    developer: 'Community',
    developerLinks: developerLinks.length > 0 ? developerLinks : undefined,
    status: 'Mainnet',
    network,
    networkType,
    provider: 'Community',
    description: listing.fullDescription || listing.shortDescription,
    source: 'directory',
    directoryListingId: listing.id,
    tags: listing.tags,
    directoryListing: listing,
  };
}

export function getActiveDirectoryDApps(): DApp[] {
  return getDirectoryListings()
    .filter((l) => l.status === 'active')
    .map(directoryListingToDApp);
}

export function calculateDirectoryListingFeeKas(
  baseFeeKas: number,
  krexTier: KREXTier,
  nftStatus: NFTStatus | null | undefined,
): { baseKas: number; effectiveKas: number; discountPercent: number } {
  const effectiveKas = vaultEffectivePriceKas(baseFeeKas, krexTier, nftStatus ?? null);
  const tierDiscount = krexTierDiscountPercent(krexTier);
  const discountPercent =
    baseFeeKas > 0 ? Math.min(100, Math.round((1 - effectiveKas / baseFeeKas) * 100)) : tierDiscount;
  return { baseKas: baseFeeKas, effectiveKas, discountPercent };
}

export function listingActionFeeLabel(currency: StorePaymentCurrency, feeKas: number): string {
  const formattedKas =
    Number.isInteger(feeKas) ? `${feeKas}` : feeKas.toFixed(2).replace(/\.?0+$/, '');
  if (currency === 'KREX') {
    return `${kasToKrexAmount(feeKas).toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`;
  }
  return `${formattedKas} KAS`;
}
