import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { verifyL1CrowdKasTipTx } from '@/lib/donations/verifyL1TipTx';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';

const CHAIN_ID = 38833;
const SOMPI_TO_WEI = 10n ** 10n;

const CAMPAIGNS_BY_ID_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'campaignsById',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'address', name: 'creator', type: 'address' },
      { internalType: 'uint8', name: 'method', type: 'uint8' },
      { internalType: 'uint256', name: 'targetWei', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'uint256', name: 'raisedWei', type: 'uint256' },
      { internalType: 'uint256', name: 'donorCount', type: 'uint256' },
      { internalType: 'string', name: 'ipfsHash', type: 'string' },
      { internalType: 'string', name: 'l1Address', type: 'string' },
      { internalType: 'bool', name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      txHash?: string;
      campaignId?: string;
      donorL2?: string;
      tipToKaspaAddress?: string;
      minAmountKas?: number;
      payerKaspaAddress?: string;
    };

    const rawHash = body.txHash ?? '';
    const txHash = extractKaspaTransactionId(rawHash) ?? rawHash.trim().replace(/^0x/i, '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(txHash)) {
      return NextResponse.json({ ok: false, error: 'Invalid Kaspa transaction id' }, { status: 400 });
    }

    const campaignId = (body.campaignId ?? '').trim();
    const donorL2 = (body.donorL2 ?? '').trim();
    const tipToKaspaAddress = (body.tipToKaspaAddress ?? '').trim();
    const payerKaspaAddress = (body.payerKaspaAddress ?? '').trim();
    const minAmountKas = typeof body.minAmountKas === 'number' ? body.minAmountKas : Number(body.minAmountKas);

    if (!campaignId || !/^\d+$/.test(campaignId)) {
      return NextResponse.json({ ok: false, error: 'Invalid campaign id' }, { status: 400 });
    }
    if (!donorL2 || !/^0x[0-9a-fA-F]{40}$/.test(donorL2)) {
      return NextResponse.json({ ok: false, error: 'Invalid donor EVM address' }, { status: 400 });
    }
    if (!tipToKaspaAddress || !payerKaspaAddress) {
      return NextResponse.json({ ok: false, error: 'Missing tip or payer Kaspa address' }, { status: 400 });
    }
    if (!Number.isFinite(minAmountKas) || minAmountKas <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
    }

    let donorChecksum: `0x${string}`;
    try {
      donorChecksum = ethers.getAddress(donorL2) as `0x${string}`;
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid donor EVM address' }, { status: 400 });
    }

    const escrowAddr = getContractAddress(CHAIN_ID, 'DonationEscrowV2');
    if (!escrowAddr) {
      return NextResponse.json({ ok: false, error: 'DonationEscrowV2 is not configured' }, { status: 500 });
    }

    const rpc = (process.env.IGRA_MAINNET_RPC_URL || process.env.NEXT_PUBLIC_IGRA_MAINNET_RPC_URL || '').trim();
    if (!rpc) {
      return NextResponse.json(
        {
          ok: true,
          recorded: false,
          verified: false,
          error: 'Server RPC is not configured (set IGRA_MAINNET_RPC_URL). Tip was not recorded on L2.',
        },
        { status: 200 }
      );
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const view = new ethers.Contract(escrowAddr, CAMPAIGNS_BY_ID_ABI, provider);
    const row = await view.campaignsById(BigInt(campaignId));
    const onChainL1 = String(row.l1Address ?? '').trim();
    if (!onChainL1) {
      return NextResponse.json({ ok: false, error: 'Campaign has no L1 tip address on-chain yet.' }, { status: 400 });
    }

    let onChainNorm: string;
    let tipToNorm: string;
    try {
      onChainNorm = normalizeKaspaAddress(onChainL1);
      tipToNorm = normalizeKaspaAddress(tipToKaspaAddress);
    } catch (e) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Invalid Kaspa address' }, { status: 400 });
    }
    if (onChainNorm !== tipToNorm) {
      return NextResponse.json({ ok: false, error: 'Tip destination does not match this campaign’s on-chain L1 address.' }, { status: 400 });
    }

    const verified = await verifyL1CrowdKasTipTx({
      txHash,
      campaignId,
      donorL2: donorChecksum,
      tipToKaspaAddress,
      minAmountKas,
      payerKaspaAddress,
    });
    if (!verified.ok) {
      return NextResponse.json({ ok: false, error: verified.error }, { status: 400 });
    }

    const pk = (process.env.VDONATIONS_RECORDER_PRIVATE_KEY || '').trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
      return NextResponse.json({
        ok: true,
        recorded: false,
        verified: true,
        message:
          'Tip verified on Kaspa. L2 recording is disabled until VDONATIONS_RECORDER_PRIVATE_KEY is configured for the recorder wallet.',
      });
    }

    const paidWei = BigInt(verified.paidSompi) * SOMPI_TO_WEI;
    const txHashBytes32 = ethers.zeroPadValue(('0x' + txHash) as `0x${string}`, 32) as `0x${string}`;

    const wallet = new ethers.Wallet(pk, provider);
    const write = new ethers.Contract(escrowAddr, DONATION_ESCROW_V2_ABI, wallet);
    const tx = await write.recordL1Donation(BigInt(campaignId), txHashBytes32, donorChecksum, paidWei);
    await tx.wait();

    return NextResponse.json({ ok: true, recorded: true, verified: true, l2TxHash: tx.hash });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Record failed';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
