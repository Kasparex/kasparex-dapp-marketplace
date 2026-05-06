import { isRewardsL2RedemptionEnabled } from '@/lib/rewards/feature-flags';
import { getIgraRewardManagerAddress } from '@/lib/rewards/l2-contracts';

/**
 * Short, user-facing note about delivery status for verified-wallet offers.
 */
export function describeL2RedemptionAvailability(): string {
  if (!isRewardsL2RedemptionEnabled()) {
    return 'Automatic on-chain payout for this path is not enabled on this site yet.';
  }
  if (!getIgraRewardManagerAddress()) {
    return 'Partner delivery is still being configured; your redemption is recorded safely here.';
  }
  return 'Your redemption is queued for partner delivery through the hub rewards route.';
}
