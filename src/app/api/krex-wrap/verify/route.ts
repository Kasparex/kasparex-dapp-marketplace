import { NextRequest, NextResponse } from 'next/server';
import {
  getBridgeVaultAddress,
  getKrexWrapTick,
  getMigrateSinkAddress,
  isKrexMigrateV2Enabled,
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
  /** `sink` for v2 keyless burn; `vault` for v1. */
  mode?: 'sink' | 'vault';
};

function parseNetwork(raw: unknown): Krc20BridgeNetwork {
  return raw === 'testnet-10' ? 'testnet-10' : 'mainnet';
}

/**
 * Soft-verify a bridge burn/deposit against Kasplex KRC-20 ops.
 * Does not mint; attestor / operators use this as an eligibility check.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const network = parseNetwork(body.network);
  const preferSink = body.mode === 'sink' || (body.mode !== 'vault' && isKrexMigrateV2Enabled());
  const target = preferSink ? getMigrateSinkAddress(network) : getBridgeVaultAddress(network);
  if (!target) {
    return NextResponse.json(
      { ok: false, error: preferSink ? 'Bridge sink is not available on this network' : 'Bridge vault is not available on this network' },
      { status: 503 },
    );
  }

  const txHash = body.depositTxHash?.trim().toLowerCase();
  if (!txHash || !/^[a-f0-9]{64}$/.test(txHash)) {
    return NextResponse.json({ ok: false, error: 'depositTxHash must be a 64-char hex tx id' }, { status: 400 });
  }

  const tick = (body.tick || getKrexWrapTick()).trim().toUpperCase();
  if (!tick || tick.length < 4 || tick.length > 6) {
    return NextResponse.json({ ok: false, error: 'tick must be a 4–6 character KRC-20 ticker' }, { status: 400 });
  }

  const targetNorm = stripKaspaAddressHrp(target).toLowerCase();
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
        opAccept?: string | number | boolean;
        txAccept?: string | number | boolean;
      }>;
    };
    const ops = Array.isArray(json.result) ? json.result : [];
    const match = ops.find((op) => {
      const opTick = (op.tick || '').toUpperCase();
      const to = stripKaspaAddressHrp(op.to || '').toLowerCase();
      const from = stripKaspaAddressHrp(op.from || '').toLowerCase();
      const isTransfer = (op.op || '').toLowerCase() === 'transfer';
      const toTarget = to === targetNorm;
      const fromWallet = !walletNorm || from === walletNorm;
      return isTransfer && opTick === tick && toTarget && fromWallet;
    });

    if (!match) {
      return NextResponse.json({
        ok: false,
        verified: false,
        txHash,
        tick,
        network,
        error: preferSink
          ? 'No matching KRC-20 transfer to the keyless sink found for this tx yet'
          : 'No matching KRC-20 transfer to the bridge vault found for this tx yet',
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
      mode: preferSink ? 'sink' : 'vault',
      target,
      vault: preferSink ? undefined : target,
      sink: preferSink ? target : undefined,
      from: match.from,
      to: match.to,
      amountRaw: match.amt,
      amount: amountHuman,
      amountKrex: amountHuman,
      claimedAmount: claimed,
      opAccept: match.opAccept ?? null,
      txAccept: match.txAccept ?? null,
      status: preferSink ? 'burned' : 'pending_mint',
      note: preferSink
        ? 'Burn verified toward keyless sink. Attestor must require opAccept before mint.'
        : 'Deposit verified. KCC20 mint is fulfilled when mint is live for this tick.',
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
