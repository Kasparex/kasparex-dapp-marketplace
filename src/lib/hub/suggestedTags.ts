/** Shared Hub tag suggestions for listing forms (lookup + select, max 3). */

export const HUB_MAX_LISTING_TAGS = 3;
export const HUB_TAG_MAX_LENGTH = 32;

export const HUB_SUGGESTED_TAGS: string[] = [
  'defi',
  'gaming',
  'nft',
  'utility',
  'governance',
  'social',
  'tools',
  'payments',
  'marketplace',
  'analytics',
  'identity',
  'media',
  'education',
  'community',
  'launchpad',
  'bridge',
  'wallet',
  'mining',
  'staking',
  'oracle',
].sort((a, b) => a.localeCompare(b));

export function normalizeHubTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#/, '')
    .replace(/\s+/g, '-')
    .slice(0, HUB_TAG_MAX_LENGTH);
}

export function normalizeHubTags(tags: string[], max = HUB_MAX_LISTING_TAGS): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeHubTag(tag);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= max) break;
  }
  return out;
}

export function mergeTagSuggestions(...lists: Array<string[] | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const tag of list ?? []) {
      const normalized = normalizeHubTag(tag);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}
