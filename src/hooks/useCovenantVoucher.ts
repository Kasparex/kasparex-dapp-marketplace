'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  buildVoucherCommitNote,
  getVoucherSimulator,
  kasToSompiString,
  payCovenantTreasury,
  randomHex,
  sha256Hex,
  type VoucherLock,
} from '@/lib/covenant';

export function useCovenantVoucher() {
  const { state } = useKaspaWallet();
  const sim = getVoucherSimulator();
  const [vouchers, setVouchers] = useState<VoucherLock[]>([]);
  const [openVouchers, setOpenVouchers] = useState<VoucherLock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setOpenVouchers(await sim.listOpen());
      if (state.address) {
        setVouchers(await sim.listForAddress(state.address));
      } else {
        setVouchers([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [sim, state.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createVoucher = useCallback(
    async (args: { amountKas: number; memo: string; expiresAt: Date }) => {
      if (!state.isConnected || !state.address || !state.provider) {
        throw new Error('Connect wallet first');
      }
      const secret = `kpx-${randomHex(16)}`;
      const secretHash = await sha256Hex(secret);
      const amountSompi = kasToSompiString(args.amountKas);
      const draftId = `draft_${Date.now()}`;
      const lockTxHash = await payCovenantTreasury({
        provider: state.provider as KaspaWalletProvider,
        userAddress: state.address,
        amountSompi,
        note: buildVoucherCommitNote({ voucherId: draftId, amountSompi, secretHash }),
        dappId: 'covenant-voucher',
        actionType: 'covenant-voucher-lock',
        amountKas: args.amountKas,
      });
      const voucher = await sim.create({
        creator: state.address,
        amountSompi,
        secretHash,
        memo: args.memo,
        expiresAt: args.expiresAt.getTime(),
        lockTxHash,
      });
      await refresh();
      return { voucher, secret };
    },
    [refresh, sim, state.address, state.isConnected, state.provider]
  );

  const claimVoucher = useCallback(
    async (voucherId: string, secret: string) => {
      if (!state.address) throw new Error('Connect wallet first');
      const v = await sim.claim(voucherId, secret, state.address);
      await refresh();
      return v;
    },
    [refresh, sim, state.address]
  );

  return { vouchers, openVouchers, loading, error, refresh, createVoucher, claimVoucher };
}
