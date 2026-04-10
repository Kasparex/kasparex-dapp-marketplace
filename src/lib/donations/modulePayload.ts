import { DONATIONS_MODULE_PAYLOAD_PREFIX, type DonationPaidModuleId } from '@/lib/donations/modules';

export function buildDonationsModuleUnlockPlainNote(moduleId: DonationPaidModuleId, campaignId: string, payer: string): string {
  return `CrowdKAS module unlock: ${moduleId} for campaign ${campaignId} (payer ${payer})`;
}

export function buildDonationsModuleUnlockPayloadText(moduleId: DonationPaidModuleId, campaignId: string, payer: string): string {
  return `${DONATIONS_MODULE_PAYLOAD_PREFIX}${moduleId}:${campaignId}:${payer}`;
}

export function buildDonationsModuleUnlockPayloadHex(moduleId: DonationPaidModuleId, campaignId: string, payer: string): string {
  const text = buildDonationsModuleUnlockPayloadText(moduleId, campaignId, payer);
  return Buffer.from(text, 'utf8').toString('hex');
}

