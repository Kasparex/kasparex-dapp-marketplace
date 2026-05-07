/**
 * EIP-712 claim voucher for RewardsClaimVault (matches contracts/RewardsClaimVault.sol).
 */

import { type Address, type Hex, createPublicClient, http, keccak256, stringToHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const NONCES_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const CLAIM_EIP712_TYPES = {
  Claim: [
    { name: 'beneficiary', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'ptsConsumed', type: 'uint256' },
    { name: 'requestId', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export function buildClaimDomain(args: { chainId: number; verifyingContract: Address }) {
  return {
    name: 'KasparexRewardsPool',
    version: '1',
    chainId: BigInt(args.chainId),
    verifyingContract: args.verifyingContract,
  };
}

const publicClients = new Map<string, ReturnType<typeof createPublicClient>>();

function getPublicClient(rpcUrl: string) {
  let c = publicClients.get(rpcUrl);
  if (!c) {
    c = createPublicClient({ transport: http(rpcUrl) });
    publicClients.set(rpcUrl, c);
  }
  return c;
}

export async function readVaultNonce(rpcUrl: string, vault: Address, beneficiary: Address): Promise<bigint> {
  const client = getPublicClient(rpcUrl);
  return client.readContract({
    address: vault,
    abi: NONCES_ABI,
    functionName: 'nonces',
    args: [beneficiary],
  });
}

export async function signClaimVoucher(args: {
  rpcUrl: string;
  privateKey: Hex;
  chainId: number;
  vault: Address;
  beneficiary: Address;
  token: Address;
  amount: bigint;
  ptsConsumed: bigint;
  requestId: Hex;
  deadline: bigint;
}): Promise<{ signature: Hex; nonce: bigint }> {
  const nonce = await readVaultNonce(args.rpcUrl, args.vault, args.beneficiary);
  const account = privateKeyToAccount(args.privateKey);
  const domain = buildClaimDomain({ chainId: args.chainId, verifyingContract: args.vault });
  const message = {
    beneficiary: args.beneficiary,
    token: args.token,
    amount: args.amount,
    ptsConsumed: args.ptsConsumed,
    requestId: args.requestId,
    nonce,
    deadline: args.deadline,
  };
  const signature = await account.signTypedData({
    domain,
    types: CLAIM_EIP712_TYPES,
    primaryType: 'Claim',
    message,
  });
  return { signature, nonce };
}

/** Deterministic bytes32 from an arbitrary id string (fits redemption job id). */
export function requestIdBytes32FromJobId(jobId: string): Hex {
  return keccak256(stringToHex(jobId));
}
