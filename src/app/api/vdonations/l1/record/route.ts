/**
 * Kasparex vDonations L1 record API
 * POST /api/vdonations/l1/record
 * Verifies L1 donation tx and records it on L2 for points (idempotent by tx hash).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getTransactionByHash, sompisToKas } from '@/lib/kaspa/api';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import { igraGalleonTestnet } from '@/lib/wagmi';
import { VDONATIONS_MIN_DONATION_KAS } from '@/lib/donations/config';

const CHAIN_ID = 38836; // IGRA Galleon Testnet
const MIN_DONATION_SOMPIS = VDONATIONS_MIN_DONATION_KAS * 1e8;

export interface VDonationsL1RecordBody {
  donationTxHash: string;
  creatorAddress: string; // L2 address (campaign creator)
  donorL2Address: string;  // L2 address to award points to
  feeTxHash?: string;
}

/** Normalize Kaspa address for comparison (lowercase, no kaspa: prefix) */
function normalizeKaspaAddress(addr: string): string {
  return (addr || '').replace(/^kaspa:/i, '').toLowerCase().trim();
}

/** Extract output amount in sompis and recipient from Kaspa API tx shape (supports multiple API response formats) */
function parseTxOutputs(tx: Record<string, unknown>): { address: string; amountSompis: number }[] {
  const out: { address: string; amountSompis: number }[] = [];
  const outputs =
    (tx.outputs as Array<{ amount?: number | string; scriptPublicKey?: { address?: string }; address?: string }>) ??
    (tx as { verboseData?: { outputs?: Array<{ amount?: number | string; scriptPublicKey?: { address?: string }; address?: string }> } }).verboseData?.outputs ??
    [];
  for (const o of outputs) {
    const amount = o.amount != null ? (typeof o.amount === 'string' ? parseFloat(o.amount) : o.amount) : 0;
    const addr = (o.scriptPublicKey?.address ?? o.address ?? '').trim();
    if (addr && !isNaN(amount)) out.push({ address: normalizeKaspaAddress(addr), amountSompis: amount });
  }
  return out;
}

/** Convert tx hash string to bytes32 (0x + 64 hex chars) */
function txHashToBytes32(txHash: string): `0x${string}` {
  const h = txHash.replace(/^0x/, '');
  if (h.length !== 64) throw new Error('Invalid tx hash length');
  return `0x${h}` as `0x${string}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as VDonationsL1RecordBody;
    const { donationTxHash, creatorAddress, donorL2Address } = body;

    if (!donationTxHash?.trim() || !creatorAddress?.trim() || !donorL2Address?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: donationTxHash, creatorAddress, donorL2Address' },
        { status: 400 }
      );
    }

    const hashNorm = donationTxHash.replace(/^0x/, '');
    if (!/^[0-9a-fA-F]{64}$/.test(hashNorm)) {
      return NextResponse.json({ success: false, error: 'Invalid donationTxHash format' }, { status: 400 });
    }

    const escrowAddress = getContractAddress(CHAIN_ID, 'DonationEscrow');
    if (!escrowAddress) {
      return NextResponse.json({ success: false, error: 'DonationEscrow not configured for this network' }, { status: 500 });
    }

    const rpcUrl = process.env.IGRA_GALLEON_TESTNET_RPC || process.env.NEXT_PUBLIC_IGRA_GALLEON_TESTNET_RPC || 'https://galleon-testnet.igralabs.com:8545';
    const publicClient = createPublicClient({
      chain: igraGalleonTestnet,
      transport: http(rpcUrl),
    });

    const campaign = await publicClient.readContract({
      address: escrowAddress as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'campaigns',
      args: [creatorAddress as Address],
    });

    // readContract returns a tuple: [creator, targetWei, deadline, raisedWei, donorCount, ipfsHash, l1Address, active]
    type CampaignTuple = readonly [Address, bigint, bigint, bigint, bigint, string, string, boolean];
    const tuple = campaign as unknown as CampaignTuple;
    const creatorZero = '0x0000000000000000000000000000000000000000';
    if (!tuple || tuple[0] === creatorZero) {
      return NextResponse.json({ success: false, error: 'Campaign not found for this creator' }, { status: 404 });
    }

    const l1AddressFromContract = tuple[6];
    const l1AddressNorm = normalizeKaspaAddress(l1AddressFromContract);
    if (!l1AddressNorm) {
      return NextResponse.json({ success: false, error: 'Campaign has no L1 address' }, { status: 400 });
    }

    const tx = await getTransactionByHash(hashNorm);
    if (!tx) {
      return NextResponse.json({ success: false, error: 'Transaction not found or API unavailable' }, { status: 404 });
    }

    const outputs = parseTxOutputs(tx);
    const toCreator = outputs.find((o) => o.address === l1AddressNorm && o.amountSompis >= MIN_DONATION_SOMPIS);
    if (!toCreator) {
      return NextResponse.json(
        { success: false, error: 'No output to campaign L1 address with amount >= 100 KAS' },
        { status: 400 }
      );
    }

    const recorderPk = process.env.VDONATIONS_RECORDER_PRIVATE_KEY?.trim();
    if (!recorderPk) {
      return NextResponse.json({ success: false, error: 'Recorder not configured' }, { status: 500 });
    }

    const account = privateKeyToAccount(recorderPk as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: igraGalleonTestnet,
      transport: http(rpcUrl),
    });

    const amountWei = BigInt(Math.floor(sompisToKas(toCreator.amountSompis) * 1e18));
    const txHashBytes32 = txHashToBytes32(hashNorm);

    await walletClient.writeContract({
      address: escrowAddress as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'recordL1Donation',
      args: [creatorAddress as Address, txHashBytes32, donorL2Address as Address, amountWei],
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    if (msg.includes('AlreadyRecorded') || msg.includes('already recorded')) {
      return NextResponse.json({ success: false, error: 'This donation was already recorded' }, { status: 409 });
    }
    console.error('vDonations L1 record error:', e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
