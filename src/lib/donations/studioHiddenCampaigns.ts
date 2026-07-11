const STORAGE_KEY = 'crowdkas_studio_hidden_v2_campaign_ids_v1';

function readHiddenIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id.trim()) : [];
  } catch {
    return [];
  }
}

function writeHiddenIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getHiddenV2CampaignIds(): Set<string> {
  return new Set(readHiddenIds());
}

export function isV2CampaignHiddenInStudio(campaignId: bigint | string): boolean {
  return getHiddenV2CampaignIds().has(String(campaignId));
}

/** Studio-only hide for zero-donor L2 campaigns (no on-chain cancel / wallet gas). */
export function hideV2CampaignInStudio(campaignId: bigint | string): void {
  const id = String(campaignId);
  const ids = readHiddenIds();
  if (ids.includes(id)) return;
  writeHiddenIds([...ids, id]);
}
