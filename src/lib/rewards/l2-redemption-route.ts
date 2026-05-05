import { isRewardsL2RedemptionEnabled } from '@/lib/rewards/feature-flags';
import { getIgraRewardManagerAddress } from '@/lib/rewards/l2-contracts';

/**
 * Explains RewardManager-linked fulfillment state. Keeps UX honest while user-facing redemption ABIs finalize.
 */
export function describeL2RedemptionAvailability(): string {
  const addr = getIgraRewardManagerAddress();
  if (!isRewardsL2RedemptionEnabled()) {
    return 'L2 payouts stay off until NEXT_PUBLIC_ENABLE_REWARDS_L2_REDEMPTION is enabled.';
  }
  if (!addr) {
    return 'RewardManager address is not configured for this deployment. Kasparex logs your intent locally.';
  }
  return `Dry-run routing is active against ${addr.slice(0, 6)}...${addr.slice(-4)}. Ledger entries reserve your intent until an authorized caller can broadcast RewardManager actions.`;
}
