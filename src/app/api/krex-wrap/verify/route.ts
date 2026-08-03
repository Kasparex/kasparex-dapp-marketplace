import { NextRequest, NextResponse } from 'next/server';
import {
  getBridgeVaultAddress,
  getKrexWrapTick,
  kasplexApiBaseForNetwork,
} from '@/lib/krex/wrap/config';
import { stripKaspaAddressHrp } from '@/lib/kaspa/sdk';
import type { Krc20BridgeNetwork } from '@/lib/krex/wrap/types';

export const runtime = 'edge';

type Body = {
  depositTxHash?: string;
  wallet?: string;
  tick?: string;
  network?: Krc20BridgeNetwork;
  amount?: number;
  /** @deprecated Prefer `amount`. */
  amountKrex?: number;
};

function parseNetwork(raw: unknown): Krc20BridgeNetwork {
  return raw === 'testnet-10' ? 'testnet-10' : 'mainnet';
}

/**
 * Soft-verify a bridge deposit against Kasplex KRC-20 ops for the vault address.
 * Does not mint; operators / watcher use this as an eligibility check.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const network = parseNetwork(body.network);
  const vault = getBridgeVaultAddress(network);
  if (!vault) {
    return NextResponse.json({ ok: false, error: 'Bridge vault is not available on this network' }, { status: 503 });
  }

  const txHash = body.depositTxHash?.trim().toLowerCase();
  if (!txHash || !/^[a-f0-9]{64}$/.test(txHash)) {
    return NextResponse.json({ ok: false, error: 'depositTxHash must be a 64-char hex tx id' }, { status: 400 });
  }

  const tick = (body.tick || getKrexWrapTick()).trim().toUpperCase();
  if (!tick || tick.length < 4 || tick.length > 6) {
    return NextResponse.json({ ok: false, error: 'tick must be a 4–6 character KRC-20 ticker' }, { status: 400 });
  }

  const vaultNorm = stripKaspaAddressHrp(vault).toLowerCase();
  const walletNorm = body.wallet ? stripKaspaAddressHrp(body.wallet).toLowerCase() : null;
  const apiBase = kasplexApiBaseForNetwork(network);

  try {
    const url = `${apiBase}/v1/krc20/oplist?tick=${encodeURIComponent(tick)}&txId=${encodeURIComponent(txHash)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Kasplex indexer returned ${res.status}`, txHash, network },
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
        tick,
        network,
        error: 'No matching KRC-20 transfer to the bridge vault found for this tx yet',
      });
    }

    const amtRaw = match.amt ? Number(match.amt) : NaN;
    const amountHuman = Number.isFinite(amtRaw) ? amtRaw / 1e8 : null;
    const claimed = body.amount ?? body.amountKrex ?? null;

    return NextResponse.json({
      ok: true,
      verified: true,
      txHash,
      tick,
      network,
      vault,
      from: match.from,
      to: match.to,
      amountRaw: match.amt,
      amount: amountHuman,
      amountKrex: amountHuman,
      claimedAmount: claimed,
      status: 'pending_mint',
      note: 'Deposit verified. KCC20 mint is fulfilled when mint is live for this tick.',
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Verify failed',
        txHash,
        network,
      },
      { status: 502 },
    );
  }
}
