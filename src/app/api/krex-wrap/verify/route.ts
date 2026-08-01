import { NextRequest, NextResponse } from 'next/server';
import { getKrexWrapTick, getKrexWrapVaultAddress } from '@/lib/krex/wrap/config';
import { stripKaspaAddressHrp } from '@/lib/kaspa/sdk';

export const runtime = 'edge';

type Body = {
  depositTxHash?: string;
  wallet?: string;
  amountKrex?: number;
};

/**
 * Soft-verify a wrap deposit against Kasplex KRC-20 ops for the vault address.
 * Does not mint; operators / watcher use this as an eligibility check.
 */
export async function POST(req: NextRequest) {
  const vault = getKrexWrapVaultAddress();
  if (!vault) {
    return NextResponse.json({ ok: false, error: 'Wrap vault is not configured' }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const txHash = body.depositTxHash?.trim().toLowerCase();
  if (!txHash || !/^[a-f0-9]{64}$/.test(txHash)) {
    return NextResponse.json({ ok: false, error: 'depositTxHash must be a 64-char hex tx id' }, { status: 400 });
  }

  const tick = getKrexWrapTick().toUpperCase();
  const vaultNorm = stripKaspaAddressHrp(vault).toLowerCase();
  const walletNorm = body.wallet ? stripKaspaAddressHrp(body.wallet).toLowerCase() : null;

  try {
    const url = `https://api.kasplex.org/v1/krc20/oplist?tick=${encodeURIComponent(tick)}&txId=${encodeURIComponent(txHash)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Kasplex indexer returned ${res.status}`, txHash },
        { status: 502 },
      );
    }
    const json = (await res.json()) as {
      result?: Array<{
        op?: string;
        tick?: string;
        amt?: string;
        to?: string;
        from?: string;
        txId?: string;
        hashRev?: string;
      }>;
    };
    const ops = Array.isArray(json.result) ? json.result : [];
    const match = ops.find((op) => {
      const opTick = (op.tick || '').toUpperCase();
      const to = stripKaspaAddressHrp(op.to || '').toLowerCase();
      const from = stripKaspaAddressHrp(op.from || '').toLowerCase();
      const isTransfer = (op.op || '').toLowerCase() === 'transfer';
      const toVault = to === vaultNorm;
      const fromWallet = !walletNorm || from === walletNorm;
      return isTransfer && opTick === tick && toVault && fromWallet;
    });

    if (!match) {
      return NextResponse.json({
        ok: false,
        verified: false,
        txHash,
        error: 'No matching KRC-20 transfer to the wrap vault found for this tx yet',
      });
    }

    const amtRaw = match.amt ? Number(match.amt) : NaN;
    const amountHuman = Number.isFinite(amtRaw) ? amtRaw / 1e8 : null;

    return NextResponse.json({
      ok: true,
      verified: true,
      txHash,
      tick,
      vault,
      from: match.from,
      to: match.to,
      amountRaw: match.amt,
      amountKrex: amountHuman,
      status: 'pending_mint',
      note: 'Deposit verified. KCC20 mint is fulfilled by the wrap watcher once mintLive is true.',
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Verify failed',
        txHash,
      },
      { status: 502 },
    );
  }
}
