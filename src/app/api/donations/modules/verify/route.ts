import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyDonationsModuleUnlock } from '@/lib/donations/verifyModuleUnlockTx';
import type { DonationPaidModuleId } from '@/lib/donations/modules';
import { ethers } from 'ethers';

const SOMPI_TO_WEI = 10n ** 10n; // 1 KAS = 1e8 sompi; 1 iKAS = 1e18 wei => multiply by 1e10

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      txHash?: string;
      moduleId?: DonationPaidModuleId;
      campaignId?: string;
      payerAddress?: string;
      basePriceKas?: number;
      escrowV2Address?: string;
      creatorAddress?: string;
    };

    const rawHash = body.txHash ?? '';
    const txHash = extractKaspaTransactionId(rawHash) ?? rawHash.trim().replace(/^0x/i, '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(txHash)) {
      return NextResponse.json({ ok: false, error: 'Invalid transaction id' }, { status: 400 });
    }

    const moduleId = (body.moduleId ?? '').trim() as DonationPaidModuleId;
    const campaignId = (body.campaignId ?? '').trim();
    const payerAddress = (body.payerAddress ?? '').trim();
    const escrowV2Address = (body.escrowV2Address ?? '').trim();
    const creatorAddress = (body.creatorAddress ?? '').trim();
    const basePriceKas = typeof body.basePriceKas === 'number' ? body.basePriceKas : Number(body.basePriceKas);

    if (!moduleId || !campaignId || !payerAddress || !escrowV2Address || !creatorAddress || !Number.isFinite(basePriceKas) || basePriceKas <= 0) {
      return NextResponse.json({ ok: false, error: 'Missing module, campaign, payer, escrow, creator, or price' }, { status: 400 });
    }
    if (moduleId !== 'featured') {
      return NextResponse.json({ ok: false, error: 'Unknown module' }, { status: 400 });
    }
    if (!ethers.isAddress(escrowV2Address) || !ethers.isAddress(creatorAddress)) {
      return NextResponse.json({ ok: false, error: 'Invalid EVM address' }, { status: 400 });
    }
    if (!/^\d+$/.test(campaignId)) {
      return NextResponse.json({ ok: false, error: 'Invalid campaign id' }, { status: 400 });
    }

    const result = await verifyDonationsModuleUnlock({
      txHash,
      moduleId,
      campaignId,
      payerAddress,
      basePriceKas,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    const pk = (process.env.DONATIONS_MODULE_SIGNER_PRIVATE_KEY || process.env.MODULE_SIGNER_PRIVATE_KEY || '').trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
      return NextResponse.json({ ok: false, error: 'Server signer is not configured' }, { status: 500 });
    }

    const wallet = new ethers.Wallet(pk);
    const moduleIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(moduleId));
    const l1TxIdBytes32 = ('0x' + txHash) as `0x${string}`;
    const paidAmountWei = BigInt(result.paidSompi) * SOMPI_TO_WEI;

    const messageHash = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'address'],
        [escrowV2Address, BigInt(campaignId), moduleIdBytes32, l1TxIdBytes32, paidAmountWei, creatorAddress]
      )
    );

    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
    return NextResponse.json({
      ok: true,
      moduleIdBytes32,
      l1TxId: l1TxIdBytes32,
      paidAmountWei: paidAmountWei.toString(),
      signature,
    });
  } catch (e) {
    console.error('[donations/modules/verify]', e);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}

