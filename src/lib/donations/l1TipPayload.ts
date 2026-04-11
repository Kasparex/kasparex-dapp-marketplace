/** Plain-text note on Kaspa L1 tip txs so the recorder API can bind campaign + donor EVM. */
export const DONATIONS_L1_TIP_PAYLOAD_PREFIX = 'CROWDKAS_L1_TIP:';

export function buildDonationsL1TipPlainNote(campaignId: string, donorEvmLowercase: `0x${string}`): string {
  return `${DONATIONS_L1_TIP_PAYLOAD_PREFIX}${campaignId}:${donorEvmLowercase.toLowerCase()}`;
}

export function parseDonationsL1TipPayload(payload: string | null | undefined): {
  campaignId: string;
  donorEvm: `0x${string}`;
} | null {
  if (!payload || typeof payload !== 'string') return null;
  const t = payload.trim();
  if (!t.startsWith(DONATIONS_L1_TIP_PAYLOAD_PREFIX)) return null;
  const rest = t.slice(DONATIONS_L1_TIP_PAYLOAD_PREFIX.length);
  const colon = rest.indexOf(':');
  if (colon < 1) return null;
  const campaignId = rest.slice(0, colon).trim();
  const donorEvm = rest.slice(colon + 1).trim().toLowerCase();
  if (!/^\d+$/.test(campaignId) || !/^0x[0-9a-f]{40}$/.test(donorEvm)) return null;
  return { campaignId, donorEvm: donorEvm as `0x${string}` };
}
