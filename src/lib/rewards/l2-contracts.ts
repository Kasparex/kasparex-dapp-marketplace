import { getContractAddress } from '@/lib/contracts/addresses';
import { CHAIN_IDS } from '@/lib/wagmi';

/**
 * Resolves RewardManager on IGRA mainnet for forthcoming user redemption routes.
 * Consumers should still guard writes with {@link isRewardsL2RedemptionEnabled}.
 */
export function getIgraRewardManagerAddress(): `0x${string}` | undefined {
  const addr = getContractAddress(CHAIN_IDS.IGRA_MAINNET, 'RewardManager');
  if (!addr || !addr.startsWith('0x')) return undefined;
  return addr as `0x${string}`;
}
