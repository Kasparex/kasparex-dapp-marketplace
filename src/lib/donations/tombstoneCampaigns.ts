/**
 * Hub-side removal for V2 campaigns that should not appear publicly
 * (e.g. test data) without an on-chain cancelCampaign transaction.
 */

export type TombstonedV2Campaign = {
  creatorAddress: string;
  campaignId: string;
  label?: string;
};

export const TOMBSTONED_V2_CAMPAIGNS: TombstonedV2Campaign[] = [
  {
    creatorAddress: '0x4fFA97813BaBa07e917204dA60A5d2AB4621a316',
    campaignId: '2',
    label: 'Test 4',
  },
];

function normCreator(address: string): string {
  return address.trim().toLowerCase();
}

export function isV2CampaignTombstoned(creatorAddress: string, campaignId: bigint | string | number): boolean {
  const creator = normCreator(creatorAddress);
  const id = String(campaignId);
  return TOMBSTONED_V2_CAMPAIGNS.some(
    (row) => normCreator(row.creatorAddress) === creator && row.campaignId === id,
  );
}

export function filterTombstonedV2Campaigns<T extends { creatorAddress: string; campaignId: bigint }>(
  campaigns: T[],
): T[] {
  return campaigns.filter((c) => !isV2CampaignTombstoned(c.creatorAddress, c.campaignId));
}
