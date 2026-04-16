import { fetchJSON } from '@/lib/ipfs/gateway';

export const PROFILE_IPFS_REGISTRY_CID_ENV = 'NEXT_PUBLIC_PROFILE_IPFS_REGISTRY_CID';

export type LinkedEvmWallet = {
  address: `0x${string}`;
  message: string;
  signature: `0x${string}`;
  linkedAt: number;
};

export type PublicProfileRecord = {
  /** Canonical Kaspa address (normalized `kaspa:` prefix, lowercase). */
  kaspaAddress: string;
  /** Latest profile metadata CID for this Kaspa address. */
  profileCid: string;
  /** Optional pinned primary name (if user wants to override auto KNS primary). */
  preferredKnsName?: string;
  /** Linked wallets (proofs). */
  linkedEvmWallets?: LinkedEvmWallet[];
  updatedAt: number;
};

export type ProfileRegistryIndex = {
  updatedAt: number;
  registryCid?: string;
  profiles: Record<string, PublicProfileRecord>;
};

export function getProfileRegistryCID(): string | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('profile-ipfs-registry-cid');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_PROFILE_IPFS_REGISTRY_CID || null;
}

export function setProfileRegistryCID(cid: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('profile-ipfs-registry-cid', cid);
  }
}

export async function fetchProfileRegistryIndex(cid?: string | null): Promise<ProfileRegistryIndex | null> {
  const registryCid = cid || getProfileRegistryCID();
  if (!registryCid) return null;
  try {
    const idx = await fetchJSON<ProfileRegistryIndex>(registryCid);
    if (!idx || typeof idx !== 'object' || !('profiles' in idx)) return null;
    return idx;
  } catch (e) {
    console.error('Failed to fetch profile registry index:', e);
    return null;
  }
}

export function getProfileRecordForKaspaAddress(
  index: ProfileRegistryIndex | null,
  kaspaAddress: string
): PublicProfileRecord | null {
  if (!index || !kaspaAddress) return null;
  const key = kaspaAddress.trim().toLowerCase();
  return index.profiles?.[key] || null;
}

export function createEmptyProfileRegistryIndex(): ProfileRegistryIndex {
  return {
    updatedAt: Date.now(),
    profiles: {},
  };
}

