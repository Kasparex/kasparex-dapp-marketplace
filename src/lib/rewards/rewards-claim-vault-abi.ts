/** Minimal ABI for RewardsClaimVault.claim (matches contracts/RewardsClaimVault.sol). */
export const REWARDS_CLAIM_VAULT_CLAIM_ABI = [
  {
    inputs: [
      { name: 'beneficiary', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'ptsConsumed', type: 'uint256' },
      { name: 'requestId', type: 'bytes32' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
