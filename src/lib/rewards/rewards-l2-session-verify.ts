/**
 * Browser session flag after the user signs a short plain message while connected on IGRA Mainnet.
 * Keeps Reward redemptions from treating "connected on the right chain" as enough without a user intent step.
 * Not a server-side proof; safe no-op if sessionStorage is unavailable.
 */
export const REWARDS_L2_VERIFY_MARK = '1';

export function rewardsL2SessionVerifyKey(chainId: number, evmAddress: string): string {
  return `kx-rewards-evm-verify-v1:${chainId}:${evmAddress.toLowerCase()}`;
}

export function readRewardsL2SessionVerified(chainId: number, evmAddress: string | null | undefined): boolean {
  if (typeof window === 'undefined' || !evmAddress) return false;
  try {
    return sessionStorage.getItem(rewardsL2SessionVerifyKey(chainId, evmAddress)) === REWARDS_L2_VERIFY_MARK;
  } catch {
    return false;
  }
}

export function writeRewardsL2SessionVerified(chainId: number, evmAddress: string): void {
  try {
    sessionStorage.setItem(rewardsL2SessionVerifyKey(chainId, evmAddress), REWARDS_L2_VERIFY_MARK);
  } catch {
    /* private mode, quota, etc. */
  }
}
