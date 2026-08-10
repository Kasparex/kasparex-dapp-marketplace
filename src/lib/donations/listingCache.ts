/**
 * Browser cache for vDonate listing rows so the grid paints instantly on revisit.
 */

import type { DonationCampaignV2ListItem } from '@/hooks/useDonationCampaignsV2';
import type { DonationCampaignListItem } from '@/hooks/useDonationCampaigns';

const V2_CACHE_KEY = 'vdonate:listing:v2:v1';
const V1_CACHE_KEY = 'vdonate:listing:v1:v1';

type CachedV2Row = Omit<
  DonationCampaignV2ListItem,
  | 'campaignId'
  | 'targetWei'
  | 'deadline'
  | 'raisedWei'
  | 'donorCount'
  | 'l1RecordedTotalWei'
  | 'l1RecordedDonationCount'
> & {
  campaignId: string;
  targetWei: string;
  deadline: string;
  raisedWei: string;
  donorCount: string;
  l1RecordedTotalWei?: string;
  l1RecordedDonationCount?: string;
};

function toBig(v: string | undefined, fallback = 0n): bigint {
  try {
    return v != null ? BigInt(v) : fallback;
  } catch {
    return fallback;
  }
}

export function readCachedDonationCampaignsV2(): DonationCampaignV2ListItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(V2_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CachedV2Row[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => ({
      ...r,
      campaignId: toBig(r.campaignId),
      targetWei: toBig(r.targetWei),
      deadline: toBig(r.deadline),
      raisedWei: toBig(r.raisedWei),
      donorCount: toBig(r.donorCount),
      l1RecordedTotalWei: r.l1RecordedTotalWei != null ? toBig(r.l1RecordedTotalWei) : 0n,
      l1RecordedDonationCount:
        r.l1RecordedDonationCount != null ? toBig(r.l1RecordedDonationCount) : 0n,
    }));
  } catch {
    return [];
  }
}

export function writeCachedDonationCampaignsV2(rows: DonationCampaignV2ListItem[]): void {
  if (typeof window === 'undefined' || rows.length === 0) return;
  try {
    const payload: CachedV2Row[] = rows.map((r) => ({
      campaignId: r.campaignId.toString(),
      creatorAddress: r.creatorAddress,
      method: r.method,
      donationMethod: r.donationMethod,
      targetWei: r.targetWei.toString(),
      deadline: r.deadline.toString(),
      raisedWei: r.raisedWei.toString(),
      donorCount: r.donorCount.toString(),
      ipfsHash: r.ipfsHash,
      l1Address: r.l1Address,
      active: r.active,
      l1RecordedTotalWei: (r.l1RecordedTotalWei ?? 0n).toString(),
      l1RecordedDonationCount: (r.l1RecordedDonationCount ?? 0n).toString(),
      featuredModuleUnlocked: r.featuredModuleUnlocked,
    }));
    window.localStorage.setItem(V2_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

type CachedV1Row = Omit<
  DonationCampaignListItem,
  'targetWei' | 'deadline' | 'raisedWei' | 'donorCount' | 'campaignId' | 'l1RecordedTotalWei' | 'l1RecordedDonationCount'
> & {
  targetWei: string;
  deadline: string;
  raisedWei: string;
  donorCount: string;
  campaignId?: string;
  l1RecordedTotalWei?: string;
  l1RecordedDonationCount?: string;
};

export function readCachedDonationCampaignsV1(): DonationCampaignListItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(V1_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CachedV1Row[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => ({
      ...r,
      targetWei: toBig(r.targetWei),
      deadline: toBig(r.deadline),
      raisedWei: toBig(r.raisedWei),
      donorCount: toBig(r.donorCount),
      campaignId: r.campaignId != null ? toBig(r.campaignId) : undefined,
      l1RecordedTotalWei: r.l1RecordedTotalWei != null ? toBig(r.l1RecordedTotalWei) : undefined,
      l1RecordedDonationCount:
        r.l1RecordedDonationCount != null ? toBig(r.l1RecordedDonationCount) : undefined,
    }));
  } catch {
    return [];
  }
}

export function writeCachedDonationCampaignsV1(rows: DonationCampaignListItem[]): void {
  if (typeof window === 'undefined' || rows.length === 0) return;
  try {
    const payload: CachedV1Row[] = rows.map((r) => ({
      creatorAddress: r.creatorAddress,
      campaignId: r.campaignId?.toString(),
      donationMethod: r.donationMethod,
      targetWei: r.targetWei.toString(),
      deadline: r.deadline.toString(),
      raisedWei: r.raisedWei.toString(),
      donorCount: r.donorCount.toString(),
      ipfsHash: r.ipfsHash,
      l1Address: r.l1Address,
      active: r.active,
      l1RecordedTotalWei: r.l1RecordedTotalWei?.toString(),
      l1RecordedDonationCount: r.l1RecordedDonationCount?.toString(),
      featuredModuleUnlocked: r.featuredModuleUnlocked,
    }));
    window.localStorage.setItem(V1_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}
