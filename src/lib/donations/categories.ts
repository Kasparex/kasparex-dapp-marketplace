export const DONATION_CATEGORIES = [
  'DeFi',
  'Gaming',
  'Tools',
  'Education',
  'Art',
  'Community',
  'Infrastructure',
  'Charity',
  'Other',
] as const;

export type DonationCategory = (typeof DONATION_CATEGORIES)[number];

export function isDonationCategory(x: string): x is DonationCategory {
  return (DONATION_CATEGORIES as readonly string[]).includes(x);
}

export function normalizeTag(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 32);
}

export function normalizeTags(inputs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of inputs) {
    const t = normalizeTag(raw);
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.slice(0, 12);
}

